import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Lock, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelSelectorProps {
  highestLevelCompleted: number;
  currentLevel: number;
  onLevelSelect: (level: number) => void;
  onStartGame: () => void;
  getCoinReward: (level: number) => number;
}

export const LevelSelector = ({
  highestLevelCompleted,
  currentLevel,
  onLevelSelect,
  onStartGame,
  getCoinReward,
}: LevelSelectorProps) => {
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  const isLevelUnlocked = (level: number): boolean => {
    if (level === 1) return true;
    return highestLevelCompleted >= level - 1;
  };

  return (
    <Card className="p-8 border-4 border-primary/30 bg-gradient-to-br from-card via-primary/5 to-secondary/5">
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-4xl font-fredoka font-bold text-primary">
          Chọn Level 🎮
        </h2>
        <p className="text-lg font-comic text-muted-foreground">
          Hoàn thành level để mở level tiếp theo!
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {levels.map((level) => {
          const unlocked = isLevelUnlocked(level);
          const completed = level <= highestLevelCompleted;
          const selected = level === currentLevel;
          const coinReward = getCoinReward(level);

          return (
            <button
              key={level}
              onClick={() => unlocked && onLevelSelect(level)}
              disabled={!unlocked}
              className={cn(
                "relative p-6 rounded-2xl border-4 transition-all group",
                selected && unlocked && "border-primary bg-primary/20 shadow-lg scale-105",
                !selected && unlocked && "border-primary/30 hover:border-primary hover:bg-primary/10 hover:scale-105",
                !unlocked && "border-muted bg-muted/20 cursor-not-allowed opacity-50"
              )}
            >
              {/* Level number */}
              <div className={cn(
                "text-4xl font-fredoka font-bold mb-2",
                unlocked ? "text-primary" : "text-muted-foreground"
              )}>
                {level}
              </div>

              {/* Status icon */}
              <div className="flex justify-center mb-2">
                {!unlocked && <Lock className="w-6 h-6 text-muted-foreground" />}
                {completed && unlocked && <Star className="w-6 h-6 text-accent fill-accent" />}
                {unlocked && !completed && <Trophy className="w-6 h-6 text-primary" />}
              </div>

              {/* Coin reward */}
              {unlocked && (
                <div className="text-sm font-comic text-secondary font-bold">
                  +{coinReward} 🪙
                </div>
              )}

              {/* Difficulty indicator */}
              {unlocked && (
                <div className="text-xs text-muted-foreground mt-1">
                  +{(level - 1) * 5}% khó
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center space-y-1">
          <p className="text-2xl font-fredoka font-bold text-primary">
            Level {currentLevel}
          </p>
          <p className="text-lg font-comic text-secondary font-bold">
            Phần thưởng: {getCoinReward(currentLevel)} Camly Coins 🪙
          </p>
          <p className="text-sm text-muted-foreground font-comic">
            Độ khó: +{(currentLevel - 1) * 5}% so với Level 1
          </p>
        </div>

        <Button
          onClick={onStartGame}
          size="lg"
          className="font-fredoka font-bold text-2xl px-12 py-8 bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-xl transform hover:scale-110 transition-all"
        >
          Bắt Đầu Chơi! 🚀
        </Button>
      </div>
    </Card>
  );
};
