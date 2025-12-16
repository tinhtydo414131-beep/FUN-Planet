import { Home, Gamepad2, MessageCircle, User, Gift, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useState } from "react";

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [hoveredGift, setHoveredGift] = useState(false);
  
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Gamepad2, label: "Games", path: "/games" },
    { icon: Gift, label: "Rewards", path: "/reward-galaxy", isSpecial: true },
    { icon: MessageCircle, label: "Chat", path: user ? "/messages" : "/auth" },
    { icon: User, label: "Profile", path: user ? "/dashboard" : "/auth" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom">
      <div className="grid grid-cols-5 h-[72px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isGift = item.isSpecial;
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200 touch-manipulation active:scale-95 min-h-[72px] relative",
                active 
                  ? isGift ? "text-yellow-500" : "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onMouseEnter={() => isGift && setHoveredGift(true)}
              onMouseLeave={() => isGift && setHoveredGift(false)}
            >
              <div className={cn(
                "relative p-2.5 rounded-xl transition-all duration-200",
                active && !isGift && "bg-primary/15",
                isGift && "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
              )}>
                {isGift ? (
                  <motion.div
                    animate={{
                      rotate: hoveredGift || active ? [0, -10, 10, -10, 0] : 0,
                      scale: hoveredGift || active ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={cn(
                      "w-6 h-6 transition-all duration-200",
                      active ? "text-yellow-500" : "text-orange-400"
                    )} strokeWidth={active ? 2.5 : 2} />
                    {/* Sparkle effects for gift */}
                    {(hoveredGift || active) && (
                      <>
                        <motion.div
                          className="absolute -top-1 -right-1"
                          animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Sparkles className="w-3 h-3 text-yellow-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -bottom-1 -left-1"
                          animate={{
                            scale: [1, 0.8, 1],
                            opacity: [1, 0.5, 1],
                          }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                        >
                          <Sparkles className="w-2 h-2 text-orange-400" />
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <Icon className={cn(
                    "w-6 h-6 transition-all duration-200",
                    active && "scale-110"
                  )} strokeWidth={active ? 2.5 : 2} />
                )}
                {active && !isGift && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
                )}
                {active && isGift && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
                )}
              </div>
              <span className={cn(
                "text-xs font-jakarta font-medium transition-all duration-200",
                active && !isGift && "text-primary font-bold",
                active && isGift && "text-yellow-500 font-bold",
                !active && "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
