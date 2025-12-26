import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Plus, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDraggable } from "@/hooks/useDraggable";
import { cn } from "@/lib/utils";

export const UploadGameFAB = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const { 
    isDragging, 
    handleMouseDown,
    handleLongPressStart,
    handleLongPressEnd,
    handleLongPressMove,
    style 
  } = useDraggable({
    storageKey: "upload_fab_position",
    defaultPosition: { x: 0, y: 0 },
  });

  const handleClick = () => {
    if (!isDragging) {
      navigate("/upload-game");
    }
  };

  return (
    <div 
      className="fixed bottom-20 md:bottom-6 right-4 z-50 select-none"
      style={style}
    >
      <div className="relative group">
        {/* Drag handle - always visible */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className={cn(
            "absolute -top-3 -left-3 w-8 h-8 rounded-full bg-orange-600/90 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing shadow-lg",
            "transition-all duration-200",
            isDragging ? "scale-110 bg-orange-500" : "opacity-70 hover:opacity-100 hover:scale-110"
          )}
          title="Kéo để di chuyển"
        >
          <GripVertical className="w-4 h-4 text-white" />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={handleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => { setIsHovered(false); handleLongPressEnd(); }}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onTouchMove={handleLongPressMove}
              className={cn(
                "relative w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 shadow-lg shadow-orange-500/50 flex items-center justify-center overflow-hidden group",
                isDragging && "ring-4 ring-orange-400/50"
              )}
              whileHover={{ scale: isDragging ? 1 : 1.1 }}
              whileTap={{ scale: isDragging ? 1 : 0.95 }}
              animate={{
                rotate: isHovered && !isDragging ? 0 : [0, -5, 5, -5, 5, 0],
                boxShadow: isDragging
                  ? "0 0 40px rgba(251, 146, 60, 0.8)"
                  : "0 8px 20px rgba(251, 146, 60, 0.5)",
              }}
              transition={{
                rotate: {
                  duration: 0.5,
                  repeat: isHovered ? 0 : Infinity,
                  repeatDelay: 3,
                },
              }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-orange-300 to-yellow-200 opacity-0 group-hover:opacity-50 transition-opacity"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              
              {/* Sparkle particles */}
              <AnimatePresence>
                {isHovered && !isDragging && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full"
                        initial={{ 
                          x: 0, 
                          y: 0, 
                          opacity: 1,
                          scale: 0 
                        }}
                        animate={{ 
                          x: (Math.random() - 0.5) * 60,
                          y: (Math.random() - 0.5) * 60,
                          opacity: 0,
                          scale: 1
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* Icon */}
              <div className="relative flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-white drop-shadow-md" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Plus className="w-4 h-4 text-white font-bold" strokeWidth={3} />
                </motion.div>
              </div>

              {/* Ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/50"
                animate={{
                  scale: [1, 1.3],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent 
            side="left" 
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-none font-bold px-4 py-2 max-w-[200px] text-center"
          >
            <p className="text-sm">🎮 Create a new game</p>
            <p className="text-xs mt-1">Get 500K CAMLY! 💰</p>
          </TooltipContent>
        </Tooltip>

        {/* Drag instruction tooltip */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-orange-500 text-white rounded-lg px-3 py-1.5 shadow-xl text-xs font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              Đang kéo...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
