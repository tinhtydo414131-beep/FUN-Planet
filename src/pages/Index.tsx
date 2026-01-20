import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FeaturedGamesSection } from "@/components/FeaturedGamesSection";

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


const Index = () => {
  const { t } = useTranslation();
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
      title: t('home.funGames'),
      description: `${t('home.funGamesDesc')} 🎮`,
      color: "from-primary to-purple-500",
      image: featureGames
    },
    {
      icon: <Shield className="w-10 h-10 text-accent" />,
      title: t('home.safeSecure'),
      description: `${t('home.safeSecureDesc')} 🛡️`,
      color: "from-accent to-green-500",
      image: featureSafe
    },
    {
      icon: <Gift className="w-10 h-10 text-secondary" />,
      title: t('home.earnRewards'),
      description: `${t('home.earnRewardsDesc')} 🎁`,
      color: "from-secondary to-orange-500",
      image: featureRewards
    },
    {
      icon: <Users className="w-10 h-10 text-primary" />,
      title: t('home.makeFriends'),
      description: `${t('home.makeFriendsDesc')} 👥`,
      color: "from-primary to-pink-500",
      image: featureFriends
    },
    {
      icon: <Trophy className="w-10 h-10 text-accent" />,
      title: t('home.competeWin'),
      description: `${t('home.competeWinDesc')} 🏆`,
      color: "from-accent to-blue-500",
      image: featureCompete
    },
    {
      icon: <Sparkles className="w-10 h-10 text-secondary" />,
      title: t('home.learnPlaying'),
      description: `${t('home.learnPlayingDesc')} ✨`,
      color: "from-secondary to-purple-500",
      image: featureLearning
    }
  ];

  const categories = [
    { name: `${t('home.adventure')} 🗺️`, count: 15, color: "bg-gradient-to-br from-primary to-purple-500", image: categoryAdventure },
    { name: `${t('home.puzzle')} 🧩`, count: 12, color: "bg-gradient-to-br from-accent to-green-500", image: categoryPuzzle },
    { name: `${t('home.casual')} 🎯`, count: 20, color: "bg-gradient-to-br from-secondary to-orange-500", image: categoryCasual },
    { name: `${t('home.educational')} 📚`, count: 8, color: "bg-gradient-to-br from-primary to-pink-500", image: categoryEducational },
  ];

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <motion.div 
      className="min-h-screen holographic-page-bg relative overflow-hidden pb-20 md:pb-0"
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
        {/* FunIDOnboarding auto-display disabled per memory/ux/onboarding-auto-display-policy
        {showFunIdOnboarding && !user && (
          <FunIDOnboarding 
            onComplete={handleFunIdComplete}
            onSkip={handleFunIdComplete}
          />
        )}
        */}
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
      
      
      {/* Featured Games - Play Instantly */}
      <FeaturedGamesSection />
      
      

      {/* Full Games Gallery */}
      <section id="games-gallery" className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-quicksand font-bold text-primary mb-4">
              {t('home.gameCategories')} 🎨
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('home.pickFavorite')}
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
                className="relative overflow-hidden rounded-3xl glass-card holo-border holo-border-animated shadow-xl hover:shadow-2xl hover:holo-glow transform hover:scale-105 transition-all group"
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
                      <span className="text-sm drop-shadow-lg">{t('home.playNowArrow')}</span>
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
              {t('home.browseAll')}
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
            <h2 className="text-4xl md:text-5xl font-quicksand font-bold text-primary mb-4">
              {t('home.whyKidsLove')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.bestExperience')}
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
                <Card className="overflow-hidden glass-card holo-border hover:holo-glow transition-all hover:shadow-xl group h-full">
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
          <h2 className="text-3xl font-quicksand font-bold text-center mb-8 text-primary">
            {t('home.quickAccess')}
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { path: "/games", icon: "🎮", label: t('home.gamesLabel') },
              { path: "/upload-game", icon: "📤", label: t('home.uploadLabel') },
              { path: "/reward-galaxy", icon: "🎁", label: t('home.rewardsLabel') },
              { path: "/nft-gallery", icon: "💎", label: t('home.nftsLabel') },
              { path: "/chat", icon: "💬", label: t('home.chatLabel') },
              { path: "/parent-dashboard", icon: "👨‍👩‍👧", label: t('home.parentsLabel') },
              { path: "/leaderboard", icon: "🏆", label: t('home.leadersLabel') },
              { path: "/achievement-leaderboard", icon: "🏅", label: t('home.achievementsLabel') },
              { path: "/find-friends", icon: "👥", label: t('home.friendsLabel') },
              { path: user ? "/profile" : "/auth", icon: "👤", label: user ? t('home.profileLabel') : t('home.loginLabel') },
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
          <Card className="p-8 md:p-12 glass-card-strong holo-border holo-border-animated holo-glow shadow-2xl text-center bg-gradient-to-r from-[#F3C4FB]/10 via-[#CDB4DB]/10 to-[#A2D2FF]/10">
            <h2 className="text-3xl md:text-4xl font-quicksand font-bold text-primary mb-4">
              {t('home.readyToPlay')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('home.joinThousands')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/games")}
                size="lg"
                className="text-xl px-10 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-xl"
              >
                {t('home.playNow')}
              </Button>
              <Button
                onClick={() => navigate("/upload-game")}
                size="lg"
                variant="outline"
                className="text-xl px-10 py-6 border-2 border-primary hover:bg-primary/10"
              >
                {t('home.uploadGame')}
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
              <p className="text-muted-foreground">{t('home.footerSlogan')}</p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">{t('nav.games')}</h4>
              <div className="space-y-2">
                <p onClick={() => navigate("/games")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">{t('home.browseGames')}</p>
                <p onClick={() => navigate("/upload-game")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">{t('home.uploadGame')}</p>
                <p onClick={() => navigate("/leaderboard")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">{t('nav.leaderboard')}</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">{t('home.features')}</h4>
              <div className="space-y-2">
                <p onClick={() => navigate("/reward-galaxy")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">{t('home.rewardsLabel')}</p>
                <p onClick={() => navigate("/nft-gallery")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">{t('home.nftGallery')}</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">{t('home.about')}</h4>
              <div className="space-y-2">
                <p onClick={() => navigate("/about")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">{t('home.aboutUs')}</p>
                <p onClick={() => navigate("/parent-dashboard")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">{t('home.forParents')}</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-primary/20 text-center">
            <p className="text-muted-foreground">
              {t('home.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default Index;
