import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Heart, Rocket, X, GripVertical, Send, Loader2, Mic, MicOff, Volume2, VolumeX, History, Trash2, ChevronLeft, Settings } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Angel3DButton } from "@/components/angel-ai/Angel3DCharacter";
import { Angel2DFallback } from "@/components/angel-ai/Angel2DFallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fireConfetti } from "@/components/ConfettiEffect";
import { useDraggable } from "@/hooks/useDraggable";
import { useAngelAIChat, ChatMessage, ChatHistoryGroup } from "@/hooks/useAngelAIChat";
import { useToast } from "@/hooks/use-toast";
import { useWebSpeechRecognition } from "@/hooks/useWebSpeechRecognition";
import { useWebSpeechSynthesis } from "@/hooks/useWebSpeechSynthesis";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VoiceSettingsPanel } from "@/components/angel-ai/VoiceSettingsPanel";

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
  const [showHistory, setShowHistory] = useState(false);
  const [historyGroups, setHistoryGroups] = useState<ChatHistoryGroup[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAssistantMessageRef = useRef<string>("");

  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages, 
    loadChatHistory,
    clearHistory,
    getGroupedHistory,
    historyLoaded 
  } = useAngelAIChat({
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
    isCheckingMic,
    transcript,
    isSupported: sttSupported,
    error: sttError,
    micPermission,
    micLevel,
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
        title: "Microphone",
        description: err,
        variant: "destructive"
      });
    }
  });

  // Web Speech Synthesis (Text-to-Speech) - Sweet female voice
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate: voiceRate,
    setRate: setVoiceRate,
    pitch: voicePitch,
    setPitch: setVoicePitch,
    volume: voiceVolume,
    setVolume: setVoiceVolume,
    autoRead,
    setAutoRead
  } = useWebSpeechSynthesis({
    language: 'vi-VN',
    rate: 0.8,
    pitch: 1.3
  });

  // Load chat history when user is available
  useEffect(() => {
    if (user && !historyLoaded) {
      loadChatHistory(user.id, 50);
    }
  }, [user, historyLoaded, loadChatHistory]);

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

  // Auto-speak new assistant messages ONLY when in voice chat mode (user used mic)
  useEffect(() => {
    if (voiceEnabled && ttsSupported && messages.length > 0 && isVoiceChatMode) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content && 
          lastMessage.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = lastMessage.content;
        speak(lastMessage.content);
        // Reset voice chat mode after speaking (optional: keep true for continuous conversation)
        setIsVoiceChatMode(false);
      }
    }
  }, [messages, voiceEnabled, ttsSupported, speak, isVoiceChatMode]);

  // Update input when transcript changes during listening
  useEffect(() => {
    if (isListening && transcript) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

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
      if (inputValue.trim()) {
        setIsVoiceChatMode(true); // Enable voice chat mode when sending via mic
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

  const handleOpenHistory = async () => {
    if (!user) return;
    setShowHistory(true);
    setLoadingHistory(true);
    const groups = await getGroupedHistory(user.id);
    setHistoryGroups(groups);
    setLoadingHistory(false);
  };

  const handleClearHistory = async () => {
    if (!user) return;
    const success = await clearHistory(user.id);
    if (success) {
      setHistoryGroups([]);
      toast({
        title: "Đã xóa",
        description: "Lịch sử trò chuyện đã được xóa!",
      });
    }
    setShowClearDialog(false);
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
                {showHistory ? (
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                ) : (
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
                )}
                
                <div>
                  <h3 className="font-bold text-base bg-gradient-to-r from-yellow-600 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {showHistory ? "Lịch sử trò chuyện" : "Angel AI"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {showHistory ? "Xem lại các cuộc hội thoại" : "Thiên thần ánh sáng của bé"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Settings Button */}
                {!showHistory && !showVoiceSettings && ttsSupported && (
                  <button
                    onClick={() => setShowVoiceSettings(true)}
                    className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-purple-600"
                    title="Cài đặt giọng nói"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}

                {/* History Button */}
                {!showHistory && !showVoiceSettings && user && (
                  <button
                    onClick={handleOpenHistory}
                    className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-yellow-600"
                    title="Lịch sử trò chuyện"
                  >
                    <History className="w-4 h-4" />
                  </button>
                )}

                {/* Voice Output Toggle */}
                {!showHistory && !showVoiceSettings && ttsSupported && (
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
                {!showHistory && !showVoiceSettings && isSpeaking && (
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

            {/* Voice Settings Panel */}
            {showVoiceSettings ? (
              <VoiceSettingsPanel
                voices={voices}
                selectedVoice={selectedVoice}
                currentRate={voiceRate}
                currentPitch={voicePitch}
                currentVolume={voiceVolume}
                autoRead={autoRead}
                onSelectVoice={setSelectedVoice}
                onRateChange={setVoiceRate}
                onPitchChange={setVoicePitch}
                onVolumeChange={setVoiceVolume}
                onAutoReadChange={setAutoRead}
                onTestVoice={speak}
                onSave={() => {
                  setShowVoiceSettings(false);
                  toast({
                    title: "Đã lưu",
                    description: "Cài đặt giọng nói đã được lưu!",
                  });
                }}
                onClose={() => setShowVoiceSettings(false)}
              />
            ) : showHistory ? (
              <div className="h-[400px] flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                    </div>
                  ) : historyGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <History className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">Chưa có lịch sử trò chuyện</p>
                      <p className="text-xs mt-1">Bắt đầu nói chuyện với Angel nào!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historyGroups.map((group) => (
                        <div key={`history-${group.date}`} className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground sticky top-0 bg-white/80 dark:bg-slate-900/80 py-1 backdrop-blur-sm">
                            <div className="w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                              <Star className="w-2.5 h-2.5 text-yellow-600" />
                            </div>
                            <span className="font-medium">{group.label}</span>
                            <span className="text-muted-foreground/50">({group.messages.length} tin nhắn)</span>
                          </div>
                          
                          <div className="space-y-2 pl-6">
                            {group.messages.slice(0, 6).map((msg) => (
                              <div
                                key={msg.id || `msg-${msg.created_at}`}
                                className={`text-xs p-2 rounded-lg ${
                                  msg.role === 'user'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-foreground'
                                }`}
                              >
                                <span className="font-medium">
                                  {msg.role === 'user' ? '👤 Bé: ' : '✨ Angel: '}
                                </span>
                                <span className="line-clamp-2">{msg.content}</span>
                              </div>
                            ))}
                            {group.messages.length > 6 && (
                              <p className="text-xs text-muted-foreground pl-2">
                                + {group.messages.length - 6} tin nhắn khác...
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* History Actions */}
                {historyGroups.length > 0 && (
                  <div className="p-4 border-t border-yellow-200/30 dark:border-yellow-500/20">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearDialog(true)}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa toàn bộ lịch sử
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
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
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id || `msg-${msg.created_at}`} message={msg} />
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
                  {/* Mic Status Indicators */}
                  {isCheckingMic && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra microphone...</span>
                    </motion.div>
                  )}

                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 flex items-center gap-3 text-sm text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 p-3 rounded-xl"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-red-500"
                      />
                      
                      {/* Waveform Animation */}
                      <div className="flex items-center gap-0.5 h-4">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-pink-500 rounded-full"
                            animate={{
                              height: ["8px", "16px", "8px"],
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </div>
                      
                      <span className="flex-1">Đang lắng nghe... Hãy nói với Angel!</span>
                      <span className="text-xs text-muted-foreground">(Nhấn mic để dừng)</span>
                    </motion.div>
                  )}

                  {/* Low mic level warning */}
                  {!isListening && !isCheckingMic && micLevel > 0 && micLevel < 0.02 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg"
                    >
                      <span>💡 Micro có thể yếu. Thử nói gần hơn hoặc kiểm tra cài đặt micro.</span>
                    </motion.div>
                  )}

                  <div className="flex gap-2">
                    {/* Voice Input Button */}
                    <Button
                      onClick={handleVoiceToggle}
                      size="icon"
                      variant={isListening ? "destructive" : "outline"}
                      className={`rounded-xl shrink-0 ${
                        isCheckingMic
                          ? 'border-blue-300 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                          : isListening 
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                            : sttSupported 
                              ? 'border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-400'
                              : 'border-muted text-muted-foreground cursor-not-allowed opacity-50'
                      }`}
                      title={
                        !sttSupported 
                          ? "Trình duyệt không hỗ trợ. Hãy dùng Chrome/Edge" 
                          : isCheckingMic
                            ? "Đang kiểm tra micro..."
                            : isListening 
                              ? "Dừng ghi âm" 
                              : "Nói với Angel"
                      }
                      disabled={!sttSupported || isCheckingMic}
                    >
                      {isCheckingMic ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isListening ? (
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
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Clear History Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa lịch sử trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện với Angel không? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              className="bg-red-500 hover:bg-red-600"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const location = useLocation();
  
  // Check if user is on a 3D game page - use 2D fallback to conserve GPU
  const use2DFallback = useMemo(() => {
    const path = location.pathname.toLowerCase();
    // Pages that use WebGL/Three.js heavily
    return path.includes('/games/') || 
           path.includes('/play/') ||
           path.includes('/3d-') ||
           path.includes('/game-');
  }, [location.pathname]);

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

      <motion.div
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchMove={handleLongPressMove}
        whileHover={isDragging ? {} : { scale: 1.05 }}
        whileTap={isDragging ? {} : { scale: 0.95 }}
        animate={isDragging ? {
          filter: "drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))"
        } : { 
          filter: [
            "drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))",
            "drop-shadow(0 0 20px rgba(255, 215, 0, 0.7))",
            "drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))"
          ]
        }}
        transition={{ duration: 2, repeat: isDragging ? 0 : Infinity }}
        className="relative"
      >
        {use2DFallback ? (
          <Angel2DFallback onClick={handleClick} />
        ) : (
          <Angel3DButton onClick={handleClick} />
        )}
        
        {/* Notification dot */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-xs flex items-center justify-center text-white font-bold z-10">
          !
        </span>
      </motion.div>

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
