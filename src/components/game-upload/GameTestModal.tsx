import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Play, CheckCircle, XCircle, Loader2, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";

interface GameTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameUrl: string | null; // URL hoặc blob URL để test
  gameTitle: string;
  onTestSuccess: () => void;
  onTestFail: (reason: string) => void;
}

const MIN_TEST_TIME_SECONDS = 10; // Phải chơi ít nhất 10 giây

export function GameTestModal({
  open,
  onOpenChange,
  gameUrl,
  gameTitle,
  onTestSuccess,
  onTestFail,
}: GameTestModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [canConfirm, setCanConfirm] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
      setTestStartTime(null);
      setElapsedSeconds(0);
      setCanConfirm(false);
      setIframeLoaded(false);
    }
  }, [open]);

  // Timer to track play time
  useEffect(() => {
    if (!testStartTime || !open) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
      setElapsedSeconds(elapsed);
      
      if (elapsed >= MIN_TEST_TIME_SECONDS && !canConfirm) {
        setCanConfirm(true);
        // Play sound or visual feedback
        toast.success("⏰ Bạn có thể xác nhận game chạy tốt!", { duration: 3000 });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [testStartTime, open, canConfirm]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setIframeLoaded(true);
    setTestStartTime(Date.now());
    toast.info(`🎮 Hãy chơi thử game trong ${MIN_TEST_TIME_SECONDS} giây để xác nhận!`, { duration: 4000 });
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage("Không thể tải game. Vui lòng kiểm tra lại file hoặc URL.");
  }, []);

  const handleConfirmSuccess = () => {
    // Fire celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#00FF00', '#00BFFF', '#FF69B4']
    });
    
    toast.success("🎉 Game xác nhận chạy tốt! Đang phê duyệt...", { duration: 3000 });
    onTestSuccess();
  };

  const handleReportProblem = () => {
    onTestFail("User reported game not working properly");
    onOpenChange(false);
  };

  const progressPercent = Math.min(100, (elapsedSeconds / MIN_TEST_TIME_SECONDS) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-purple-700">
            <Play className="w-6 h-6" />
            🎮 Test Game: {gameTitle}
          </DialogTitle>
          <DialogDescription className="text-purple-600">
            Chơi thử game để xác nhận nó hoạt động đúng. Bạn cần chơi ít nhất {MIN_TEST_TIME_SECONDS} giây trước khi xác nhận.
          </DialogDescription>
        </DialogHeader>

        {/* Test Progress Bar */}
        <div className="flex-shrink-0 px-4 py-2 bg-white/60 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
              <Clock className="w-4 h-4" />
              <span>Thời gian test: {elapsedSeconds}s / {MIN_TEST_TIME_SECONDS}s</span>
            </div>
            {canConfirm ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-green-600 font-bold"
              >
                <CheckCircle className="w-4 h-4" />
                Sẵn sàng xác nhận!
              </motion.div>
            ) : (
              <span className="text-sm text-muted-foreground">Đang test...</span>
            )}
          </div>
          <Progress value={progressPercent} className="h-3 bg-purple-100" />
        </div>

        {/* Game iframe container */}
        <div className="flex-1 relative rounded-xl overflow-hidden border-2 border-purple-200 bg-white">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 z-10">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto" />
                <p className="text-purple-600 font-medium">Đang tải game...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
              <div className="text-center space-y-4 p-8">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <h3 className="text-xl font-bold text-red-700">Game Không Tải Được!</h3>
                <p className="text-red-600">{errorMessage}</p>
                <Button variant="destructive" onClick={() => onTestFail(errorMessage)}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Báo lỗi & Đóng
                </Button>
              </div>
            </div>
          )}

          {gameUrl && (
            <iframe
              src={gameUrl}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              title={`Test: ${gameTitle}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex gap-4 justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleReportProblem}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            <AlertTriangle className="w-4 h-4" />
            Game có vấn đề
          </Button>

          <AnimatePresence>
            {canConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  onClick={handleConfirmSuccess}
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-6 text-lg font-bold shadow-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  ✅ Game Chạy Tốt - Nhận 500K CAMLY!
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {!canConfirm && iframeLoaded && (
            <Button disabled className="gap-2 opacity-50">
              <Clock className="w-4 h-4" />
              Chờ thêm {MIN_TEST_TIME_SECONDS - elapsedSeconds}s...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
