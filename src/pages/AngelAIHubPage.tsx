import { useState } from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, BookOpen, Target, Trophy, ArrowLeft, Sparkles, Home, X } from "lucide-react";
import { ChatInterface } from "@/components/angel-ai/ChatInterface";
import { StoryMode } from "@/components/angel-ai/StoryMode";
import { DailyQuiz } from "@/components/angel-ai/DailyQuiz";
import { AchievementBadge } from "@/components/angel-ai/AchievementBadge";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const AngelAIHubPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl"
          >
            🌟
          </motion.div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Angel AI - Thiên Thần Trí Tuệ
          </h1>
          <p className="text-muted-foreground">
            Đăng nhập để trò chuyện với Angel AI nhé!
          </p>
          <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            Đăng nhập ngay
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Angel AI - Thiên Thần Trí Tuệ | FUN Planet</title>
        <meta name="description" content="Trò chuyện với Angel AI - người bạn thông minh luôn sẵn sàng giúp đỡ bé học hỏi và khám phá" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                title="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                title="Về trang chủ"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Angel AI Hub
                </h1>
                <p className="text-xs text-muted-foreground">Thiên thần trí tuệ của bé</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors text-red-600 dark:text-red-400"
              title="Rời trang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto mb-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50">
              <TabsTrigger 
                value="chat" 
                className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger 
                value="story"
                className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Truyện</span>
              </TabsTrigger>
              <TabsTrigger 
                value="quiz"
                className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Đố Vui</span>
              </TabsTrigger>
              <TabsTrigger 
                value="achievements"
                className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Huy Hiệu</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0">
              <ChatInterface />
            </TabsContent>

            <TabsContent value="story" className="mt-0">
              <StoryMode />
            </TabsContent>

            <TabsContent value="quiz" className="mt-0">
              <DailyQuiz />
            </TabsContent>

            <TabsContent value="achievements" className="mt-0">
              <AchievementBadge />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AngelAIHubPage;
