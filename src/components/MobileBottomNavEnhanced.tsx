import { Home, Gamepad2, Upload, User, Gift, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { useTouchFeedback } from "@/hooks/useTouchFeedback";

// 🎀 FUN PLANET PASTEL CUTE BOTTOM NAV - Kids Gaming 2025
export const MobileBottomNavEnhanced = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isDev } = useUserRole();
  const { t } = useTranslation();
  const { shouldReduceAnimations } = usePerformanceMode();
  const { triggerFeedback } = useTouchFeedback({ type: 'selection' });

  // Hide bottom nav on game play pages for immersive experience
  const hideOnPaths = ['/game/'];
  const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const baseNavItems = [
    { icon: Home, label: t('nav.home'), path: "/", emoji: "🏠", color: "from-[#F3C4FB] to-[#CDB4DB]" },
    { icon: Gamepad2, label: t('nav.games'), path: "/games", emoji: "🎮", color: "from-[#CDB4DB] to-[#A2D2FF]" },
    { icon: Gift, label: t('nav.rewardGalaxy'), path: "/reward-galaxy", emoji: "🎁", color: "from-[#FFD93D] to-[#FF8C42]" },
  ];

  // Add upload tab for developers, wallet for others
  const navItems = isDev 
    ? [
        ...baseNavItems.slice(0, 2),
        { icon: Upload, label: t('nav.upload'), path: "/upload-game", emoji: "📤", color: "from-[#8FD9A8] to-[#6ECFCF]" },
        ...baseNavItems.slice(2),
        { icon: User, label: t('nav.profile'), path: user ? "/profile" : "/auth", emoji: "👤", color: "from-[#A2D2FF] to-[#8FD9A8]" },
      ]
    : [
        ...baseNavItems,
        { icon: User, label: t('nav.profile'), path: user ? "/profile" : "/auth", emoji: "👤", color: "from-[#A2D2FF] to-[#8FD9A8]" },
      ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/profile") return location.pathname === "/profile" || location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav 
      initial={shouldReduceAnimations ? false : { y: 100 }}
      animate={{ y: 0 }}
      transition={shouldReduceAnimations ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-holographic shadow-[0_-8px_40px_hsla(280,65%,65%,0.2),0_-2px_16px_hsla(340,70%,75%,0.15)]"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      {/* ✨ Rainbow sparkle border at top */}
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'var(--gradient-holographic-border)', backgroundSize: '300% 100%', animation: 'holo-shift 5s linear infinite' }} />
      
      <div className={cn(
        "grid h-[76px] max-w-lg mx-auto",
        isDev ? "grid-cols-5" : "grid-cols-4"
      )}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => triggerFeedback('selection')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 touch-manipulation active:scale-90 min-h-[76px] relative group touch-ripple touch-button no-context-menu",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* 🌈 Active rainbow indicator */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{
                    background: 'linear-gradient(90deg, #F3C4FB, #CDB4DB, #A2D2FF)',
                    boxShadow: "0 0 12px rgba(243, 196, 251, 0.6), 0 0 8px rgba(162, 210, 255, 0.4)"
                  }}
                />
              )}
              
              {/* 💎 Icon container with diamond effect */}
              <motion.div 
                className={cn(
                  "relative p-2.5 rounded-2xl transition-all duration-300",
                  active && "bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10 shadow-[0_0_20px_hsla(280,65%,65%,0.3)]"
                )}
                whileTap={shouldReduceAnimations ? undefined : { scale: 0.85 }}
                whileHover={shouldReduceAnimations ? undefined : { scale: 1.1 }}
              >
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-all duration-300",
                    active && "scale-110 drop-shadow-[0_0_8px_hsla(280,65%,65%,0.6)]"
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
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </motion.div>
                )}
              </motion.div>
              
              {/* 📝 Label */}
              <span className={cn(
                "text-[10px] font-quicksand font-bold uppercase tracking-widest transition-all duration-300",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              
              {/* 🎯 Badge for notifications (example) */}
              {item.path === (user ? "/profile" : "/auth") && user && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-[#F3C4FB] to-[#FF6B6B] rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};
