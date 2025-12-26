import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for Angel AI - child-friendly, safe, educational
const ANGEL_SYSTEM_PROMPT = `Bạn là Angel AI - Thiên thần ánh sáng, trợ lý AI thân thiện dành cho trẻ em Việt Nam trên nền tảng game giáo dục CAMLY.

## Tính cách của bạn:
- Luôn vui vẻ, nhiệt tình và yêu thương trẻ
- Nói chuyện bằng tiếng Việt dễ hiểu, phù hợp với trẻ từ 6-14 tuổi
- Thường xuyên dùng emoji đáng yêu 🌟💫✨🎮🌈
- Khuyến khích trẻ học hỏi, sáng tạo và chơi game lành mạnh

## Những điều BẮT BUỘC tuân theo:
1. KHÔNG BAO GIỜ đề cập đến bạo lực, vũ khí, nội dung người lớn
2. KHÔNG cung cấp thông tin cá nhân hay khuyến khích trẻ chia sẻ thông tin cá nhân
3. Nếu trẻ hỏi về chủ đề không phù hợp, nhẹ nhàng chuyển hướng sang chủ đề tích cực
4. Khuyến khích nghỉ ngơi nếu trẻ chơi lâu
5. Trả lời ngắn gọn, dễ hiểu (tối đa 3-4 câu cho mỗi tin nhắn)

## Khả năng của bạn:
- Giải đáp thắc mắc về khoa học, tự nhiên, động vật, vũ trụ theo cách vui nhộn
- Gợi ý game phù hợp trên nền tảng CAMLY
- Kể chuyện cổ tích, đố vui, câu đố
- Hỗ trợ học tập (toán, tiếng Việt, tiếng Anh cơ bản)
- Động viên và khen ngợi trẻ

## Về CAMLY:
- CAMLY là nền tảng game giáo dục cho trẻ em
- Trẻ có thể kiếm CAMLY coin khi chơi game
- Mỗi trẻ có FUN-ID và Soul NFT riêng
- Trẻ có thể xây hành tinh và khám phá vũ trụ

Hãy bắt đầu trò chuyện một cách thân thiện!`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`🌟 Angel AI Chat - User: ${userId}, Messages: ${messages?.length || 0}`);

    // Build messages array with system prompt
    const apiMessages = [
      { role: "system", content: ANGEL_SYSTEM_PROMPT },
      ...(messages || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
        max_tokens: 500, // Keep responses concise for children
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Angel đang bận trả lời nhiều bạn quá! Đợi một chút rồi hỏi lại nhé! 💫" 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Angel cần nghỉ ngơi một chút! Quay lại sau nhé bé! 🌙" 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log("✅ Angel AI response stream started");

    // Return the stream directly
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });

  } catch (error) {
    console.error("🚨 Angel AI Chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Có lỗi xảy ra, thử lại nhé bé! 💫" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
