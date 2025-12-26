import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const QUIZ_PROMPT = `Tạo 5 câu hỏi trắc nghiệm đa dạng cho trẻ em 8-12 tuổi. Mỗi câu thuộc một lĩnh vực khác nhau:
1. Toán học (math) - phép tính, hình học, logic
2. Khoa học (science) - tự nhiên, động vật, thực vật, vật lý cơ bản
3. Tiếng Việt (vietnamese) - chính tả, ngữ pháp, từ vựng
4. Tiếng Anh (english) - từ vựng, cụm từ đơn giản
5. Đố vui (fun) - kiến thức tổng hợp, câu đố thú vị

Trả về JSON array:
[
  {
    "id": "1",
    "question": "Câu hỏi rõ ràng, phù hợp trẻ em",
    "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
    "correctIndex": 0,
    "category": "math",
    "explanation": "Giải thích ngắn gọn vì sao đáp án đúng"
  }
]

Lưu ý quan trọng:
- Câu hỏi phải thú vị, hấp dẫn trẻ
- Độ khó vừa phải, không quá dễ không quá khó
- Giải thích dễ hiểu
- correctIndex là số 0-3 (vị trí đáp án đúng)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("🎯 Generating daily quiz questions...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Bạn là trợ lý tạo câu hỏi quiz giáo dục cho trẻ em. Luôn trả về JSON hợp lệ." },
          { role: "user", content: QUIZ_PROMPT }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Hệ thống đang bận, thử lại sau nhé!" 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("✅ Quiz questions generated");

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return default questions if parsing fails
    return new Response(JSON.stringify({ 
      questions: getDefaultQuestions() 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("🚨 Generate quiz error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
      questions: getDefaultQuestions()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDefaultQuestions() {
  return [
    {
      id: "1",
      question: "8 + 5 = ?",
      options: ["A. 12", "B. 13", "C. 14", "D. 15"],
      correctIndex: 1,
      category: "math",
      explanation: "8 + 5 = 13. Cách tính: 8 + 2 = 10, sau đó 10 + 3 = 13."
    },
    {
      id: "2",
      question: "Con vật nào là động vật có vú?",
      options: ["A. Cá voi", "B. Cá mập", "C. Cá chép", "D. Cá ngựa"],
      correctIndex: 0,
      category: "science",
      explanation: "Cá voi là động vật có vú sống dưới nước, chúng thở bằng phổi và nuôi con bằng sữa."
    },
    {
      id: "3",
      question: "Chọn từ viết đúng chính tả:",
      options: ["A. Sạch sẽ", "B. Xạch xẽ", "C. Sạch xẽ", "D. Xạch sẽ"],
      correctIndex: 0,
      category: "vietnamese",
      explanation: "'Sạch sẽ' viết với chữ S đầu và dấu ngã (ẽ)."
    },
    {
      id: "4",
      question: "How do you say 'xin chào' in English?",
      options: ["A. Goodbye", "B. Hello", "C. Thank you", "D. Sorry"],
      correctIndex: 1,
      category: "english",
      explanation: "'Hello' có nghĩa là 'Xin chào' trong tiếng Anh."
    },
    {
      id: "5",
      question: "Quả gì có gai bên ngoài nhưng ngọt bên trong?",
      options: ["A. Táo", "B. Cam", "C. Sầu riêng", "D. Chuối"],
      correctIndex: 2,
      category: "fun",
      explanation: "Sầu riêng có vỏ đầy gai nhọn nhưng bên trong là múi thịt ngọt thơm."
    }
  ];
}