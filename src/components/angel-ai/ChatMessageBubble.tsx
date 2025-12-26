import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ThumbsUp, Heart, Laugh, Sparkles, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/hooks/useAngelAIChat";
import { useToast } from "@/hooks/use-toast";

const REACTIONS = [
  { emoji: "👍", icon: ThumbsUp, label: "Tuyệt vời" },
  { emoji: "❤️", icon: Heart, label: "Yêu thích" },
  { emoji: "😂", icon: Laugh, label: "Haha" },
  { emoji: "✨", icon: Sparkles, label: "Tuyệt vời" },
];

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
}

export function ChatMessageBubble({ 
  message, 
  isStreaming = false,
  onSpeak,
  isSpeaking,
  onStopSpeaking 
}: ChatMessageBubbleProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({
        title: "Đã copy!",
        description: "Nội dung đã được sao chép",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép nội dung",
        variant: "destructive",
      });
    }
  };

  const handleReaction = (emoji: string) => {
    setSelectedReaction(emoji === selectedReaction ? null : emoji);
    setShowReactions(false);
  };

  const handleVoice = () => {
    if (isSpeaking) {
      onStopSpeaking?.();
    } else {
      onSpeak?.(message.content);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md",
          isUser
            ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
            : "bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 text-white"
        )}
      >
        {isUser ? "👤" : "✨"}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        {/* Role label */}
        <span className="text-xs text-muted-foreground px-1">
          {isUser ? "Bé" : "Angel AI"}
        </span>

        {/* Message bubble */}
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl shadow-md",
            isUser
              ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-tr-sm"
              : "bg-white dark:bg-slate-800 border border-yellow-200/50 dark:border-yellow-500/30 rounded-tl-sm"
          )}
        >
          {/* Markdown content for assistant, plain text for user */}
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold text-yellow-600 dark:text-yellow-400">{children}</strong>,
                  em: ({ children }) => <em className="italic text-pink-600 dark:text-pink-400">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2">{children}</pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Streaming indicator */}
          {isStreaming && !isUser && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block ml-1 w-2 h-4 bg-yellow-500 rounded-sm"
            />
          )}

          {/* Selected reaction badge */}
          {selectedReaction && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-2 -right-1 bg-white dark:bg-slate-700 rounded-full px-1.5 py-0.5 shadow-lg border text-sm"
            >
              {selectedReaction}
            </motion.div>
          )}
        </div>

        {/* Action buttons - only show for completed messages */}
        {!isStreaming && message.content && (
          <div className={cn(
            "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "flex-row-reverse" : "flex-row"
          )}>
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Sao chép"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>

            {/* Voice button - only for assistant */}
            {!isUser && onSpeak && (
              <button
                onClick={handleVoice}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  isSpeaking 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600" 
                    : "hover:bg-muted text-muted-foreground"
                )}
                title={isSpeaking ? "Dừng đọc" : "Đọc tin nhắn"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* Reactions button */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                title="Phản ứng"
              >
                <span className="text-sm">😊</span>
              </button>

              {/* Reactions popup */}
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                    className="absolute bottom-full left-0 mb-1 bg-white dark:bg-slate-800 rounded-full shadow-xl border px-1 py-0.5 flex items-center gap-0.5 z-10"
                  >
                    {REACTIONS.map((r) => (
                      <button
                        key={r.emoji}
                        onClick={() => handleReaction(r.emoji)}
                        className={cn(
                          "p-1.5 rounded-full hover:bg-muted transition-all hover:scale-125",
                          selectedReaction === r.emoji && "bg-muted"
                        )}
                        title={r.label}
                      >
                        <span className="text-base">{r.emoji}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {message.created_at && (
          <span className="text-[10px] text-muted-foreground/60 px-1">
            {new Date(message.created_at).toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        )}
      </div>
    </motion.div>
  );
}
