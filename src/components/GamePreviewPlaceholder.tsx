import { Gamepad2, Puzzle, Zap, Brain, Target, Sparkles } from "lucide-react";

interface GamePreviewPlaceholderProps {
  title: string;
  category: string;
}

const categoryConfig: Record<string, { icon: typeof Gamepad2; gradient: string; emoji: string }> = {
  action: { icon: Zap, gradient: "from-orange-500 to-red-600", emoji: "⚡" },
  puzzle: { icon: Puzzle, gradient: "from-blue-500 to-purple-600", emoji: "🧩" },
  adventure: { icon: Sparkles, gradient: "from-green-500 to-teal-600", emoji: "🗺️" },
  arcade: { icon: Target, gradient: "from-yellow-500 to-orange-600", emoji: "🕹️" },
  educational: { icon: Brain, gradient: "from-pink-500 to-rose-600", emoji: "📚" },
  strategy: { icon: Brain, gradient: "from-indigo-500 to-blue-600", emoji: "♟️" },
  sports: { icon: Target, gradient: "from-emerald-500 to-green-600", emoji: "⚽" },
  racing: { icon: Zap, gradient: "from-red-500 to-pink-600", emoji: "🏎️" },
  simulation: { icon: Gamepad2, gradient: "from-cyan-500 to-blue-600", emoji: "🎮" },
  other: { icon: Gamepad2, gradient: "from-violet-500 to-purple-600", emoji: "🎲" },
};

export const GamePreviewPlaceholder = ({ title, category }: GamePreviewPlaceholderProps) => {
  const config = categoryConfig[category.toLowerCase()] || categoryConfig.other;
  const Icon = config.icon;

  return (
    <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-2 left-2 text-4xl animate-bounce" style={{ animationDelay: "0s" }}>
          {config.emoji}
        </div>
        <div className="absolute top-4 right-4 text-3xl animate-bounce" style={{ animationDelay: "0.5s" }}>
          {config.emoji}
        </div>
        <div className="absolute bottom-8 left-6 text-2xl animate-bounce" style={{ animationDelay: "1s" }}>
          {config.emoji}
        </div>
        <div className="absolute bottom-4 right-8 text-4xl animate-bounce" style={{ animationDelay: "0.3s" }}>
          {config.emoji}
        </div>
      </div>

      {/* Main icon */}
      <div className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-4 mb-3 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-10 h-10 text-white drop-shadow-lg" />
      </div>

      {/* Title */}
      <h3 className="relative z-10 text-white font-bold text-center text-sm line-clamp-2 drop-shadow-lg px-2">
        {title}
      </h3>

      {/* Play indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">
        <span className="text-white text-xs font-medium flex items-center gap-1">
          <Gamepad2 className="w-3 h-3" />
          Nhấn để chơi
        </span>
      </div>
    </div>
  );
};
