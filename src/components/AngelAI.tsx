import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Heart, Rocket, Music, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fireConfetti } from "@/components/ConfettiEffect";

interface FunID {
  id: string;
  user_id: string;
  soul_nft_id: string;
  soul_nft_name: string;
  energy_level: number;
  light_points: number;
  display_name: string;
  avatar_glow_color: string;
  created_at: string;
}

interface AngelAIProps {
  isNewUser?: boolean;
  onClose?: () => void;
}

const ANGEL_MESSAGES = {
  welcome_new: (name: string, soulNft: string) => 
    `Chào bé ánh sáng ${name}! 🌟 Hoan nghênh bé đến New Earth! Bé đã nhận Soul NFT "${soulNft}" và 50.000 CAMLY khởi đầu! Cùng Angel khám phá vũ trụ nào!`,
  
  welcome_back: (name: string) => [
    `Chào bé ${name}! 💫 Hôm nay bé muốn xây hành tinh hay chơi game mới nào?`,
    `Xin chào ${name}! 🌈 Angel nhớ bé quá! Bé có biết hôm nay có game mới không?`,
    `Bé ${name} ơi! ✨ Năng lượng ánh sáng của bé hôm nay rất tốt! Cùng chơi nào!`,
    `Chào ${name}! 🚀 Angel có tin vui: Soul NFT của bé đang phát sáng đẹp lắm!`
  ],
  
  charity_reminder: () => 
    `Bé ơi, hôm nay có 11% từ doanh thu game đã vào Quỹ Ánh Sáng rồi đó! 💝`,
  
  game_suggestion: (gameName: string) => 
    `Angel thấy bé thích ${gameName}! Có muốn chơi tiếp không? 🎮`,
  
  parent_time_reminder: (minutes: number) => 
    `Hôm nay bé đã chơi ${minutes} phút rồi! Nhớ nghỉ ngơi nhé! 😊`,

  mint_nft_invite: () =>
    `Bé muốn mint NFT hành tinh mới không? Angel dẫn bé đi nào! 🪐`
};

export function AngelAI({ isNewUser = false, onClose }: AngelAIProps) {
  const { user } = useAuth();
  const [funId, setFunId] = useState<FunID | null>(null);
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying528Hz, setIsPlaying528Hz] = useState(false);
  const [showSoulNFT, setShowSoulNFT] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFunId();
    }
  }, [user]);

  useEffect(() => {
    if (funId) {
      if (isNewUser) {
        setMessage(ANGEL_MESSAGES.welcome_new(funId.display_name || "ánh sáng", funId.soul_nft_name));
        setShowSoulNFT(true);
        fireConfetti('celebration');
        // Play 528Hz music
        play528HzMusic();
      } else {
        const messages = ANGEL_MESSAGES.welcome_back(funId.display_name || "bé");
        setMessage(messages[Math.floor(Math.random() * messages.length)]);
      }
    }
  }, [funId, isNewUser]);

  const fetchFunId = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('fun_id')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setFunId(data as FunID);
    }
  };

  const play528HzMusic = () => {
    setIsPlaying528Hz(true);
    // The actual 528Hz audio would be played from BackgroundMusicPlayer
    setTimeout(() => setIsPlaying528Hz(false), 10000);
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !funId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        {/* Angel Avatar */}
        <motion.div
          className="relative"
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/50 via-pink-300/50 to-purple-300/50 rounded-full blur-xl animate-pulse" />
          
          {/* Main Card */}
          <div className="relative bg-gradient-to-br from-white/95 via-yellow-50/95 to-pink-50/95 dark:from-slate-900/95 dark:via-purple-900/95 dark:to-pink-900/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-yellow-200/50 dark:border-yellow-500/30">
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Angel Icon */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                className="relative"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                {/* Halo */}
                <motion.div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full border-2 border-yellow-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
              
              <div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-yellow-600 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Angel AI
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Thiên thần ánh sáng của bé</p>
              </div>

              {isPlaying528Hz && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Music className="w-5 h-5 text-purple-500" />
                </motion.div>
              )}
            </div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 mb-4 relative"
            >
              {/* Speech bubble pointer */}
              <div className="absolute -top-2 left-6 w-4 h-4 bg-white/70 dark:bg-slate-800/70 rotate-45" />
              
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                {message}
              </p>
            </motion.div>

            {/* Soul NFT Display */}
            {showSoulNFT && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="mb-4"
              >
                <div className="relative bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-yellow-900/30 dark:via-pink-900/30 dark:to-purple-900/30 rounded-2xl p-4 border-2 border-yellow-300/50 dark:border-yellow-500/30">
                  {/* Sparkles Animation */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-400" />
                    <Star className="absolute bottom-2 left-2 w-3 h-3 text-pink-400" />
                    <Star className="absolute top-1/2 right-4 w-3 h-3 text-purple-400" />
                  </motion.div>

                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center"
                      animate={{ 
                        boxShadow: [
                          "0 0 20px rgba(255, 215, 0, 0.5)",
                          "0 0 40px rgba(255, 215, 0, 0.8)",
                          "0 0 20px rgba(255, 215, 0, 0.5)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Heart className="w-6 h-6 text-white" />
                    </motion.div>
                    
                    <div>
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-100">
                        {funId.soul_nft_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Soul NFT • Energy Level {funId.energy_level}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white text-xs"
                onClick={() => window.location.href = '/games'}
              >
                <Rocket className="w-3 h-3 mr-1" />
                Chơi Game
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-pink-500 dark:text-pink-400 text-xs"
                onClick={() => window.location.href = '/planet-explorer'}
              >
                <Star className="w-3 h-3 mr-1" />
                Xây Hành Tinh
              </Button>
            </div>

            {/* FUN-ID Badge */}
            <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">FUN-ID</span>
                <span className="font-mono font-bold bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                  {funId.soul_nft_id}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating Angel Button for triggering Angel AI
export function AngelAIButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 shadow-lg flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{ 
        y: [0, -5, 0],
        boxShadow: [
          "0 0 20px rgba(255, 215, 0, 0.4)",
          "0 0 30px rgba(255, 215, 0, 0.6)",
          "0 0 20px rgba(255, 215, 0, 0.4)"
        ]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <MessageCircle className="w-6 h-6 text-white" />
      
      {/* Notification dot */}
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-xs flex items-center justify-center text-white font-bold">
        !
      </span>
    </motion.button>
  );
}

export default AngelAI;
