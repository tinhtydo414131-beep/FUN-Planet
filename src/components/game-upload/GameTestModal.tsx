import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Play, CheckCircle, XCircle, Loader2, Clock, AlertTriangle, Sparkles, MousePointer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";

interface GameTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameUrl: string | null;
  gameTitle: string;
  onTestSuccess: () => void;
  onTestFail: (reason: string) => void;
}

const MIN_TEST_TIME_SECONDS = 30; // Increased from 10s to 30s
const CRASH_CHECK_INTERVAL = 2000; // Check every 2 seconds

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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [crashDetected, setCrashDetected] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const crashCheckIntervalRef = useRef<number | null>(null);

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
      setHasInteracted(false);
      setIsConfirming(false);
      setCrashDetected(false);
    } else {
      // Cleanup when modal closes
      if (crashCheckIntervalRef.current) {
        clearInterval(crashCheckIntervalRef.current);
        crashCheckIntervalRef.current = null;
      }
    }
  }, [open]);

  // Timer to track play time
  useEffect(() => {
    if (!testStartTime || !open) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
      setElapsedSeconds(elapsed);
      
      // Can confirm after MIN_TEST_TIME AND user has interacted
      if (elapsed >= MIN_TEST_TIME_SECONDS && hasInteracted && !canConfirm) {
        setCanConfirm(true);
        toast.success("✅ Bạn có thể xác nhận game chạy tốt!", { duration: 3000 });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [testStartTime, open, canConfirm, hasInteracted]);

  // Crash detection - check iframe content periodically
  useEffect(() => {
    if (!iframeLoaded || !open || hasError) return;

    crashCheckIntervalRef.current = window.setInterval(() => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;
        
        // Try to access iframe document (will fail for cross-origin)
        // For same-origin blobs, check for blank/error content
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const bodyText = iframeDoc.body?.innerText?.toLowerCase() || '';
            const bodyHtml = iframeDoc.body?.innerHTML?.toLowerCase() || '';
            
            // Check for common error indicators
            const errorIndicators = [
              'cannot read properties',
              'undefined is not',
              'null is not',
              'typeerror',
              'referenceerror', 
              'syntaxerror',
              'failed to load',
              'loading failed',
              'error loading',
              'module not found',
              'chunk load error',
            ];
            
            const hasErrorText = errorIndicators.some(err => 
              bodyText.includes(err) || bodyHtml.includes(err)
            );
            
            // Check if body is empty or just whitespace
            const isBlank = !bodyText.trim() && !iframeDoc.body?.querySelector('canvas, svg, video, img');
            
            if (hasErrorText) {
              setCrashDetected(true);
              setErrorMessage("Game crashed hoặc có lỗi JavaScript!");
            } else if (isBlank && elapsedSeconds > 5) {
              // Only flag blank after 5 seconds (give time to render)
              setCrashDetected(true);
              setErrorMessage("Game không render được nội dung!");
            }
          }
        } catch (e) {
          // Cross-origin access denied - can't check content
          // This is normal for external URLs
        }
      } catch (err) {
        console.warn('Crash check error:', err);
      }
    }, CRASH_CHECK_INTERVAL);

    return () => {
      if (crashCheckIntervalRef.current) {
        clearInterval(crashCheckIntervalRef.current);
        crashCheckIntervalRef.current = null;
      }
    };
  }, [iframeLoaded, open, hasError, elapsedSeconds]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setIframeLoaded(true);
    setTestStartTime(Date.now());
    toast.info(
      `🎮 Hãy chơi thử game trong ${MIN_TEST_TIME_SECONDS} giây và tương tác với game để xác nhận!`, 
      { duration: 5000 }
    );
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage("Không thể tải game. Vui lòng kiểm tra lại file hoặc URL.");
  }, []);

  // Detect user interaction with iframe
  const handleIframeClick = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      toast.success("👆 Đã phát hiện tương tác! Tiếp tục chơi thử...", { duration: 2000 });
    }
  }, [hasInteracted]);

  const handleConfirmSuccess = useCallback(() => {
    if (isConfirming) return; // Prevent double-click
    setIsConfirming(true);
    
    // Fire celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#00FF00', '#00BFFF', '#FF69B4']
    });
    
    toast.success("🎉 Game xác nhận chạy tốt! Đang phê duyệt...", { duration: 3000 });
    onTestSuccess();
  }, [isConfirming, onTestSuccess]);

  const handleReportProblem = useCallback(() => {
    onTestFail("User reported game not working properly");
    onOpenChange(false);
  }, [onTestFail, onOpenChange]);

  const handleCrashReport = useCallback(() => {
    onTestFail(errorMessage || "Game crashed or failed to render");
    onOpenChange(false);
  }, [errorMessage, onTestFail, onOpenChange]);

  const progressPercent = Math.min(100, (elapsedSeconds / MIN_TEST_TIME_SECONDS) * 100);
  const timeRemaining = Math.max(0, MIN_TEST_TIME_SECONDS - elapsedSeconds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-purple-700">
              <Play className="w-6 h-6" />
              🎮 Test Game: {gameTitle}
            </DialogTitle>
            <DialogDescription className="text-purple-600">
              Chơi thử game trong {MIN_TEST_TIME_SECONDS} giây VÀ tương tác (click/nhấn) để xác nhận game hoạt động.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Test Progress Bar */}
        <div className="flex-shrink-0 px-4 py-3 bg-white/60 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
              <Clock className="w-4 h-4" />
              <span>Thời gian test: {elapsedSeconds}s / {MIN_TEST_TIME_SECONDS}s</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Interaction indicator */}
              <div className={`flex items-center gap-1 text-sm ${hasInteracted ? 'text-green-600' : 'text-orange-500'}`}>
                <MousePointer className="w-4 h-4" />
                <span>{hasInteracted ? '✓ Đã tương tác' : 'Chưa tương tác'}</span>
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
                <span className="text-sm text-muted-foreground">
                  {!hasInteracted && elapsedSeconds >= MIN_TEST_TIME_SECONDS 
                    ? 'Cần click vào game!' 
                    : `Còn ${timeRemaining}s...`}
                </span>
              )}
            </div>
          </div>
          <Progress value={progressPercent} className="h-3 bg-purple-100" />
        </div>

        {/* Crash Warning Banner */}
        {crashDetected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 px-4 py-3 bg-red-100 rounded-xl border border-red-300 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-700">⚠️ Phát hiện lỗi game!</p>
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleCrashReport}
              className="flex-shrink-0"
            >
              Báo lỗi
            </Button>
          </motion.div>
        )}

        {/* Game iframe container */}
        <div 
          className="flex-1 relative rounded-xl overflow-hidden border-2 border-purple-200 bg-white"
          onClick={handleIframeClick}
        >
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
              ref={iframeRef}
              src={gameUrl}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              title={`Test: ${gameTitle}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
          
          {/* Click overlay hint - only show if not interacted */}
          {iframeLoaded && !hasInteracted && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-white/90 px-6 py-3 rounded-full shadow-lg border-2 border-purple-300"
              >
                <span className="text-purple-700 font-medium flex items-center gap-2">
                  <MousePointer className="w-5 h-5" />
                  Click vào game để bắt đầu chơi!
                </span>
              </motion.div>
            </div>
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
            {canConfirm && !crashDetected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  onClick={handleConfirmSuccess}
                  disabled={isConfirming}
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-6 text-lg font-bold shadow-lg disabled:opacity-50"
                >
                  {isConfirming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {isConfirming ? 'Đang xử lý...' : '✅ Game Chạy Tốt - Nhận 500K CAMLY!'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {!canConfirm && iframeLoaded && !crashDetected && (
            <Button disabled className="gap-2 opacity-50">
              <Clock className="w-4 h-4" />
              {!hasInteracted 
                ? 'Click vào game trước!' 
                : `Chờ thêm ${timeRemaining}s...`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
