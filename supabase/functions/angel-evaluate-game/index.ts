import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANGEL_EVALUATOR_PROMPT = `Bạn là Angel AI - Thiên Thần Đánh Giá Game của FUN Planet.
Sứ mệnh: Bảo vệ trẻ em khỏi nội dung không phù hợp và đánh giá giá trị giáo dục của game.

Hãy đánh giá game này theo các tiêu chí sau:

## 1. ĐÁNH GIÁ BẠO LỰC (0-10)
- 0-2: Không có bạo lực
- 3-4: Bạo lực hoạt hình nhẹ (đánh nhau không đau)
- 5-6: Bạo lực hoạt hình vừa (có vũ khí nhưng không máu me)
- 7-8: Bạo lực đáng lo ngại (máu, vũ khí thực tế)
- 9-10: Bạo lực không phù hợp trẻ em

## 2. PHÁT HIỆN LOOTBOX/GAMBLING
- Có cơ chế lootbox (hộp quà ngẫu nhiên)?
- Có yếu tố cờ bạc/may rủi liên quan tiền?
- Có áp lực chi tiền không cần thiết?

## 3. ĐÁNH GIÁ TÍNH GIÁO DỤC (0-10)
- 0-2: Không có giá trị giáo dục
- 3-4: Có yếu tố giải trí lành mạnh
- 5-6: Có giá trị học hỏi cơ bản
- 7-8: Giáo dục tốt, phát triển kỹ năng
- 9-10: Xuất sắc về giáo dục

## 4. ĐỀ XUẤT ĐỘ TUỔI
- "3+": An toàn cho trẻ nhỏ nhất
- "6+": Phù hợp từ 6 tuổi
- "9+": Phù hợp từ 9 tuổi
- "12+": Phù hợp từ 12 tuổi
- "Not suitable": Không phù hợp FUN Planet

## 5. PHÂN TÍCH HÌNH ẢNH THUMBNAIL (nếu có)
- Có nội dung bạo lực trực quan (máu, vũ khí, xác chết)?
- Có hình ảnh khiêu gợi hoặc không phù hợp?
- Có biểu tượng đáng ngờ (ma quỷ, phản cảm)?
- Có text không phù hợp trong ảnh?
- Ảnh có chất lượng và phù hợp cho trẻ em?

Trả về JSON với format chính xác theo function schema.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { game_id, title, description, categories, thumbnail_url } = await req.json()

    if (!game_id || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: game_id, title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Angel AI] Evaluating game: ${title} (${game_id})`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

    if (!lovableApiKey) {
      console.error('[Angel AI] LOVABLE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build the prompt with game info
    const gameInfo = `
THÔNG TIN GAME CẦN ĐÁNH GIÁ:
- Tên game: ${title}
- Mô tả: ${description || 'Không có mô tả'}
- Thể loại: ${categories?.join(', ') || 'Không xác định'}
- Có hình thumbnail: ${thumbnail_url ? 'Có' : 'Không'}

Hãy đánh giá game này dựa trên thông tin trên.`

    // Prepare messages with optional image for vision analysis
    const userContent: any[] = [{ type: 'text', text: gameInfo }]
    
    // Try to fetch thumbnail for vision analysis
    let thumbnailBase64: string | null = null
    if (thumbnail_url) {
      try {
        console.log(`[Angel AI] Fetching thumbnail for vision analysis: ${thumbnail_url}`)
        const imageResponse = await fetch(thumbnail_url)
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer()
          const bytes = new Uint8Array(imageBuffer)
          // Check image size - limit to 4MB for base64
          if (bytes.length < 4 * 1024 * 1024) {
            let binary = ''
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i])
            }
            thumbnailBase64 = btoa(binary)
            
            // Detect mime type from URL
            const ext = thumbnail_url.toLowerCase().split('.').pop()?.split('?')[0] || 'jpeg'
            const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
            
            userContent.push({
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${thumbnailBase64}` }
            })
            console.log(`[Angel AI] Thumbnail loaded for vision analysis (${bytes.length} bytes)`)
          } else {
            console.log(`[Angel AI] Thumbnail too large for vision analysis: ${bytes.length} bytes`)
          }
        }
      } catch (imgError) {
        console.warn('[Angel AI] Failed to fetch thumbnail for vision:', imgError)
        // Continue without image analysis
      }
    }

    // Call Lovable AI Gateway with tool calling for structured output
    // Use gemini-2.5-pro for vision analysis if we have an image
    const model = thumbnailBase64 ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash'
    console.log(`[Angel AI] Using model: ${model}`)

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: ANGEL_EVALUATOR_PROMPT },
          { role: 'user', content: userContent }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'evaluate_game',
              description: 'Đánh giá game và trả về kết quả chi tiết',
              parameters: {
                type: 'object',
                properties: {
                  overall_score: {
                    type: 'number',
                    description: 'Điểm tổng thể 0-100'
                  },
                  is_safe_for_kids: {
                    type: 'boolean',
                    description: 'Game có an toàn cho trẻ em không'
                  },
                  recommended_age: {
                    type: 'string',
                    enum: ['3+', '6+', '9+', '12+', 'Not suitable'],
                    description: 'Độ tuổi đề xuất'
                  },
                  violence: {
                    type: 'object',
                    properties: {
                      score: { type: 'number', description: 'Điểm bạo lực 0-10' },
                      types: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Loại bạo lực: cartoon, realistic, weapons, blood, none'
                      },
                      details: { type: 'string', description: 'Chi tiết đánh giá bạo lực' }
                    },
                    required: ['score', 'types', 'details']
                  },
                  monetization: {
                    type: 'object',
                    properties: {
                      has_lootbox: { type: 'boolean' },
                      has_gambling: { type: 'boolean' },
                      concerns: { type: 'array', items: { type: 'string' } },
                      details: { type: 'string' }
                    },
                    required: ['has_lootbox', 'has_gambling', 'concerns', 'details']
                  },
                  educational: {
                    type: 'object',
                    properties: {
                      score: { type: 'number', description: 'Điểm giáo dục 0-10' },
                      categories: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'math, logic, creativity, language, science, social'
                      },
                      learning_outcomes: { type: 'array', items: { type: 'string' } },
                      details: { type: 'string' }
                    },
                    required: ['score', 'categories', 'learning_outcomes', 'details']
                  },
                  thumbnail_analysis: {
                    type: 'object',
                    properties: {
                      is_appropriate: { type: 'boolean', description: 'Hình ảnh có phù hợp cho trẻ em không' },
                      concerns: { type: 'array', items: { type: 'string' }, description: 'Các vấn đề phát hiện trong ảnh' },
                      detected_elements: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'violence, suggestive, scary, text_inappropriate, weapons, blood, occult'
                      },
                      quality_score: { type: 'number', description: 'Chất lượng ảnh 1-10' },
                      details: { type: 'string', description: 'Chi tiết phân tích ảnh' }
                    },
                    required: ['is_appropriate', 'concerns', 'detected_elements', 'quality_score', 'details']
                  },
                  themes: { type: 'array', items: { type: 'string' } },
                  positive_aspects: { type: 'array', items: { type: 'string' } },
                  concerns: { type: 'array', items: { type: 'string' } },
                  summary: { type: 'string', description: 'Tóm tắt đánh giá 2-3 câu' },
                  confidence: { type: 'number', description: 'Độ tin cậy 0-1' }
                },
                required: ['overall_score', 'is_safe_for_kids', 'recommended_age', 'violence', 'monetization', 'educational', 'themes', 'positive_aspects', 'concerns', 'summary', 'confidence']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'evaluate_game' } }
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('[Angel AI] AI Gateway error:', aiResponse.status, errorText)
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'AI evaluation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await aiResponse.json()
    console.log('[Angel AI] Raw response received')

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    if (!toolCall || toolCall.function.name !== 'evaluate_game') {
      console.error('[Angel AI] No valid tool call in response')
      return new Response(
        JSON.stringify({ error: 'AI response format error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const evaluation = JSON.parse(toolCall.function.arguments)
    console.log('[Angel AI] Parsed evaluation:', JSON.stringify(evaluation))

    // Check for auto-reject conditions
    const autoRejectReasons: string[] = []
    const violenceScore = evaluation.violence?.score || 0
    const hasGambling = evaluation.monetization?.has_gambling || false
    const thumbnailInappropriate = evaluation.thumbnail_analysis?.is_appropriate === false
    const notSuitable = evaluation.recommended_age === 'Not suitable'

    if (violenceScore > 7) {
      autoRejectReasons.push(`Mức độ bạo lực quá cao (${violenceScore}/10): ${evaluation.violence?.details || 'Nội dung bạo lực không phù hợp'}`)
    }
    if (hasGambling) {
      autoRejectReasons.push(`Phát hiện yếu tố cờ bạc: ${evaluation.monetization?.details || 'Game có cơ chế gambling'}`)
    }
    if (thumbnailInappropriate) {
      autoRejectReasons.push(`Hình ảnh thumbnail không phù hợp: ${evaluation.thumbnail_analysis?.details || 'Ảnh chứa nội dung không phù hợp trẻ em'}`)
    }
    if (notSuitable) {
      autoRejectReasons.push(`Nội dung không phù hợp cho FUN Planet: ${evaluation.summary}`)
    }

    const shouldAutoReject = autoRejectReasons.length > 0

    // Save to database using upsert
    const { data: savedReview, error: saveError } = await supabase
      .from('game_ai_reviews')
      .upsert({
        game_id,
        overall_score: Math.min(100, Math.max(0, evaluation.overall_score)),
        is_safe_for_kids: evaluation.is_safe_for_kids,
        recommended_age: evaluation.recommended_age,
        violence_score: Math.min(10, Math.max(0, evaluation.violence?.score || 0)),
        violence_types: evaluation.violence?.types || [],
        violence_details: evaluation.violence?.details || '',
        has_lootbox: evaluation.monetization?.has_lootbox || false,
        has_gambling_mechanics: evaluation.monetization?.has_gambling || false,
        monetization_concerns: evaluation.monetization?.concerns || [],
        monetization_details: evaluation.monetization?.details || '',
        educational_score: Math.min(10, Math.max(0, evaluation.educational?.score || 0)),
        educational_categories: evaluation.educational?.categories || [],
        learning_outcomes: evaluation.educational?.learning_outcomes || [],
        educational_details: evaluation.educational?.details || '',
        // Thumbnail analysis fields
        thumbnail_is_appropriate: evaluation.thumbnail_analysis?.is_appropriate ?? true,
        thumbnail_concerns: evaluation.thumbnail_analysis?.concerns || [],
        thumbnail_detected_elements: evaluation.thumbnail_analysis?.detected_elements || [],
        thumbnail_quality_score: evaluation.thumbnail_analysis?.quality_score || null,
        thumbnail_details: evaluation.thumbnail_analysis?.details || '',
        // Auto-reject fields
        auto_rejected: shouldAutoReject,
        auto_reject_reasons: autoRejectReasons,
        detected_themes: evaluation.themes || [],
        positive_aspects: evaluation.positive_aspects || [],
        concerns: evaluation.concerns || [],
        ai_model: model,
        confidence_score: evaluation.confidence || 0.8,
        review_summary: evaluation.summary || '',
        full_ai_response: aiData,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'game_id' })
      .select()
      .single()

    if (saveError) {
      console.error('[Angel AI] Save error:', saveError)
      return new Response(
        JSON.stringify({ error: 'Failed to save evaluation', details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Angel AI] Evaluation saved for game ${game_id}`)

    // Auto-reject if conditions met
    if (shouldAutoReject) {
      console.log(`[Angel AI] Auto-rejecting game ${game_id}:`, autoRejectReasons)
      
      const rejectionNote = `[🤖 Auto-Rejected by Angel AI]\n\n${autoRejectReasons.join('\n\n')}`
      
      // Update game status to rejected
      const { error: rejectError } = await supabase
        .from('uploaded_games')
        .update({ 
          status: 'rejected',
          rejection_note: rejectionNote
        })
        .eq('id', game_id)

      if (rejectError) {
        console.error('[Angel AI] Failed to auto-reject game:', rejectError)
      } else {
        console.log(`[Angel AI] Game ${game_id} auto-rejected successfully`)
        
        // Get game info for notification
        const { data: gameData } = await supabase
          .from('uploaded_games')
          .select('user_id, title')
          .eq('id', game_id)
          .single()

        if (gameData?.user_id) {
          // Send notification to uploader
          const { error: notifError } = await supabase
            .from('user_notifications')
            .insert({
              user_id: gameData.user_id,
              notification_type: 'game_auto_rejected',
              title: '🤖 Game bị từ chối tự động',
              message: `"${gameData.title}" đã bị Angel AI từ chối do: ${autoRejectReasons[0].slice(0, 100)}...`,
              data: { 
                game_id: game_id,
                game_title: gameData.title,
                rejection_reasons: autoRejectReasons,
                ai_review_id: savedReview.id,
                auto_rejected: true
              }
            })

          if (notifError) {
            console.error('[Angel AI] Failed to send notification:', notifError)
          } else {
            console.log(`[Angel AI] Notification sent to user ${gameData.user_id}`)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        review: savedReview,
        auto_rejected: shouldAutoReject,
        auto_reject_reasons: autoRejectReasons,
        message: shouldAutoReject 
          ? `Game "${title}" đã bị tự động từ chối do vi phạm quy định`
          : `Game "${title}" đã được đánh giá: ${evaluation.recommended_age}, điểm ${evaluation.overall_score}/100`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Angel AI] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
