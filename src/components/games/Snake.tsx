import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";

interface Position {
  x: number;
  y: number;
}

export const Snake = ({
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
  const gridSize = 15;
  const initialSpeed = Math.max(100, 200 - (level * 10));
  const targetScore = level * 5;

  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<string>("RIGHT");
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const directionRef = useRef(direction);

  const generateFood = useCallback(() => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake([{ x: 7, y: 7 }]);
    setFood({ x: 5, y: 5 });
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
  };

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
  };

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      const current = directionRef.current;
      switch (e.key) {
        case "ArrowUp":
          if (current !== "DOWN") setDirection("UP");
          break;
        case "ArrowDown":
          if (current !== "UP") setDirection("DOWN");
          break;
        case "ArrowLeft":
          if (current !== "RIGHT") setDirection("LEFT");
          break;
        case "ArrowRight":
          if (current !== "LEFT") setDirection("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;
        
        switch (currentDir) {
          case "UP": head.y -= 1; break;
          case "DOWN": head.y += 1; break;
          case "LEFT": head.x -= 1; break;
          case "RIGHT": head.x += 1; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
          setGameOver(true);
          setIsPlaying(false);
          toast.error("Game Over! Đụng tường rồi! 🐍");
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          setIsPlaying(false);
          toast.error("Game Over! Cắn đuôi rồi! 🐍");
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => {
            const newScore = prev + 1;
            if (newScore >= targetScore && onLevelComplete) {
              toast.success("Tuyệt vời! Hoàn thành level! 🎉");
              setTimeout(() => onLevelComplete(), 500);
            }
            return newScore;
          });
          setFood(generateFood());
          toast.success("+1 điểm! 🍎");
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, initialSpeed);
    return () => clearInterval(gameInterval);
  }, [isPlaying, gameOver, food, generateFood, initialSpeed, targetScore, onLevelComplete]);

  const handleDirectionButton = (newDir: string) => {
    if (!isPlaying) return;
    const current = directionRef.current;
    if (
      (newDir === "UP" && current !== "DOWN") ||
      (newDir === "DOWN" && current !== "UP") ||
      (newDir === "LEFT" && current !== "RIGHT") ||
      (newDir === "RIGHT" && current !== "LEFT")
    ) {
      setDirection(newDir);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Điểm: {score}/{targetScore}
        </h2>
        <p className="text-muted-foreground">Level {level} - Dùng mũi tên để điều khiển!</p>
      </div>

      <Card className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800">
        <div 
          className="grid gap-[1px] bg-green-300 dark:bg-green-700 rounded"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: `min(85vw, ${gridSize * 20}px)`,
            height: `min(85vw, ${gridSize * 20}px)`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`aspect-square rounded-sm transition-all ${
                  isSnakeHead 
                    ? "bg-green-600 dark:bg-green-400 scale-110" 
                    : isSnake 
                    ? "bg-green-500 dark:bg-green-500" 
                    : isFood 
                    ? "bg-red-500 animate-pulse" 
                    : "bg-green-100 dark:bg-green-900"
                }`}
              >
                {isSnakeHead && <span className="text-xs">👀</span>}
                {isFood && <span className="text-xs">🍎</span>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <Button 
          size="lg" 
          variant="outline"
          onClick={() => handleDirectionButton("UP")}
          disabled={!isPlaying}
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
        <div />
        <Button 
          size="lg" 
          variant="outline"
          onClick={() => handleDirectionButton("LEFT")}
          disabled={!isPlaying}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button 
          size="lg" 
          variant="outline"
          onClick={() => handleDirectionButton("DOWN")}
          disabled={!isPlaying}
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
        <Button 
          size="lg" 
          variant="outline"
          onClick={() => handleDirectionButton("RIGHT")}
          disabled={!isPlaying}
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex gap-4">
        {onBack && (
          <Button onClick={onBack} size="lg" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        )}
        <Button onClick={startGame} size="lg">
          {isPlaying ? "Chơi lại" : gameOver ? "Chơi lại" : "Bắt đầu"} 🐍
        </Button>
      </div>
    </div>
  );
};
