import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const WhackAMole = ({
  level = 1,
  difficultyMultiplier = 1.0,
  onLevelComplete,
  onBack
}: {
  level?: number;
  difficultyMultiplier?: number;
  onLevelComplete?: () => void;
  onBack?: () => void;
} = {}) => {
  const [moles, setMoles] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  const targetScore = level * 10;
  const moleSpeed = Math.max(500, 1200 - (level * 100));

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setMoles([]);
  }, []);

  const whackMole = (index: number) => {
    if (!moles.includes(index)) return;
    
    setMoles(prev => prev.filter(m => m !== index));
    setScore(prev => {
      const newScore = prev + 1;
      if (newScore >= targetScore && onLevelComplete) {
        toast.success("Hoàn thành level! 🏆");
        setTimeout(() => onLevelComplete(), 500);
      }
      return newScore;
    });
    toast.success("+1! 🔨");
  };

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          if (score > highScore) {
            setHighScore(score);
            toast.success(`Kỷ lục mới: ${score}! 🎉`);
          } else {
            toast.error(`Hết giờ! Điểm: ${score}`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, highScore]);

  // Spawn moles
  useEffect(() => {
    if (!isPlaying) return;

    const spawnMole = () => {
      const randomIndex = Math.floor(Math.random() * 9);
      setMoles(prev => {
        if (prev.includes(randomIndex)) return prev;
        return [...prev, randomIndex];
      });

      // Remove mole after some time
      setTimeout(() => {
        setMoles(prev => prev.filter(m => m !== randomIndex));
      }, moleSpeed);
    };

    const interval = setInterval(spawnMole, moleSpeed * 0.8);
    return () => clearInterval(interval);
  }, [isPlaying, moleSpeed]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Điểm: {score}/{targetScore}
        </h2>
        <div className="flex gap-4 justify-center text-muted-foreground">
          <span>⏱️ {timeLeft}s</span>
          <span>🏆 Kỷ lục: {highScore}</span>
        </div>
      </div>

      <Card className="p-4 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, index) => {
            const hasMole = moles.includes(index);
            return (
              <div
                key={index}
                onClick={() => whackMole(index)}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-b from-amber-700 to-amber-900 
                  flex items-center justify-center cursor-pointer overflow-hidden
                  border-4 border-amber-800 shadow-inner relative
                  ${hasMole ? "ring-4 ring-yellow-400" : ""}`}
              >
                <AnimatePresence>
                  {hasMole && (
                    <motion.div
                      initial={{ y: 60 }}
                      animate={{ y: 0 }}
                      exit={{ y: 60 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="text-4xl"
                    >
                      🐹
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        Chạm vào chuột chũi khi chúng xuất hiện! 🔨
      </p>

      <div className="flex gap-4">
        {onBack && (
          <Button onClick={onBack} size="lg" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        )}
        <Button onClick={startGame} size="lg" disabled={isPlaying}>
          {isPlaying ? `Đang chơi...` : "Bắt đầu"} 🔨
        </Button>
      </div>
    </div>
  );
};
