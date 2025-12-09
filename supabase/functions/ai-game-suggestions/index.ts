import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's game progress
    const { data: progress } = await supabase
      .from('game_progress')
      .select('game_id, highest_level_completed, total_stars')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10);

    // Fetch user's recent game plays
    const { data: recentPlays } = await supabase
      .from('game_plays')
      .select('game_id')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(20);

    // Fetch available games
    const { data: allGames } = await supabase
      .from('games')
      .select('id, title, genre, difficulty, description')
      .eq('is_active', true);

    // Build context for AI
    const playedGameIds = new Set(recentPlays?.map(p => p.game_id) || []);
    const playedGames = allGames?.filter(g => playedGameIds.has(g.id)) || [];
    const unplayedGames = allGames?.filter(g => !playedGameIds.has(g.id)) || [];

    const progressSummary = progress?.map(p => {
      const game = allGames?.find(g => g.id === p.game_id);
      return `${game?.title || 'Unknown'}: Level ${p.highest_level_completed}, ${p.total_stars} stars`;
    }).join(', ') || 'No progress yet';

    const playedGenres = [...new Set(playedGames.map(g => g.genre))];
    const favoriteGenres = playedGenres.length > 0 ? playedGenres.join(', ') : 'Unknown';

    const systemPrompt = `You are a friendly AI assistant for Fun Planet, a kid-friendly gaming platform. 
Your job is to suggest games that will help children learn, be creative, and have fun.

Guidelines:
- Suggest games that match the child's interests and skill level
- Encourage exploration of new genres they haven't tried
- Focus on educational value and fun
- Keep responses short and encouraging
- Use simple, kid-friendly language with emojis

Available games to suggest from:
${unplayedGames.slice(0, 15).map(g => `- ${g.title} (${g.genre}, ${g.difficulty}): ${g.description?.slice(0, 50)}...`).join('\n')}`;

    const userPrompt = `Based on this player's activity, suggest 3-5 games they should try next:

Favorite genres: ${favoriteGenres}
Recent progress: ${progressSummary}
Games played: ${playedGames.length}

Please provide personalized suggestions with brief reasons why each game would be great for them.`;

    console.log('Calling Lovable AI for game suggestions...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const suggestions = aiResponse.choices?.[0]?.message?.content || 'No suggestions available.';

    // Also return some game data for UI
    const suggestedGames = unplayedGames.slice(0, 5).map(g => ({
      id: g.id,
      title: g.title,
      genre: g.genre,
      difficulty: g.difficulty,
      description: g.description
    }));

    console.log('AI suggestions generated successfully');

    return new Response(JSON.stringify({
      suggestions,
      suggestedGames,
      playerStats: {
        gamesPlayed: playedGames.length,
        favoriteGenres: playedGenres,
        totalProgress: progress?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-game-suggestions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
