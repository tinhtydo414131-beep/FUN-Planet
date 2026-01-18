import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FeaturedGamesSection } from "@/components/FeaturedGamesSection";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryIslands } from "@/components/CategoryIslands";

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
    // DISABLED: Auto-popup overlays to improve initial page load experience
    // FunIDOnboarding and OnboardingRoleSelector now accessible manually
    // See memory: ux/onboarding-auto-display-policy
    
    // if (!loading && !user) {
    //   const hasSeenFunId = localStorage.getItem('fun_planet_fun_id_intro');
    //   if (!hasSeenFunId) {
    //     setShowFunIdOnboarding(true);
    //   }
    // }
    
    // if (!loading && user && !hasCompletedOnboarding()) {
    //   setShowRoleSelector(true);
    // }
    
    // Angel AI chat - keep accessible via button
    // if (user && funId && shouldShowAngel) {
    //   setShowAngelChat(true);
    // }
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

      {/* Angel AI Button - Always visible for ALL users including guests */}
      {!showAngelChat && (
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
      
      {/* Category Islands - Moved up after Hero */}
      <CategoryIslands />
      
      {/* Featured Games - Play Instantly */}
      <FeaturedGamesSection />

      {/* Simplified Footer */}
      <footer className="bg-gradient-to-r from-primary/5 to-secondary/5 border-t border-primary/20 py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            {/* Logo + Slogan */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-2xl font-bold text-primary">FUN Planet 🌍</span>
              <span className="text-muted-foreground text-sm hidden sm:inline">{t('home.footerSlogan')}</span>
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span onClick={() => navigate("/games")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                {t('nav.games')}
              </span>
              <span onClick={() => navigate("/about")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                {t('home.about')}
              </span>
              <span onClick={() => navigate("/parent-dashboard")} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                {t('home.forParents')}
              </span>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-6 pt-4 border-t border-primary/10 text-center">
            <p className="text-sm text-muted-foreground">{t('home.copyright')}</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default Index;
