import { Home, Gamepad2, User, Gift, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { useNavigationSound } from "@/hooks/useNavigationSound";

// 🎀 FUN PLANET PASTEL CUTE BOTTOM NAV - Phase 6: Icon-First Design
export const MobileBottomNavEnhanced = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { shouldReduceAnimations } = usePerformanceMode();
  const { playTapSound, triggerHaptic } = useNavigationSound();

  // Hide bottom nav on game play pages for immersive experience
  const hideOnPaths = ['/game/'];
  const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  // Fixed 4 tabs only: Home, Games, Rewards, Profile
  const navItems = [
    { 
      icon: Home, 
      label: t('nav.home'), 
      path: "/", 
      gradientFrom: "from-pink-400",
      gradientVia: "via-purple-400",
      gradientTo: "to-blue-400"
    },
    { 
      icon: Gamepad2, 
      label: t('nav.games'), 
      path: "/games", 
      gradientFrom: "from-purple-400",
      gradientVia: "via-blue-400",
      gradientTo: "to-cyan-400"
    },
    { 
      icon: Gift, 
      label: t('nav.rewardGalaxy'), 
      path: "/reward-galaxy", 
      gradientFrom: "from-yellow-400",
      gradientVia: "via-orange-400",
      gradientTo: "to-pink-400"
    },
    { 
      icon: User, 
      label: t('nav.profile'), 
      path: user ? "/profile" : "/auth", 
      gradientFrom: "from-blue-400",
      gradientVia: "via-cyan-400",
      gradientTo: "to-green-400"
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/profile") return location.pathname === "/profile" || location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleTap = () => {
    triggerHaptic();
    playTapSound();
  };

  return (
    <motion.nav 
      initial={shouldReduceAnimations ? false : { y: 100 }}
      animate={{ y: 0 }}
      transition={shouldReduceAnimations ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#E2C0F0]/98 via-white/95 to-[#B0C8F0]/90 backdrop-blur-xl border-t-2 border-purple-300/60 shadow-[0_-8px_40px_rgba(243,196,251,0.45),0_-2px_16px_rgba(144,112,224,0.30)]"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
      }}
    >
      {/* ✨ Rainbow shimmer top border - brighter holographic */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 via-purple-500 via-blue-400 to-cyan-400 opacity-90" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-pulse" />
      
      {/* 4-column grid with 88px height */}
      <div className="grid grid-cols-4 h-[88px] max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleTap}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 touch-manipulation active:scale-90 min-h-[88px] relative group"
              )}
            >
              {/* 🌈 Rainbow gradient indicator when active */}
              {active && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-gradient-to-r",
                    item.gradientFrom, item.gradientVia, item.gradientTo
                  )}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* 💎 Icon container - enhanced holographic glow matching MiniLeaderboard */}
              <motion.div 
                className={cn(
                  "relative p-3 rounded-2xl transition-all duration-300 border",
                  active 
                    ? "bg-gradient-to-br from-pink-100/80 to-blue-100/60 border-purple-300/60 shadow-[0_0_30px_rgba(243,196,251,0.6),0_0_15px_rgba(162,210,255,0.4)]"
                    : "border-transparent"
                )}
                whileTap={shouldReduceAnimations ? undefined : { scale: 0.8 }}
              >
              <Icon 
                  className={cn(
                    "w-7 h-7 transition-all duration-300",
                    active 
                      ? "text-purple-600 scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" 
                      : "text-gray-500 group-hover:text-gray-600"
                  )} 
                  strokeWidth={active ? 2.5 : 2} 
                />
                
                {/* ✨ Sparkle on active */}
                {active && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
                  </motion.div>
                )}
              </motion.div>
              
              {/* 📝 Label - responsive text size for multilingual support */}
              <span className={cn(
                "text-[9px] xs:text-[10px] sm:text-xs font-bold transition-all duration-300 truncate max-w-full leading-tight",
                active ? "text-purple-600 drop-shadow-[0_1px_2px_rgba(168,85,247,0.3)]" : "text-gray-500"
              )}>
                {item.label}
              </span>
              
              {/* 🎯 Notification dot for profile */}
              {item.path === (user ? "/profile" : "/auth") && user && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};
