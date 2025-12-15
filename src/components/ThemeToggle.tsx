import { useState, useEffect } from "react";
import { Moon, Sun, Sparkles, Stars } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// 🌙☀️ FUN PLANET CUTE THEME TOGGLE - Kids Gaming 2025
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem("fun-planet-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("fun-planet-theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("fun-planet-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      enableEffects={false}
      className="relative h-11 w-11 rounded-full border-2 border-primary/40 bg-gradient-to-br from-card via-card to-muted hover:border-primary/60 transition-all duration-300 overflow-visible shadow-[0_4px_20px_hsla(280,65%,65%,0.2)] hover:shadow-[0_6px_30px_hsla(280,65%,65%,0.35)] hover:scale-105"
    >
      <AnimatePresence mode="wait">
        {theme === "light" ? (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <Sun className="h-5 w-5 text-[hsl(45,90%,55%)] drop-shadow-[0_0_8px_hsla(45,90%,55%,0.6)]" />
            {/* Sun rays animation */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-[hsl(45,90%,60%)] rounded-full"
                  style={{
                    transform: `rotate(${i * 45}deg) translateY(-12px)`,
                  }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <Moon className="h-5 w-5 text-[hsl(200,70%,70%)] drop-shadow-[0_0_8px_hsla(200,70%,70%,0.6)]" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ✨ Sparkle effects */}
      <AnimatePresence>
        {theme === "dark" && (
          <>
            <motion.div
              className="absolute -top-1.5 -right-1.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Sparkles className="h-3 w-3 text-[hsl(45,90%,70%)] drop-shadow-[0_0_4px_hsla(45,90%,70%,0.8)]" />
            </motion.div>
            <motion.div
              className="absolute -bottom-1.5 -left-1.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Stars className="h-2.5 w-2.5 text-[hsl(280,65%,75%)] drop-shadow-[0_0_4px_hsla(280,65%,75%,0.8)]" />
            </motion.div>
            <motion.div
              className="absolute top-0 -left-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="h-2 w-2 text-[hsl(340,70%,75%)] drop-shadow-[0_0_4px_hsla(340,70%,75%,0.8)]" />
            </motion.div>
          </>
        )}
        
        {/* 🌟 Toggle animation burst */}
        {isAnimating && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`burst-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[hsl(45,90%,70%)] to-[hsl(340,70%,75%)]"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 20,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 20,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </Button>
  );
}
