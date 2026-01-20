import { useState } from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, BookOpen, Target, Trophy, ArrowLeft, Home, X, Star, Zap } from "lucide-react";
import { ChatInterface } from "@/components/angel-ai/ChatInterface";
import { StoryMode } from "@/components/angel-ai/StoryMode";
import { DailyQuiz } from "@/components/angel-ai/DailyQuiz";
import { AchievementBadge } from "@/components/angel-ai/AchievementBadge";
import { MagicalBackground } from "@/components/angel-ai/MagicalBackground";
import { FloatingMascot } from "@/components/angel-ai/FloatingMascot";
import { GlowingCard } from "@/components/angel-ai/GlowingCard";
import { ShimmerText } from "@/components/angel-ai/ShimmerText";
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
      <div className="min-h-screen relative overflow-hidden">
        <MagicalBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <GlowingCard glowColor="rainbow" className="max-w-md w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-8 space-y-6"
            >
              <FloatingMascot size="lg" />
              
              <div className="space-y-2 mt-4">
                <ShimmerText as="h1" className="text-3xl font-bold font-quicksand">
                  Angel AI
                </ShimmerText>
                <p className="text-white/80 text-lg">
                  Thiên Thần Trí Tuệ
                </p>
              </div>
              
              <p className="text-white/60">
                Đăng nhập để trò chuyện với Angel AI nhé!
              </p>
              
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:from-purple-600 hover:via-pink-600 hover:to-amber-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/50"
              >
                ✨ Đăng nhập ngay
              </Button>
            </motion.div>
          </GlowingCard>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Angel AI - Thiên Thần Trí Tuệ | FUN Planet</title>
        <meta name="description" content="Trò chuyện với Angel AI - người bạn thông minh luôn sẵn sàng giúp đỡ bé học hỏi và khám phá" />
      </Helmet>
      
      <div className="min-h-screen relative overflow-hidden">
        <MagicalBackground />
        
        <div className="relative z-10 container mx-auto px-4 py-4 min-h-screen flex flex-col">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4"
          >
            {/* Left nav buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-lg"
                title="Quay lại"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/")}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-lg"
                title="Về trang chủ"
              >
                <Home className="w-5 h-5 text-white" />
              </motion.button>
            </div>
            
            {/* Center - Title with mascot */}
            <div className="flex items-center gap-3">
              <FloatingMascot size="sm" />
              <div className="text-center">
                <ShimmerText as="h1" className="text-xl sm:text-2xl font-bold font-quicksand">
                  Angel AI Hub
                </ShimmerText>
                <p className="text-xs sm:text-sm text-white/60">Thiên thần trí tuệ của bé</p>
              </div>
            </div>
            
            {/* Right - Stats & Exit */}
            <div className="flex items-center gap-2">
              {/* Mini stats */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white font-medium">120</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white font-medium">5</span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/")}
                className="p-2.5 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-400/30 hover:bg-red-500/30 transition-all shadow-lg"
                title="Rời trang"
              >
                <X className="w-5 h-5 text-red-400" />
              </motion.button>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto mb-4 p-1.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
                <TabsTrigger 
                  value="chat" 
                  className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2.5 px-3 rounded-xl text-white/70 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="relative"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {activeTab === "chat" && (
                      <motion.div
                        layoutId="tabGlow"
                        className="absolute inset-0 bg-white rounded-full blur-md opacity-30"
                      />
                    )}
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium">Chat</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="story"
                  className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2.5 px-3 rounded-xl text-white/70 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/30"
                >
                  <motion.div whileHover={{ scale: 1.2, rotate: -10 }}>
                    <BookOpen className="h-5 w-5" />
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium">Truyện</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="quiz"
                  className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2.5 px-3 rounded-xl text-white/70 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30"
                >
                  <motion.div whileHover={{ scale: 1.2, rotate: 15 }}>
                    <Target className="h-5 w-5" />
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium">Đố Vui</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="achievements"
                  className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2.5 px-3 rounded-xl text-white/70 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30"
                >
                  <motion.div whileHover={{ scale: 1.2, rotate: -15 }}>
                    <Trophy className="h-5 w-5" />
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium">Huy Hiệu</span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            {/* Content area with glowing card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <GlowingCard 
                glowColor={
                  activeTab === "chat" ? "purple" :
                  activeTab === "story" ? "pink" :
                  activeTab === "quiz" ? "blue" : "rainbow"
                }
                className="h-full"
                animate={false}
              >
                <div className="p-4 h-full max-h-[calc(100vh-180px)] overflow-hidden">
                  <TabsContent value="chat" className="mt-0 h-full">
                    <ChatInterface />
                  </TabsContent>

                  <TabsContent value="story" className="mt-0 h-full">
                    <StoryMode />
                  </TabsContent>

                  <TabsContent value="quiz" className="mt-0 h-full">
                    <DailyQuiz />
                  </TabsContent>

                  <TabsContent value="achievements" className="mt-0 h-full">
                    <AchievementBadge />
                  </TabsContent>
                </div>
              </GlowingCard>
            </motion.div>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AngelAIHubPage;
