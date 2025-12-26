import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  Star, 
  ChevronLeft,
  ChevronRight,
  History,
  Loader2 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChatHistoryGroup } from "@/hooks/useAngelAIChat";
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

interface ConversationSidebarProps {
  historyGroups: ChatHistoryGroup[];
  isLoading: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewChat: () => void;
  onClearHistory: () => void;
  onLoadConversation?: (group: ChatHistoryGroup) => void;
}

export function ConversationSidebar({
  historyGroups,
  isLoading,
  isCollapsed,
  onToggleCollapse,
  onNewChat,
  onClearHistory,
  onLoadConversation,
}: ConversationSidebarProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 60 : 280 }}
        className="h-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-r border-border flex flex-col"
      >
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-sm">Lịch sử</span>
            </motion.div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-2">
          <Button
            onClick={onNewChat}
            variant="outline"
            size="sm"
            className={`w-full gap-2 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-yellow-300 dark:border-yellow-600 hover:from-yellow-400/30 hover:to-pink-400/30 ${
              isCollapsed ? "px-2" : ""
            }`}
          >
            <Plus className="w-4 h-4" />
            {!isCollapsed && <span>Cuộc trò chuyện mới</span>}
          </Button>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1 px-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
            </div>
          ) : historyGroups.length === 0 ? (
            !isCollapsed && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs">Chưa có lịch sử</p>
                <p className="text-[10px] mt-1">Bắt đầu trò chuyện nào!</p>
              </div>
            )
          ) : (
            <div className="space-y-1 py-2">
              {historyGroups.map((group, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onLoadConversation?.(group)}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted/70 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                      <Star className="w-3 h-3 text-yellow-600" />
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{group.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {group.messages[0]?.content?.slice(0, 30)}...
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {group.messages.length} tin nhắn
                        </p>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer - Clear History */}
        {!isCollapsed && historyGroups.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-xs">Xóa lịch sử</span>
            </Button>
          </div>
        )}
      </motion.aside>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa lịch sử trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Tất cả các cuộc trò chuyện với Angel sẽ bị xóa vĩnh viễn. Bé có chắc chắn không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearHistory();
                setShowClearDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
