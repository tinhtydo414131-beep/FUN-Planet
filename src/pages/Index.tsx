import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FeaturedGamesSection } from "@/components/FeaturedGamesSection";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gamepad2, Trophy, Users, Sparkles, Shield, Gift, Upload, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import categoryAdventure from "@/assets/category-adventure.png";
import categoryPuzzle from "@/assets/category-puzzle.png";
import categoryCasual from "@/assets/category-casual.png";
import categoryEducational from "@/assets/category-educational.png";
import featureGames from "@/assets/feature-games.png";
import featureSafe from "@/assets/feature-safe.png";
import featureRewards from "@/assets/feature-rewards.png";
import featureFriends from "@/assets/feature-friends.png";
import featureCompete from "@/assets/feature-compete.png";
import featureLearning from "@/assets/feature-learning.png";

import { useReferral } from "@/hooks/useReferral";
import ReferralWelcomeBanner from "@/components/ReferralWelcomeBanner";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useLegendStatus } from "@/hooks/useLegendStatus";
import LegendParticleEffect from "@/components/LegendParticleEffect";
import { OnboardingTour } from "@/components/OnboardingTour";
import { OnboardingRoleSelector } from "@/components/OnboardingRoleSelector";
import { useOnboarding } from "@/hooks/useOnboarding";
import { AngelAI, AngelAIButton } from "@/components/AngelAI";
import { FunIDOnboarding } from "@/components/FunIDOnboarding";
import { useFunId } from "@/hooks/useFunId";
import { RewardGalaxyHomeBanner } from "@/components/RewardGalaxyHomeBanner";

import { TodayRewardsCard } from "@/components/TodayRewardsCard";
import { FunPlanetStatsSection } from "@/components/FunPlanetStatsSection";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pendingReferrer, showWelcomeBanner, dismissWelcomeBanner } = useReferral();
  const { connectWallet } = useWeb3Rewards();
  const { isLegend } = useLegendStatus();
  const { 
    showOnboarding, 
    onboardingRole, 
    startOnboarding, 
    completeOnboarding, 
    skipOnboarding,
    hasCompletedOnboarding 
  } = useOnboarding();
  
  const { funId, isNewUser, shouldShowAngel, dismissAngel, showAngel } = useFunId();
  const [showFunIdOnboarding, setShowFunIdOnboarding] = useState(false);
  const [showAngelChat, setShowAngelChat] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const hasSeenFunId = localStorage.getItem('fun_planet_fun_id_intro');
      if (!hasSeenFunId) {
        setShowFunIdOnboarding(true);
      }
    }
    
    if (!loading && user && !hasCompletedOnboarding()) {
      setShowRoleSelector(true);
    }
    
    if (user && funId && shouldShowAngel) {
      setShowAngelChat(true);
    }
  }, [user, loading, funId, shouldShowAngel]);

  const handleSelectRole = (role: "kid" | "parent" | "developer") => {
    setShowRoleSelector(false);
    startOnboarding(role);
  };

  const handleSkipOnboarding = () => {
    setShowRoleSelector(false);
    skipOnboarding();
  };

  const handleFunIdComplete = () => {
    setShowFunIdOnboarding(false);
    localStorage.setItem('fun_planet_fun_id_intro', 'true');
  };

  const handleAngelClose = () => {
    setShowAngelChat(false);
    dismissAngel();
  };

  const handleConnectWalletFromBanner = async () => {
    dismissWelcomeBanner();
    if (!user) {
      navigate('/auth');
    } else {
      await connectWallet();
    }
  };

  const features = [
    {
      icon: <Gamepad2 className="w-10 h-10 text-primary" />,
      title: "100+ Fun Games",
      description: "Play amazing games made for kids! From puzzles to adventures! 🎮",
      color: "from-primary to-purple-500",
      image: featureGames
    },
    {
      icon: <Shield className="w-10 h-10 text-accent" />,
      title: "Safe & Secure",
      description: "Kid-friendly content, no ads, and parent-approved safety! 🛡️",
      color: "from-accent to-green-500",
      image: featureSafe
    },
    {
      icon: <Gift className="w-10 h-10 text-secondary" />,
      title: "Earn Rewards",
      description: "Play games and earn crypto tokens you can collect! 🎁",
      color: "from-secondary to-orange-500",
      image: featureRewards
    },
    {
      icon: <Users className="w-10 h-10 text-primary" />,
      title: "Make Friends",
      description: "Chat with other kids and make new gaming buddies! 👥",
      color: "from-primary to-pink-500",
      image: featureFriends
    },
    {
      icon: <Trophy className="w-10 h-10 text-accent" />,
      title: "Compete & Win",
      description: "Join the leaderboard and become the top player! 🏆",
      color: "from-accent to-blue-500",
      image: featureCompete
    },
    {
      icon: <Sparkles className="w-10 h-10 text-secondary" />,
      title: "Learn While Playing",
      description: "Educational games that make learning super fun! ✨",
      color: "from-secondary to-purple-500",
      image: featureLearning
    }
  ];

  const categories = [
    { name: "Adventure 🗺️", count: 15, color: "bg-gradient-to-br from-primary to-purple-500", image: categoryAdventure },
    { name: "Puzzle 🧩", count: 12, color: "bg-gradient-to-br from-accent to-green-500", image: categoryPuzzle },
    { name: "Casual 🎯", count: 20, color: "bg-gradient-to-br from-secondary to-orange-500", image: categoryCasual },
    { name: "Educational 📚", count: 8, color: "bg-gradient-to-br from-primary to-pink-500", image: categoryEducational },
  ];

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <motion.div 
      className="min-h-screen bg-background relative overflow-hidden pb-20 md:pb-0"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
    >
      {/* Onboarding overlays */}
      <AnimatePresence>
        {showRoleSelector && (
          <OnboardingRoleSelector 
            onSelectRole={handleSelectRole} 
            onSkip={handleSkipOnboarding} 
          />
        )}
        {showOnboarding && onboardingRole && (
          <OnboardingTour 
            role={onboardingRole} 
            onComplete={completeOnboarding} 
            onSkip={skipOnboarding} 
          />
        )}
        {showFunIdOnboarding && !user && (
          <FunIDOnboarding 
            onComplete={handleFunIdComplete}
            onSkip={handleFunIdComplete}
          />
        )}
        {showAngelChat && user && funId && (
          <AngelAI 
            isNewUser={isNewUser}
            onClose={handleAngelClose}
          />
        )}
      </AnimatePresence>

      {/* Angel AI Button */}
      {user && funId && !showAngelChat && (
        <AngelAIButton onClick={() => setShowAngelChat(true)} />
      )}

      {/* Legend Particle Effect */}
      <LegendParticleEffect isLegend={isLegend} />
      
      {/* Referral Welcome Banner */}
      {pendingReferrer && (
        <ReferralWelcomeBanner
          referrerUsername={pendingReferrer.username}
          isVisible={showWelcomeBanner}
          onDismiss={dismissWelcomeBanner}
          onConnectWallet={handleConnectWalletFromBanner}
        />
      )}
      
      <Navigation />
      
      {/* Hero Section */}
      <Hero />
      
      {/* FUN Planet Stats - Honor Board & Top Ranking */}
      <FunPlanetStatsSection />
      
      {/* Reward Galaxy Home Banner */}
      <RewardGalaxyHomeBanner />
      
      {/* Featured Games - Play Instantly */}
      <FeaturedGamesSection />
      
      {/* Today's Rewards Card */}
      <TodayRewardsCard />
      

      {/* Full Games Gallery */}
      <section id="games-gallery" className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Game Categories 🎨
            </h2>
            <p className="text-xl text-muted-foreground">
              Pick your favorite type of game!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.button
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate("/games")}
                className="relative overflow-hidden rounded-3xl border-4 border-primary/30 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all group"
              >
                <div className="relative aspect-[4/3]">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 ${category.color} opacity-40 group-hover:opacity-30 transition-opacity`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                    <p className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">{category.count}</p>
                    <p className="text-lg md:text-xl font-bold drop-shadow-lg">{category.name}</p>
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm drop-shadow-lg">Play now →</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button
              onClick={() => navigate("/games")}
              size="lg"
              className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-xl"
            >
              Browse All Games 🎮
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Why Kids Love Us! 💖
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for the best gaming experience!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-all hover:shadow-xl group h-full">
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-20 group-hover:opacity-10 transition-opacity`} />
                  </div>
                  <div className="p-6">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-12 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-primary">
            Quick Access 🚀
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { path: "/games", icon: "🎮", label: "Games" },
              { path: "/upload-game", icon: "📤", label: "Upload" },
              { path: "/global-airdrop", icon: "🎁", label: "Airdrop" },
              { path: "/planet-explorer", icon: "🌍", label: "3D Build" },
              { path: "/nft-gallery", icon: "💎", label: "NFTs" },
              { path: "/chat", icon: "💬", label: "Chat" },
              { path: "/parent-dashboard", icon: "👨‍👩‍👧", label: "Parents" },
              { path: "/wallet", icon: "💰", label: "Wallet" },
              { path: "/leaderboard", icon: "🏆", label: "Leaders" },
              { path: "/find-friends", icon: "👥", label: "Friends" },
              { path: "/about", icon: "ℹ️", label: "About" },
              { path: user ? "/profile" : "/auth", icon: "👤", label: user ? "Profile" : "Login" },
            ].map((item) => (
              <Button
                key={item.path}
                variant="outline"
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 h-20 border-2 border-primary/20 hover:border-primary hover:bg-primary/10 transition-all hover:scale-105"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-bold">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-8 md:p-12 border-4 border-primary/40 shadow-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Ready to Start Playing? 🚀
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of kids having fun, making friends, and earning rewards!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/games")}
                size="lg"
                className="text-xl px-10 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-xl"
              >
                Play Now! 🎮
              </Button>
              <Button
                onClick={() => navigate("/upload-game")}
                size="lg"
                variant="outline"
                className="text-xl px-10 py-6 border-2 border-primary hover:bg-primary/10"
              >
                Upload Game 📤
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/10 to-secondary/10 border-t-2 border-primary/30 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">FUN Planet 🌍</h3>
              <p className="text-muted-foreground">Build Your Planet – Play & Earn Joy!</p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Games</h4>
              <div className="space-y-2">
                <p onClick={() => navigate("/games")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Browse Games</p>
                <p onClick={() => navigate("/upload-game")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Upload Game</p>
                <p onClick={() => navigate("/leaderboard")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Leaderboard</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Features</h4>
              <div className="space-y-2">
                <p onClick={() => navigate("/global-airdrop")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Claim Airdrop</p>
                <p onClick={() => navigate("/nft-gallery")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">NFT Gallery</p>
                <p onClick={() => navigate("/planet-explorer")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">3D Builder</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">About</h4>
              <div className="space-y-2">
                <p onClick={() => navigate("/about")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">About Us</p>
                <p onClick={() => navigate("/parent-dashboard")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">For Parents</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-primary/20 text-center">
            <p className="text-muted-foreground">
              © 2024 FUN Planet Web3. Made with 💖 for kids everywhere!
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Action Bar */}
      <MobileActionBar />
    </motion.div>
  );
};

export default Index;
