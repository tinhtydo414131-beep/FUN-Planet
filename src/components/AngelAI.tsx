import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Heart, Rocket, X, MessageCircle, GripVertical, Send, Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fireConfetti } from "@/components/ConfettiEffect";
import { useDraggable } from "@/hooks/useDraggable";
import { useAngelAIChat, ChatMessage } from "@/hooks/useAngelAIChat";
import { useToast } from "@/hooks/use-toast";
import { useWebSpeechRecognition } from "@/hooks/useWebSpeechRecognition";
import { useWebSpeechSynthesis } from "@/hooks/useWebSpeechSynthesis";

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

const WELCOME_MESSAGES = {
  welcome_new: (name: string, soulNft: string) => 
    `Chào bé ánh sáng ${name}! 🌟 Hoan nghênh bé đến New Earth! Bé đã nhận Soul NFT "${soulNft}" và 50.000 CAMLY khởi đầu! Bé có thể hỏi Angel bất cứ điều gì nhé!`,
  
  welcome_back: (name: string) => [
    `Chào bé ${name}! 💫 Angel sẵn sàng trả lời mọi câu hỏi của bé!`,
    `Xin chào ${name}! 🌈 Hôm nay bé muốn hỏi Angel điều gì nào?`,
    `Bé ${name} ơi! ✨ Angel đây! Có điều gì thắc mắc không bé?`,
  ],
};

export function AngelAI({ isNewUser = false, onClose }: AngelAIProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [funId, setFunId] = useState<FunID | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [showSoulNFT, setShowSoulNFT] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAssistantMessageRef = useRef<string>("");

  const { messages, isLoading, error, sendMessage, clearMessages } = useAngelAIChat({
    onError: (err) => {
      toast({
        title: "Angel AI",
        description: err,
        variant: "destructive"
      });
    }
  });

  // Web Speech Recognition (Speech-to-Text)
  const {
    isListening,
    transcript,
    isSupported: sttSupported,
    error: sttError,
    startListening,
    stopListening,
    toggleListening
  } = useWebSpeechRecognition({
    language: 'vi-VN',
    onResult: (text) => {
      setInputValue(text);
    },
    onError: (err) => {
      toast({
        title: "Giọng nói",
        description: err,
        variant: "destructive"
      });
    }
  });

  // Web Speech Synthesis (Text-to-Speech)
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported
  } = useWebSpeechSynthesis({
    language: 'vi-VN',
    rate: 0.9,
    pitch: 1.1
  });

  useEffect(() => {
    if (user) {
      fetchFunId();
    }
  }, [user]);

  useEffect(() => {
    if (funId && isNewUser) {
      setShowSoulNFT(true);
      fireConfetti('celebration');
    }
  }, [funId, isNewUser]);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (voiceEnabled && ttsSupported && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content && 
          lastMessage.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = lastMessage.content;
        speak(lastMessage.content);
      }
    }
  }, [messages, voiceEnabled, ttsSupported, speak]);

  // Update input when transcript changes during listening
  useEffect(() => {
    if (isListening && transcript) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);

  const fetchFunId = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('fun_id')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setFunId(data as FunID);
    }
  };

  const handleClose = () => {
    stopSpeaking();
    stopListening();
    setIsVisible(false);
    onClose?.();
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    if (isListening) stopListening();
    sendMessage(inputValue, user?.id);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      // Send message if we have transcript
      if (inputValue.trim()) {
        handleSendMessage();
      }
    } else {
      startListening();
    }
  };

  const toggleVoiceOutput = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const getWelcomeMessage = () => {
    if (!funId) return "Chào bé! 🌟 Angel sẵn sàng trò chuyện!";
    if (isNewUser) {
      return WELCOME_MESSAGES.welcome_new(funId.display_name || "ánh sáng", funId.soul_nft_name);
    }
    const msgs = WELCOME_MESSAGES.welcome_back(funId.display_name || "bé");
    return msgs[Math.floor(Math.random() * msgs.length)];
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed bottom-4 right-4 z-50 w-[720px] max-w-[calc(100vw-2rem)]"
      >
        <motion.div className="relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 via-pink-300/30 to-purple-300/30 rounded-3xl blur-xl animate-pulse" />
          
          {/* Main Card */}
          <div className="relative bg-gradient-to-br from-white/95 via-yellow-50/95 to-pink-50/95 dark:from-slate-900/95 dark:via-purple-900/95 dark:to-pink-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-200/50 dark:border-yellow-500/30 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-yellow-200/30 dark:border-yellow-500/20">
              <div className="flex items-center gap-3">
                <motion.div
                  className="relative"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  {/* Halo */}
                  <motion.div
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full border-2 border-yellow-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
                
                <div>
                  <h3 className="font-bold text-base bg-gradient-to-r from-yellow-600 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                    Angel AI
                  </h3>
                  <p className="text-xs text-muted-foreground">Thiên thần ánh sáng của bé</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Output Toggle */}
                {ttsSupported && (
                  <button
                    onClick={toggleVoiceOutput}
                    className={`p-1.5 rounded-full transition-colors ${
                      voiceEnabled 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                    title={voiceEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Speaking Indicator */}
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                )}

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
              {/* Welcome Message */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <div className="bg-gradient-to-r from-yellow-100/80 to-pink-100/80 dark:from-yellow-900/30 dark:to-pink-900/30 rounded-2xl rounded-tl-sm p-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      {getWelcomeMessage()}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Chat History */}
              {messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
              ))}

              {/* Loading Indicator */}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Angel đang suy nghĩ...</span>
                </motion.div>
              )}

              {/* Soul NFT Display for New Users */}
              {showSoulNFT && funId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="mt-4"
                >
                  <div className="relative bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-yellow-900/30 dark:via-pink-900/30 dark:to-purple-900/30 rounded-2xl p-4 border-2 border-yellow-300/50 dark:border-yellow-500/30">
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-400" />
                      <Star className="absolute bottom-2 left-2 w-3 h-3 text-pink-400" />
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
                        <p className="font-bold text-sm text-foreground">
                          {funId.soul_nft_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Soul NFT • Energy Level {funId.energy_level}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-yellow-200/30 dark:border-yellow-500/20">
              {/* Voice Status */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="w-3 h-3 rounded-full bg-red-500"
                  />
                  <span>Đang nghe... Hãy nói với Angel!</span>
                </motion.div>
              )}

              <div className="flex gap-2">
                {/* Voice Input Button */}
                <Button
                  onClick={handleVoiceToggle}
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  className={`rounded-xl shrink-0 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : sttSupported 
                        ? 'border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-400'
                        : 'border-muted text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                  title={
                    !sttSupported 
                      ? "Trình duyệt không hỗ trợ. Hãy dùng Chrome/Edge" 
                      : isListening 
                        ? "Dừng ghi âm" 
                        : "Nói với Angel"
                  }
                  disabled={!sttSupported}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>

                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Đang nghe..." : "Hỏi Angel điều gì đó..."}
                  className="flex-1 bg-white/70 dark:bg-slate-800/70 border-yellow-200/50 dark:border-yellow-500/30 rounded-xl text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  size="icon"
                  className="bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500 text-white rounded-xl shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Voice feature hint */}
              {sttSupported && !isListening && messages.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  💡 Nhấn vào <Mic className="w-3 h-3 inline" /> để nói chuyện với Angel bằng giọng nói!
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white text-xs rounded-xl"
                  onClick={() => window.location.href = '/games'}
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  Chơi Game
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-pink-500 dark:text-pink-400 text-xs rounded-xl"
                  onClick={() => window.location.href = '/planet-explorer'}
                >
                  <Star className="w-3 h-3 mr-1" />
                  Xây Hành Tinh
                </Button>
              </div>
            </div>

            {/* FUN-ID Badge */}
            {funId && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between text-xs py-2 px-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-muted-foreground">FUN-ID</span>
                  <span className="font-mono font-bold bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                    {funId.soul_nft_id}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl p-3 ${
          isUser
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm'
            : 'bg-gradient-to-r from-yellow-100/80 to-pink-100/80 dark:from-yellow-900/30 dark:to-pink-900/30 text-foreground rounded-bl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content || (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs opacity-70">...</span>
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}

// Floating Angel Button for triggering Angel AI
export function AngelAIButton({ onClick }: { onClick: () => void }) {
  const {
    position,
    isDragging,
    isLongPressing,
    handleMouseDown,
    handleLongPressStart,
    handleLongPressEnd,
    handleLongPressMove,
    style
  } = useDraggable({
    storageKey: "angel_ai_position",
    defaultPosition: { x: 0, y: -80 },
    longPressDelay: 300
  });

  const handleClick = () => {
    if (!isDragging) {
      onClick();
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-40 touch-none select-none"
      style={style}
    >
      {/* Drag Handle */}
      <div
        className={`absolute -top-4 left-1/2 -translate-x-1/2 p-1.5 rounded-full transition-all cursor-grab active:cursor-grabbing ${
          isLongPressing || isDragging 
            ? 'bg-yellow-500/90 scale-125' 
            : 'bg-black/50 hover:bg-black/70'
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleLongPressStart}
        onTouchMove={handleLongPressMove}
        onTouchEnd={handleLongPressEnd}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
      >
        <GripVertical className="w-4 h-4 text-white" />
      </div>

      <motion.button
        onClick={handleClick}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchMove={handleLongPressMove}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 shadow-lg flex items-center justify-center"
        whileHover={isDragging ? {} : { scale: 1.1 }}
        whileTap={isDragging ? {} : { scale: 0.95 }}
        animate={isDragging ? {
          boxShadow: "0 0 40px rgba(255, 215, 0, 0.8)"
        } : { 
          y: [0, -5, 0],
          boxShadow: [
            "0 0 20px rgba(255, 215, 0, 0.4)",
            "0 0 30px rgba(255, 215, 0, 0.6)",
            "0 0 20px rgba(255, 215, 0, 0.4)"
          ]
        }}
        transition={{ duration: 2, repeat: isDragging ? 0 : Infinity }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        
        {/* Notification dot */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-xs flex items-center justify-center text-white font-bold">
          !
        </span>
      </motion.button>

      {/* Dragging indicator */}
      {(isLongPressing || isDragging) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black/70 text-white px-2 py-0.5 rounded-full"
        >
          {isDragging ? "Đang kéo..." : "Giữ để kéo"}
        </motion.div>
      )}
    </div>
  );
}

export default AngelAI;
