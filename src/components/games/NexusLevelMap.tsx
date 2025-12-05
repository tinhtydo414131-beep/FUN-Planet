import React from 'react';
import { Lock, Star, Trophy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface NexusLevelMapProps {
  currentLevel: number;
  highestUnlocked: number;
  onSelectLevel: (level: number) => void;
}

const MAX_LEVEL = 100;

export const NexusLevelMap: React.FC<NexusLevelMapProps> = ({
  currentLevel,
  highestUnlocked,
  onSelectLevel
}) => {
  const getTargetScore = (lvl: number) => lvl * 200;
  
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <ScrollArea className="h-[500px] md:h-[600px] rounded-xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30 p-4">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-3 p-2">
          {levels.map((level) => {
            const isUnlocked = level <= highestUnlocked;
            const isCurrent = level === currentLevel;
            const isCompleted = level < highestUnlocked;
            const targetScore = getTargetScore(level);
            
            return (
              <button
                key={level}
                onClick={() => isUnlocked && onSelectLevel(level)}
                disabled={!isUnlocked}
                className={cn(
                  "relative aspect-square rounded-xl font-fredoka transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                  "border-2 shadow-md hover:shadow-lg",
                  isUnlocked ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-60",
                  isCurrent && "ring-2 ring-accent ring-offset-2 ring-offset-background",
                  isCompleted 
                    ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-300 text-white" 
                    : isUnlocked 
                      ? "bg-gradient-to-br from-primary to-accent border-primary/50 text-white"
                      : "bg-muted border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted && (
                  <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 fill-yellow-300" />
                )}
                
                {!isUnlocked ? (
                  <Lock className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <>
                    <span className="text-sm md:text-lg font-bold">{level}</span>
                    <span className="text-[8px] md:text-[10px] opacity-80">{targetScore}pts</span>
                  </>
                )}
                
                {level === MAX_LEVEL && isUnlocked && (
                  <Trophy className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NexusLevelMap;
