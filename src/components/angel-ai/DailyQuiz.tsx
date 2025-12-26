import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, Flame, Star, Check, X, Loader2, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  explanation: string;
}

const QUIZ_CATEGORIES = [
  { id: "math", name: "Toán học", icon: "🔢", color: "from-blue-500 to-indigo-500" },
  { id: "science", name: "Khoa học", icon: "🔬", color: "from-green-500 to-emerald-500" },
  { id: "vietnamese", name: "Tiếng Việt", icon: "📚", color: "from-pink-500 to-rose-500" },
  { id: "english", name: "Tiếng Anh", icon: "🌍", color: "from-purple-500 to-violet-500" },
  { id: "fun", name: "Đố vui", icon: "🎯", color: "from-amber-500 to-orange-500" },
];

export function DailyQuiz() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [camlyEarned, setCamlyEarned] = useState(0);

  useEffect(() => {
    if (user) {
      checkTodayCompletion();
    }
  }, [user]);

  const checkTodayCompletion = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_quiz_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('quiz_date', today)
      .single();

    if (data) {
      setAlreadyCompletedToday(true);
      setScore(data.score);
      setStreak(data.streak_count);
      setCamlyEarned(data.camly_earned);
      setIsCompleted(true);
    } else {
      loadStreak();
      generateQuestions();
    }
    setIsLoading(false);
  };

  const loadStreak = async () => {
    if (!user) return;
    const { data } = await supabase.rpc('get_quiz_streak', { p_user_id: user.id });
    if (data !== null) setStreak(data);
  };

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      const prompt = `Tạo 5 câu hỏi trắc nghiệm đa dạng cho trẻ em 8-12 tuổi, mỗi câu thuộc một lĩnh vực khác nhau: Toán học, Khoa học, Tiếng Việt, Tiếng Anh, Đố vui.

Format JSON array:
[
  {
    "id": "1",
    "question": "Câu hỏi...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctIndex": 0,
    "category": "math",
    "explanation": "Giải thích ngắn..."
  }
]

Lưu ý:
- Câu hỏi phải phù hợp độ tuổi, thú vị
- Có 4 lựa chọn A, B, C, D
- correctIndex là vị trí đáp án đúng (0-3)
- category: math, science, vietnamese, english, fun`;

      const response = await supabase.functions.invoke('angel-ai-chat', {
        body: { 
          messages: [{ role: 'user', content: prompt }],
          userId: user?.id 
        }
      });

      if (response.error) throw response.error;

      const text = await new Response(response.data).text();
      let jsonContent = "";
      
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) jsonContent += content;
          } catch {}
        }
      }

      // Extract JSON array
      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setQuestions(parsed);
      } else {
        // Fallback questions
        setQuestions(getDefaultQuestions());
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setQuestions(getDefaultQuestions());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultQuestions = (): QuizQuestion[] => [
    {
      id: "1",
      question: "5 + 7 = ?",
      options: ["A. 10", "B. 11", "C. 12", "D. 13"],
      correctIndex: 2,
      category: "math",
      explanation: "5 + 7 = 12 vì khi cộng 5 với 7 ta được 12."
    },
    {
      id: "2", 
      question: "Mặt trời mọc ở hướng nào?",
      options: ["A. Đông", "B. Tây", "C. Nam", "D. Bắc"],
      correctIndex: 0,
      category: "science",
      explanation: "Mặt trời luôn mọc ở phía Đông và lặn ở phía Tây."
    },
    {
      id: "3",
      question: "Từ nào đúng chính tả?",
      options: ["A. Sương mù", "B. Xương mù", "C. Sương mủ", "D. Xương mủ"],
      correctIndex: 0,
      category: "vietnamese",
      explanation: "'Sương mù' viết với S và ù (dấu huyền)."
    },
    {
      id: "4",
      question: "What color is the sky?",
      options: ["A. Red", "B. Blue", "C. Green", "D. Yellow"],
      correctIndex: 1,
      category: "english",
      explanation: "Bầu trời có màu xanh dương - blue."
    },
    {
      id: "5",
      question: "Con vật nào có thể bay?",
      options: ["A. Cá voi", "B. Voi", "C. Chim đại bàng", "D. Hươu cao cổ"],
      correctIndex: 2,
      category: "fun",
      explanation: "Chim đại bàng là loài chim có thể bay cao trên bầu trời."
    }
  ];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);

    const isCorrect = index === questions[currentIndex].correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      // Mini confetti for correct answer
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    setIsCompleted(true);
    
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('complete_daily_quiz', {
        p_user_id: user.id,
        p_score: score,
        p_total_questions: questions.length
      });

      if (error) throw error;

      if (data && data[0]) {
        const result = data[0];
        setCamlyEarned(result.camly_earned);
        setStreak(result.new_streak);

        if (!result.already_completed) {
          // Big confetti celebration!
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 }
          });
        }
      }
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang chuẩn bị câu đố...</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center p-6"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center shadow-xl"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>

        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-600 via-pink-500 to-purple-500 bg-clip-text text-transparent">
          {alreadyCompletedToday ? "Đã hoàn thành!" : "Tuyệt vời!"}
        </h2>

        <div className="text-center mb-6">
          <p className="text-xl mb-2">
            Điểm số: <span className="font-bold text-primary">{score}/{questions.length}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-orange-500">
            <Flame className="w-5 h-5" />
            <span className="font-bold">Streak: {streak} ngày liên tiếp</span>
          </div>
        </div>

        {!alreadyCompletedToday && camlyEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 px-6 py-4 rounded-2xl mb-6"
          >
            <Gift className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Phần thưởng</p>
              <p className="text-2xl font-bold text-yellow-600">
                +{camlyEarned.toLocaleString()} CAMLY
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[...Array(score)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            </motion.div>
          ))}
        </div>

        {alreadyCompletedToday && (
          <p className="text-muted-foreground text-center">
            Bé đã hoàn thành quiz hôm nay rồi! 🌟<br />
            Quay lại vào ngày mai để tiếp tục nhé!
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          <span className="font-bold">Đố Vui Hàng Ngày</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-orange-500">
            <Flame className="w-5 h-5" />
            <span className="font-bold">{streak}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-5 h-5" />
            <span className="font-bold">{score}/{questions.length}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2 mb-6" />

      {/* Question */}
      {currentQuestion && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col"
          >
            {/* Category badge */}
            <div className="flex justify-center mb-4">
              <span className={`px-4 py-2 rounded-full bg-gradient-to-r ${
                QUIZ_CATEGORIES.find(c => c.id === currentQuestion.category)?.color || 'from-gray-500 to-gray-600'
              } text-white text-sm font-medium`}>
                {QUIZ_CATEGORIES.find(c => c.id === currentQuestion.category)?.icon}{' '}
                {QUIZ_CATEGORIES.find(c => c.id === currentQuestion.category)?.name}
              </span>
            </div>

            {/* Question text */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mb-6">
              <p className="text-center text-lg font-medium">
                Câu {currentIndex + 1}: {currentQuestion.question}
              </p>
            </div>

            {/* Options */}
            <div className="grid gap-3 flex-1">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctIndex;
                const showCorrectness = showResult;

                return (
                  <motion.button
                    key={index}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(index)}
                    disabled={showResult}
                    className={`p-4 rounded-xl text-left transition-all ${
                      showCorrectness
                        ? isCorrect
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                          : isSelected
                          ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                          : 'bg-muted/50 border-2 border-transparent'
                        : 'bg-white dark:bg-slate-800 border-2 border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {showCorrectness && (
                        isCorrect ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : isSelected ? (
                          <X className="w-5 h-5 text-red-500" />
                        ) : null
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
              >
                <p className="text-sm">
                  <Sparkles className="w-4 h-4 inline mr-2 text-blue-500" />
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}

            {/* Next button */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <Button onClick={nextQuestion} className="w-full h-12 text-lg">
                  {currentIndex < questions.length - 1 ? "Câu tiếp theo →" : "Xem kết quả 🎉"}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}