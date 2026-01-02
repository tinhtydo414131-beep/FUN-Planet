import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ItchioGameInfo {
  success: boolean;
  data?: {
    title: string;
    description: string;
    thumbnail: string | null;
    embedUrl: string;
    gameUrl: string;
    author: string;
    tags: string[];
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📥 Fetching Itch.io game:', url);

    // Validate Itch.io URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (!hostname.endsWith('itch.io') && hostname !== 'itch.io') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL must be from itch.io domain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch HTML from Itch.io
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch Itch.io page:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch page: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    console.log('✅ Fetched HTML, length:', html.length);

    // Parse the HTML to extract game info
    const gameInfo = parseItchioHtml(html, url);
    
    console.log('📦 Parsed game info:', JSON.stringify(gameInfo, null, 2));

    return new Response(
      JSON.stringify(gameInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseItchioHtml(html: string, originalUrl: string): ItchioGameInfo {
  try {
    // Extract title
    let title = '';
    
    // Try og:title first (most reliable)
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                         html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].replace(/ by .+$/, '').trim();
    }
    
    // Fallback to <title> tag
    if (!title) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].replace(/ by .+ - itch\.io$/, '').replace(/ - itch\.io$/, '').trim();
      }
    }
    
    // Try h1.game_title
    if (!title) {
      const h1Match = html.match(/<h1[^>]*class="[^"]*game_title[^"]*"[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) {
        title = h1Match[1].trim();
      }
    }

    // Extract description
    let description = '';
    
    // Try og:description
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                        html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i);
    if (ogDescMatch) {
      description = ogDescMatch[1].trim();
    }
    
    // Try meta description
    if (!description) {
      const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      if (metaDescMatch) {
        description = metaDescMatch[1].trim();
      }
    }
    
    // Try formatted_description div
    if (!description) {
      const descDivMatch = html.match(/<div[^>]*class="[^"]*formatted_description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (descDivMatch) {
        // Strip HTML tags and get first 500 chars
        description = descDivMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 500);
      }
    }

    // Extract thumbnail (og:image is most reliable)
    let thumbnail = null;
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                         html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    if (ogImageMatch) {
      thumbnail = ogImageMatch[1];
    }
    
    // Fallback to game_cover
    if (!thumbnail) {
      const coverMatch = html.match(/<div[^>]*class="[^"]*game_cover[^"]*"[^>]*>\s*<img[^>]+src="([^"]+)"/i);
      if (coverMatch) {
        thumbnail = coverMatch[1];
      }
    }

    // Extract author
    let author = '';
    const authorMatch = html.match(/<a[^>]*class="[^"]*user_link[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                        html.match(/<a[^>]*href="https:\/\/([^.]+)\.itch\.io"[^>]*class="[^"]*author[^"]*"[^>]*>/i);
    if (authorMatch) {
      author = authorMatch[1].trim();
    } else {
      // Try to extract from URL pattern
      const urlMatch = originalUrl.match(/https?:\/\/([^.]+)\.itch\.io/);
      if (urlMatch) {
        author = urlMatch[1];
      }
    }

    // Extract tags
    const tags: string[] = [];
    const tagMatches = html.matchAll(/<a[^>]*class="[^"]*game_tag[^"]*"[^>]*>([^<]+)<\/a>/gi);
    for (const match of tagMatches) {
      const tag = match[1].trim();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    }

    // Find embed URL
    let embedUrl = '';
    
    // Look for HTML5 embed iframe
    const embedMatch = html.match(/https:\/\/itch\.io\/embed\/(\d+)/i) ||
                       html.match(/https:\/\/html-classic\.itch\.zone\/html\/(\d+)/i) ||
                       html.match(/data-iframe_url="([^"]+)"/i);
    
    if (embedMatch) {
      if (embedMatch[1].startsWith('http')) {
        embedUrl = embedMatch[1];
      } else {
        // It's just an ID, construct the embed URL
        embedUrl = `https://itch.io/embed/${embedMatch[1]}`;
      }
    }
    
    // Look for HTML5 game player URL
    if (!embedUrl) {
      const htmlZoneMatch = html.match(/https:\/\/html-classic\.itch\.zone\/html\/[^"'\s]+/i);
      if (htmlZoneMatch) {
        embedUrl = htmlZoneMatch[0];
      }
    }
    
    // Look for v6p9d9t4 CDN (common for HTML5 games)
    if (!embedUrl) {
      const cdnMatch = html.match(/https:\/\/v6p9d9t4\.ssl\.hwcdn\.net\/html\/[^"'\s]+/i);
      if (cdnMatch) {
        embedUrl = cdnMatch[0];
      }
    }
    
    // Check if it's a playable HTML5 game
    const isHtml5 = html.includes('html_embed') || 
                    html.includes('html-classic.itch.zone') ||
                    html.includes('v6p9d9t4.ssl.hwcdn.net/html') ||
                    html.includes('Run game') ||
                    html.includes('game_frame');

    // DO NOT fallback to original URL - it's not playable!
    // Return error if no valid embed URL found
    if (!embedUrl || embedUrl === originalUrl) {
      if (!isHtml5) {
        console.log('❌ Game is not HTML5 playable - no embed URL found');
        return { 
          success: false, 
          error: 'Game này không thể chơi trực tiếp trên web. Chỉ hỗ trợ game HTML5/WebGL có thể embed.' 
        };
      }
      // If isHtml5 but no embedUrl, try constructing from original URL
      // Some games need /embed-upload path
      const pathMatch = originalUrl.match(/itch\.io\/([^\/]+)/);
      if (pathMatch) {
        embedUrl = originalUrl;
        console.log('⚠️ Using original URL as embed (may require iframe adjustment)');
      }
    }

    if (!embedUrl.includes('itch.zone') && !isHtml5) {
      console.log('⚠️ Game may not be HTML5 playable');
    }

    if (!title) {
      return { success: false, error: 'Could not extract game title from page' };
    }

    return {
      success: true,
      data: {
        title,
        description: description || `Play ${title} on Fun Planet!`,
        thumbnail,
        embedUrl,
        gameUrl: originalUrl,
        author,
        tags,
      }
    };

  } catch (error) {
    console.error('❌ Parse error:', error);
    return { success: false, error: 'Failed to parse game page' };
  }
}
