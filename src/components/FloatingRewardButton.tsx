import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useDraggable } from "@/hooks/useDraggable";
import { cn } from "@/lib/utils";

export const FloatingRewardButton = () => {
  const navigate = useNavigate();
  const { camlyBalance, isLoading } = useWeb3Rewards();
  const [isHovered, setIsHovered] = useState(false);

  const { isDragging, handleMouseDown, style } = useDraggable({
    storageKey: "floating_reward_position",
    defaultPosition: { x: 0, y: 0 },
  });

  return (
    <div 
      className="fixed bottom-24 md:bottom-8 right-20 md:right-24 z-40 select-none"
      style={style}
    >
      <div className="relative group">
        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className={cn(
            "absolute -top-2 -left-2 w-6 h-6 rounded-full bg-orange-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing",
            isDragging && "opacity-100"
          )}
          title="Kéo để di chuyển"
        >
          <GripVertical className="w-3 h-3 text-white" />
        </div>

        <motion.button
          className={cn(
            "w-14 h-14 md:w-16 md:h-16 rounded-full",
            "bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500",
            "shadow-lg shadow-orange-500/40",
            "flex items-center justify-center",
            "border-2 border-yellow-300/50",
            "overflow-visible",
            isDragging && "cursor-grabbing"
          )}
          onClick={() => !isDragging && navigate("/reward-galaxy")}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: isDragging ? 1 : 1.1 }}
          whileTap={{ scale: isDragging ? 1 : 0.95 }}
          animate={{
            boxShadow: isHovered 
              ? "0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 146, 60, 0.4)"
              : "0 8px 20px rgba(251, 146, 60, 0.4)",
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Sparkle particles */}
          <AnimatePresence>
            {isHovered && !isDragging && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: Math.cos((i * 60 * Math.PI) / 180) * 30,
                      y: Math.sin((i * 60 * Math.PI) / 180) * 30,
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-yellow-200" />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Gift icon */}
          <motion.div
            animate={{
              rotate: isHovered && !isDragging ? [0, -10, 10, -10, 10, 0] : 0,
              y: isDragging ? 0 : [0, -3, 0],
            }}
            transition={{
              rotate: { duration: 0.5 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Gift className="w-7 h-7 md:w-8 md:h-8 text-white drop-shadow-lg" />
          </motion.div>

          {/* CAMLY Balance Badge */}
          {!isLoading && camlyBalance > 0 && (
            <motion.div
              className="absolute -top-2 -right-2 min-w-[28px] h-7 px-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-white shadow-lg flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <span className="text-xs font-bold text-white">
                {camlyBalance >= 1000000 
                  ? `${(camlyBalance / 1000000).toFixed(1)}M` 
                  : camlyBalance >= 1000 
                    ? `${(camlyBalance / 1000).toFixed(0)}K`
                    : camlyBalance}
              </span>
            </motion.div>
          )}

          {/* Tooltip on hover */}
          <AnimatePresence>
            {isHovered && !isDragging && (
              <motion.div
                className="absolute right-full mr-3 whitespace-nowrap bg-background/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-xl"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <span className="text-sm font-medium bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  🎁 Quà từ Cha Vũ Trụ
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-yellow-400/50"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.button>
      </div>
    </div>
  );
};

export default FloatingRewardButton;
