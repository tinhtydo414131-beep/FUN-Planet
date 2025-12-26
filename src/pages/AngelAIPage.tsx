import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Loader2, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings,
  Sparkles,
  ArrowLeft,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAngelAIChat, ChatHistoryGroup } from "@/hooks/useAngelAIChat";
import { useToast } from "@/hooks/use-toast";
import { useWebSpeechRecognition } from "@/hooks/useWebSpeechRecognition";
import { useWebSpeechSynthesis } from "@/hooks/useWebSpeechSynthesis";
import { VoiceSettingsPanel } from "@/components/angel-ai/VoiceSettingsPanel";
import { PersonalitySelector, PersonalityMode } from "@/components/angel-ai/PersonalitySelector";
import { ChatMessageBubble } from "@/components/angel-ai/ChatMessageBubble";
import { ConversationSidebar } from "@/components/angel-ai/ConversationSidebar";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

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

const WELCOME_MESSAGES = {
  cheerful: (name: string) => `Chào ${name}! 🌟💫✨ Angel siêu vui được gặp bé! Hôm nay bé muốn chơi gì, học gì hay khám phá điều gì nào? 🎉🌈`,
  wise: (name: string) => `Xin chào ${name}! 📚 Angel rất vui được đồng hành cùng bé. Bé có thắc mắc hay câu hỏi nào cần Angel giải đáp không?`,
  gamer: (name: string) => `Yo ${name}! 🎮 Game Master Angel đây! Bé đã sẵn sàng cho những thử thách và quest mới chưa? Let's go! 🚀`,
  creative: (name: string) => `Chào bé ${name}! 🎨 Angel đã chuẩn bị sẵn bút màu và trí tưởng tượng rồi đây! Hôm nay mình sẽ sáng tạo điều gì tuyệt vời nào? ✨`,
};

export default function AngelAIPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [funId, setFunId] = useState<FunID | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [personality, setPersonality] = useState<PersonalityMode>("cheerful");
  const [historyGroups, setHistoryGroups] = useState<ChatHistoryGroup[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
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

  // Web Speech Recognition
  const {
    isListening,
    transcript,
    isSupported: sttSupported,
    startListening,
    stopListening
  } = useWebSpeechRecognition({
    language: 'vi-VN',
    onResult: (text) => setInputValue(text),
    onError: (err) => toast({ title: "Microphone", description: err, variant: "destructive" })
  });

  // Web Speech Synthesis
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
  } = useWebSpeechSynthesis({ language: 'vi-VN', rate: 0.8, pitch: 1.3 });

  // Load user data and history
  useEffect(() => {
    if (user && !historyLoaded) {
      loadChatHistory(user.id, 100);
      fetchFunId();
      loadHistory();
    }
  }, [user, historyLoaded]);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (voiceEnabled && autoRead && ttsSupported && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content && 
          lastMessage.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = lastMessage.content;
        speak(lastMessage.content);
      }
    }
  }, [messages, voiceEnabled, autoRead, ttsSupported, speak]);

  // Update input from transcript
  useEffect(() => {
    if (isListening && transcript) setInputValue(transcript);
  }, [transcript, isListening]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const fetchFunId = async () => {
    if (!user) return;
    const { data } = await supabase.from('fun_id').select('*').eq('user_id', user.id).single();
    if (data) setFunId(data as FunID);
  };

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const groups = await getGroupedHistory(user.id);
    setHistoryGroups(groups);
    setLoadingHistory(false);
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
      if (inputValue.trim()) handleSendMessage();
    } else {
      startListening();
    }
  };

  const handleNewChat = () => {
    clearMessages();
    setShowMobileSidebar(false);
  };

  const handleClearHistory = async () => {
    if (!user) return;
    const success = await clearHistory(user.id);
    if (success) {
      setHistoryGroups([]);
      toast({ title: "Đã xóa", description: "Lịch sử đã được xóa!" });
    }
  };

  const getWelcomeMessage = () => {
    const name = funId?.display_name || "bé";
    return WELCOME_MESSAGES[personality](name);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
        <div className="text-center p-8">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-500 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">Đăng nhập để trò chuyện với Angel AI</h2>
          <Button onClick={() => navigate('/auth')} className="mt-4">
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-yellow-50/50 via-pink-50/50 to-purple-50/50 dark:from-slate-900 dark:via-purple-950/50 dark:to-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="p-2 rounded-lg hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Logo */}
          <motion.div
            className="relative"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <motion.div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full border-2 border-yellow-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-yellow-600 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Angel AI
            </h1>
            <p className="text-xs text-muted-foreground">Thiên thần ánh sáng của bé</p>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2">
          {/* Personality selector (compact) */}
          <div className="hidden md:block">
            <PersonalitySelector 
              selected={personality} 
              onSelect={setPersonality} 
              compact 
            />
          </div>

          {/* Voice settings */}
          {ttsSupported && (
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          {/* Voice toggle */}
          {ttsSupported && (
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        {!isMobile && (
          <ConversationSidebar
            historyGroups={historyGroups}
            isLoading={loadingHistory}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onNewChat={handleNewChat}
            onClearHistory={handleClearHistory}
          />
        )}

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobile && showMobileSidebar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowMobileSidebar(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-[280px]"
              >
                <ConversationSidebar
                  historyGroups={historyGroups}
                  isLoading={loadingHistory}
                  isCollapsed={false}
                  onToggleCollapse={() => setShowMobileSidebar(false)}
                  onNewChat={handleNewChat}
                  onClearHistory={handleClearHistory}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Voice Settings Panel */}
          <AnimatePresence>
            {showVoiceSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border bg-white/80 dark:bg-slate-900/80"
              >
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
                  onSave={() => setShowVoiceSettings(false)}
                  onClose={() => setShowVoiceSettings(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Personality selector - Mobile */}
          {isMobile && (
            <div className="p-3 border-b border-border bg-white/50 dark:bg-slate-900/50">
              <PersonalitySelector 
                selected={personality} 
                onSelect={setPersonality} 
                compact 
              />
            </div>
          )}

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Welcome message if no messages */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center shadow-2xl"
                  >
                    <Sparkles className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-600 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {getWelcomeMessage()}
                  </h2>
                  
                  <p className="text-muted-foreground mt-4 max-w-md mx-auto">
                    Bé có thể hỏi Angel bất cứ điều gì: khoa học, động vật, vũ trụ, game, kể chuyện và nhiều hơn nữa! 🌈
                  </p>

                  {/* Quick suggestions */}
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {[
                      "Kể chuyện cổ tích",
                      "Tại sao trời xanh?",
                      "Game nào hay?",
                      "Đố vui đi!"
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputValue(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="rounded-full text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              {messages.map((message, index) => (
                <ChatMessageBubble
                  key={index}
                  message={message}
                  isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                  onSpeak={speak}
                  isSpeaking={isSpeaking}
                  onStopSpeaking={stopSpeaking}
                />
              ))}

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-yellow-200/50 dark:border-yellow-500/30 rounded-2xl px-4 py-3 shadow-md">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-sm text-muted-foreground"
                    >
                      Angel đang suy nghĩ...
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 border-t border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-center gap-2">
                {/* Voice input button */}
                {sttSupported && (
                  <Button
                    onClick={handleVoiceToggle}
                    variant={isListening ? "default" : "outline"}
                    size="icon"
                    className={`flex-shrink-0 rounded-full ${
                      isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                )}

                {/* Input */}
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? "Đang lắng nghe..." : "Hỏi Angel điều gì đó..."}
                    className="pr-12 rounded-full border-yellow-200 dark:border-yellow-600 focus:ring-yellow-400"
                    disabled={isLoading}
                  />
                  
                  {/* Send button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500 w-8 h-8"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Listening indicator */}
              {isListening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-red-500 mt-2"
                >
                  🎤 Đang lắng nghe... Nói xong thì nhấn nút mic để gửi
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
