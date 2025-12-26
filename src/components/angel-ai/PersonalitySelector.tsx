import { motion } from "framer-motion";
import { Sparkles, BookOpen, Gamepad2, Palette } from "lucide-react";

export type PersonalityMode = "cheerful" | "wise" | "gamer" | "creative";

interface PersonalityOption {
  id: PersonalityMode;
  name: string;
  emoji: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
}

const personalities: PersonalityOption[] = [
  {
    id: "cheerful",
    name: "Vui Vẻ",
    emoji: "🌟",
    icon: <Sparkles className="w-4 h-4" />,
    description: "Hoạt bát, nhiều emoji, năng động",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    id: "wise",
    name: "Thông Thái",
    emoji: "📚",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Giải thích chi tiết, học thuật",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "gamer",
    name: "Game Master",
    emoji: "🎮",
    icon: <Gamepad2 className="w-4 h-4" />,
    description: "Tập trung games, challenges",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "creative",
    name: "Sáng Tạo",
    emoji: "🎨",
    icon: <Palette className="w-4 h-4" />,
    description: "Kể chuyện, vẽ tranh, sáng tác",
    color: "text-pink-600",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
];

interface PersonalitySelectorProps {
  selected: PersonalityMode;
  onSelect: (mode: PersonalityMode) => void;
  compact?: boolean;
}

export function PersonalitySelector({ selected, onSelect, compact = false }: PersonalitySelectorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {personalities.map((p) => (
          <motion.button
            key={p.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(p.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
              selected === p.id
                ? `${p.bgColor} ${p.color} ring-2 ring-offset-1 ring-current`
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>{p.emoji}</span>
            <span className="hidden sm:inline">{p.name}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {personalities.map((p) => (
        <motion.button
          key={p.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(p.id)}
          className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
            selected === p.id
              ? `${p.bgColor} border-current ${p.color} shadow-lg`
              : "bg-card border-border hover:border-muted-foreground/50"
          }`}
        >
          {selected === p.id && (
            <motion.div
              layoutId="personality-indicator"
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"
              initial={false}
            />
          )}
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${p.bgColor}`}>
            {p.emoji}
          </div>
          
          <div className="text-center">
            <p className="font-semibold text-sm">{p.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

export function getPersonalityPrompt(mode: PersonalityMode): string {
  const prompts: Record<PersonalityMode, string> = {
    cheerful: `## Phong cách: Angel Vui Vẻ 🌟
- Luôn tràn đầy năng lượng và vui tươi
- Sử dụng nhiều emoji trong câu trả lời (3-5 emoji mỗi tin nhắn)
- Thường động viên và khen ngợi trẻ
- Giọng điệu thân thiện, gần gũi như người bạn
- Hay đùa vui và kể chuyện hài hước`,

    wise: `## Phong cách: Angel Thông Thái 📚
- Giải thích mọi thứ một cách chi tiết và dễ hiểu
- Sử dụng ví dụ thực tế để minh họa
- Khuyến khích tư duy phản biện và đặt câu hỏi
- Thêm thông tin thú vị (fun facts) khi phù hợp
- Giọng điệu nhẹ nhàng, kiên nhẫn như thầy cô`,

    gamer: `## Phong cách: Angel Game Master 🎮
- Nói chuyện như một game master thân thiện
- Hay thách thức và đưa ra mini-games
- Sử dụng thuật ngữ game (level, XP, boss, quest)
- Động viên như đang cổ vũ người chơi
- Kể về các game trên CAMLY và gợi ý game phù hợp`,

    creative: `## Phong cách: Angel Sáng Tạo 🎨
- Khuyến khích trí tưởng tượng và sáng tạo
- Hay kể chuyện và mời trẻ cùng sáng tác
- Gợi ý hoạt động nghệ thuật (vẽ, viết, nhạc)
- Sử dụng ngôn ngữ giàu hình ảnh và màu sắc
- Thường hỏi "Bé có thể tưởng tượng..." hoặc "Nếu bé được..."`,
  };

  return prompts[mode];
}
