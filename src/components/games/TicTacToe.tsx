import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Heart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type Player = "X" | "O" | null;
type Difficulty = "easy" | "medium" | "hard";

const BOARD_SIZE = 30;
const WIN_LENGTH = 5;
const CELL_SIZE = 24;

export const TicTacToe = ({
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
  const [board, setBoard] = useState<Player[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [wins, setWins] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameStarted, setGameStarted] = useState(false);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const targetWins = Math.min(level, 3);

  // Auto-scroll to center on mount
  useEffect(() => {
    if (gridRef.current && gameStarted) {
      const centerOffset = (BOARD_SIZE * CELL_SIZE) / 2 - gridRef.current.clientWidth / 2;
      gridRef.current.scrollLeft = centerOffset;
      gridRef.current.scrollTop = centerOffset;
    }
  }, [gameStarted]);

  const checkWinner = useCallback((squares: Player[], lastMoveIdx: number): { winner: Player; cells: number[] } => {
    if (lastMoveIdx === -1) return { winner: null, cells: [] };
    
    const row = Math.floor(lastMoveIdx / BOARD_SIZE);
    const col = lastMoveIdx % BOARD_SIZE;
    const player = squares[lastMoveIdx];
    
    if (!player) return { winner: null, cells: [] };

    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1],  // diagonal down-left
    ];

    for (const [dr, dc] of directions) {
      const cells = [lastMoveIdx];
      
      // Check positive direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const idx = r * BOARD_SIZE + c;
          if (squares[idx] === player) {
            cells.push(idx);
          } else break;
        } else break;
      }
      
      // Check negative direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const idx = r * BOARD_SIZE + c;
          if (squares[idx] === player) {
            cells.push(idx);
          } else break;
        } else break;
      }
      
      if (cells.length >= WIN_LENGTH) return { winner: player, cells };
    }
    
    return { winner: null, cells: [] };
  }, []);

  const evaluateLine = (squares: Player[], start: number, dr: number, dc: number, player: Player): number => {
    let score = 0;
    
    for (let len = WIN_LENGTH; len >= 2; len--) {
      for (let offset = 0; offset <= WIN_LENGTH - len; offset++) {
        let playerCount = 0;
        let emptyCount = 0;
        let blocked = false;
        
        for (let i = offset; i < offset + len; i++) {
          const row = Math.floor(start / BOARD_SIZE) + dr * i;
          const col = start % BOARD_SIZE + dc * i;
          
          if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            blocked = true;
            break;
          }
          
          const cell = squares[row * BOARD_SIZE + col];
          if (cell === player) playerCount++;
          else if (cell === null) emptyCount++;
          else {
            blocked = true;
            break;
          }
        }
        
        if (!blocked && playerCount > 0 && emptyCount > 0) {
          score += Math.pow(10, playerCount);
        }
      }
    }
    
    return score;
  };

  const evaluatePosition = (squares: Player[], player: Player): number => {
    let score = 0;
    
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      score += evaluateLine(squares, i, 0, 1, player);
      score += evaluateLine(squares, i, 1, 0, player);
      score += evaluateLine(squares, i, 1, 1, player);
      score += evaluateLine(squares, i, 1, -1, player);
    }
    
    return score;
  };

  const getEmptyCells = (squares: Player[]): number[] => {
    return squares.map((cell, i) => cell === null ? i : -1).filter(i => i !== -1);
  };

  const getBestMove = useCallback((squares: Player[]): number => {
    const emptyCells = getEmptyCells(squares);
    if (emptyCells.length === 0) return -1;
    
    if (difficulty === "easy") {
      if (Math.random() < 0.7) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    }
    
    if (difficulty === "medium") {
      if (Math.random() < 0.4) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    }

    let bestScore = -Infinity;
    let bestMoves: number[] = [];
    
    for (const move of emptyCells) {
      const newSquares = [...squares];
      newSquares[move] = "O";
      
      if (checkWinner(newSquares, move).winner === "O") {
        return move;
      }
      
      newSquares[move] = "X";
      if (checkWinner(newSquares, move).winner === "X") {
        return move;
      }
      
      newSquares[move] = "O";
      const score = evaluatePosition(newSquares, "O") - evaluatePosition(newSquares, "X") * 1.1;
      
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }
    
    const centerMoves = bestMoves.filter(move => {
      const row = Math.floor(move / BOARD_SIZE);
      const col = move % BOARD_SIZE;
      return row >= 10 && row <= 20 && col >= 10 && col <= 20;
    });
    
    if (centerMoves.length > 0) {
      return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    }
    
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }, [difficulty, checkWinner]);

  const handleClick = (index: number) => {
    if (board[index] || !isXNext || winningCells.length > 0) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setLastMove(index);
    setIsXNext(false);

    const { winner, cells } = checkWinner(newBoard, index);
    if (winner === "X") {
      setWinningCells(cells);
      const newWins = wins + 1;
      setWins(newWins);
      toast.success("Bạn thắng! 🎉");
      if (newWins >= targetWins && onLevelComplete) {
        setTimeout(() => onLevelComplete(), 1000);
      }
      return;
    }

    if (!newBoard.includes(null)) {
      toast("Hòa rồi! 🤝");
      return;
    }

    setTimeout(() => {
      const aiMove = getBestMove([...newBoard]);
      if (aiMove === -1) return;
      
      newBoard[aiMove] = "O";
      setBoard([...newBoard]);
      setLastMove(aiMove);
      setIsXNext(true);

      const aiResult = checkWinner(newBoard, aiMove);
      if (aiResult.winner === "O") {
        setWinningCells(aiResult.cells);
        toast.error("Máy thắng rồi! 🤖");
      } else if (!newBoard.includes(null)) {
        toast("Hòa rồi! 🤝");
      }
    }, 300);
  };

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
    setIsXNext(true);
    setLastMove(null);
    setWinningCells([]);
  };

  const resetAll = () => {
    resetGame();
    setWins(0);
    setGameStarted(false);
  };

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameStarted(true);
    resetGame();
  };

  const isDraw = winningCells.length === 0 && !board.includes(null);
  const hasWinner = winningCells.length > 0;

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center gap-6 p-6 animate-fade-in">
        {/* Difficulty Selection Screen */}
        <div className="bg-gradient-to-br from-teal-300 via-cyan-300 to-green-300 p-6 rounded-3xl shadow-2xl">
          <div className="grid grid-cols-3 gap-2 w-48 h-48 mb-4">
            {[null, "X", null, "X", "O", "X", null, "O", null].map((cell, i) => (
              <div 
                key={i}
                className={`rounded-lg flex items-center justify-center text-3xl font-bold ${
                  cell === "X" ? "bg-yellow-400 text-yellow-900" :
                  cell === "O" ? "bg-orange-400 text-orange-900" :
                  "bg-teal-400/50"
                }`}
              >
                {cell === "X" && "✕"}
                {cell === "O" && "○"}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-1 bg-white/30 px-3 py-1 rounded-full">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-bold">0</span>
            </div>
            <div className="flex items-center gap-1 bg-white/30 px-3 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold">0</span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground">Tic Tac Toe</h2>
        <p className="text-muted-foreground text-center">Đánh cờ XO với máy tính thông minh!</p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button 
            onClick={() => startGame("easy")} 
            size="lg" 
            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg"
          >
            😊 Dễ
          </Button>
          <Button 
            onClick={() => startGame("medium")} 
            size="lg" 
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg"
          >
            ⚡ Trung bình
          </Button>
          <Button 
            onClick={() => startGame("hard")} 
            size="lg" 
            className="w-full bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white shadow-lg"
          >
            🔥 Khó
          </Button>
        </div>
        
        {onBack && (
          <Button onClick={onBack} variant="outline" className="mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 animate-fade-in w-full max-w-2xl mx-auto">
      {/* Header Stats */}
      <div className="w-full flex items-center justify-between">
        {onBack && (
          <Button onClick={onBack} size="sm" variant="ghost">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h2 className="text-xl font-bold text-foreground">Tic Tac Toe</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          difficulty === "easy" ? "bg-green-500/20 text-green-600" :
          difficulty === "medium" ? "bg-yellow-500/20 text-yellow-600" :
          "bg-red-500/20 text-red-600"
        }`}>
          {difficulty === "easy" ? "😊 easy" : difficulty === "medium" ? "⚡ medium" : "🔥 hard"}
        </span>
      </div>

      {/* Score Bar */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl px-6 py-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          <span className="font-bold text-foreground">{wins}</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-foreground">{targetWins - wins} left</span>
        </div>
      </div>

      {/* Status */}
      <p className="text-sm text-muted-foreground">
        {hasWinner ? (
          winningCells.length > 0 && board[winningCells[0]] === "X" 
            ? "🎉 Bạn thắng!" 
            : "🤖 Máy thắng!"
        ) : isDraw ? "🤝 Hòa!" : (
          isXNext ? "Lượt của bạn (X)" : "Máy đang suy nghĩ..."
        )}
      </p>

      {/* Game Grid */}
      <div 
        ref={gridRef}
        className="bg-gradient-to-br from-teal-300 via-cyan-300 to-green-300 p-3 rounded-3xl shadow-2xl overflow-auto max-w-full"
        style={{ maxHeight: '60vh' }}
      >
        <div 
          className="grid gap-0.5"
          style={{ 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            width: 'fit-content'
          }}
        >
          {board.map((cell, index) => {
            const isWinning = winningCells.includes(index);
            const isLast = lastMove === index;
            
            return (
              <motion.button
                key={index}
                initial={cell && isLast ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                onClick={() => handleClick(index)}
                disabled={!!cell || hasWinner || !isXNext}
                className={`
                  flex items-center justify-center text-sm font-bold rounded-sm transition-all
                  ${isWinning ? 'ring-2 ring-white animate-pulse' : ''}
                  ${cell === "X" 
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 shadow-md" 
                    : cell === "O" 
                    ? "bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900 shadow-md" 
                    : "bg-teal-400/60 hover:bg-teal-400 hover:scale-110"
                  }
                  ${!cell && !hasWinner && isXNext ? "cursor-pointer" : "cursor-default"}
                `}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
              >
                {cell === "X" && <span className="drop-shadow">✕</span>}
                {cell === "O" && <span className="drop-shadow">○</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Bàn {BOARD_SIZE}×{BOARD_SIZE} • Nối {WIN_LENGTH} ô để thắng</p>

      {/* Controls */}
      <div className="flex gap-3">
        <Button onClick={resetGame} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Ván mới
        </Button>
        <Button onClick={resetAll} className="bg-gradient-to-r from-primary to-secondary">
          Đổi độ khó
        </Button>
      </div>
    </div>
  );
};
