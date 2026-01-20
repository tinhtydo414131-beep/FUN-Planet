import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical, Pencil, Trash2, Check, X, Forward, Reply, Pin, PinOff } from "lucide-react";

interface MessageActionsProps {
  messageId: string;
  isOwn: boolean;
  isPinned?: boolean;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onForward: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onPin: (messageId: string) => void;
}

export function MessageActionsMenu({ messageId, isOwn, isPinned, onEdit, onDelete, onForward, onReply, onPin }: MessageActionsProps) {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onReply(messageId)} className="gap-2">
            <Reply className="w-4 h-4" />
            {t('messages.reply')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPin(messageId)} className="gap-2">
            {isPinned ? (
              <>
                <PinOff className="w-4 h-4" />
                {t('messages.unpin')}
              </>
            ) : (
              <>
                <Pin className="w-4 h-4" />
                {t('messages.pin')}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onForward(messageId)} className="gap-2">
            <Forward className="w-4 h-4" />
            {t('messages.forward')}
          </DropdownMenuItem>
          {isOwn && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(messageId)} className="gap-2">
                <Pencil className="w-4 h-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-quicksand">{t('messages.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(messageId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface MessageEditInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function MessageEditInput({ value, onChange, onSave, onCancel }: MessageEditInputProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSave();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        autoFocus
        className="flex-1 text-sm"
      />
      <Button size="icon" variant="ghost" onClick={onSave} className="h-8 w-8 text-green-500">
        <Check className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onCancel} className="h-8 w-8 text-destructive">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
