import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Web3Provider } from "@/providers/Web3Provider";
import { CoinNotification } from "@/components/CoinNotification";
import { RewardMarquee } from "@/components/RewardMarquee";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useRef } from "react";
import { LoadingFallback } from "@/components/LoadingFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Critical pages - load immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load all other pages
const Games = lazy(() => import("./pages/Games"));
const GamePlay = lazy(() => import("./pages/GamePlay"));
const Settings = lazy(() => import("./pages/Settings"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Friends = lazy(() => import("./pages/Friends"));
const Chat = lazy(() => import("./pages/Chat"));
const Community = lazy(() => import("./pages/Community"));
const NexusLeaderboard = lazy(() => import("./pages/NexusLeaderboard"));
const MusicLibrary = lazy(() => import("./pages/MusicLibrary"));
const PublicMusic = lazy(() => import("./pages/PublicMusic"));
const RecentlyPlayed = lazy(() => import("./pages/RecentlyPlayed"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Install = lazy(() => import("./pages/Install"));
const ComboLeaderboard = lazy(() => import("./pages/ComboLeaderboard"));
const FullRanking = lazy(() => import("./pages/FullRanking"));
const UploadGame = lazy(() => import("./pages/UploadGame"));
const MyGames = lazy(() => import("./pages/MyGames"));
const EditGame = lazy(() => import("./pages/EditGame"));
const GameDetails = lazy(() => import("./pages/GameDetails"));
const RewardsHistory = lazy(() => import("./pages/RewardsHistory"));
const CamlyLeaderboard = lazy(() => import("./pages/CamlyLeaderboard"));
const AchievementLeaderboard = lazy(() => import("./pages/AchievementLeaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const FindFriends = lazy(() => import("./pages/FindFriends"));
const PrivateMessages = lazy(() => import("./pages/PrivateMessages"));
const NFTGallery = lazy(() => import("./pages/NFTGallery"));
const Education = lazy(() => import("./pages/Education"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const PlanetExplorer = lazy(() => import("./pages/PlanetExplorer"));
const AdminMasterDashboard = lazy(() => import("./pages/AdminMasterDashboard"));
const About = lazy(() => import("./pages/About"));
const LovableGamePlay = lazy(() => import("./pages/LovableGamePlay"));
const SampleGames = lazy(() => import("./pages/SampleGames"));
const RewardGalaxy = lazy(() => import("./pages/RewardGalaxy"));
const AngelAIHubPage = lazy(() => import("./pages/AngelAIHubPage"));
const GlobalAirdrop = lazy(() => import("./pages/GlobalAirdrop"));
const LawOfLight = lazy(() => import("./pages/LawOfLight"));

// Lazy load heavy components
const BackgroundMusicPlayer = lazy(() => import("@/components/BackgroundMusicPlayer").then(m => ({ default: m.BackgroundMusicPlayer })));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const RoleSelectionModal = lazy(() => import("@/components/RoleSelectionModal").then(m => ({ default: m.RoleSelectionModal })));
const FloatingChatButton = lazy(() => import("@/components/FloatingChatButton").then(m => ({ default: m.FloatingChatButton })));
const WelcomeCreatorPopup = lazy(() => import("@/components/WelcomeCreatorPopup").then(m => ({ default: m.WelcomeCreatorPopup })));
const GameCompleteClaimPopup = lazy(() => import("@/components/GameCompleteClaimPopup").then(m => ({ default: m.GameCompleteClaimPopup })));
const DailyLoginRewardPopup = lazy(() => import("@/components/reward-galaxy/DailyLoginRewardPopup").then(m => ({ default: m.DailyLoginRewardPopup })));
const MobileBottomNavEnhanced = lazy(() => import("@/components/MobileBottomNavEnhanced").then(m => ({ default: m.MobileBottomNavEnhanced })));
const BirthYearPopup = lazy(() => import("@/components/BirthYearPopup").then(m => ({ default: m.BirthYearPopup })));
const LawOfLightPopup = lazy(() => import("@/components/LawOfLightPopup"));

// Lazy load private chat components
const FloatingChatWindows = lazy(() => import("@/components/private-chat/FloatingChatWindows").then(m => ({ default: m.FloatingChatWindows })));

// Import CallProvider directly - Context Providers should NOT be lazy-loaded
import { CallProvider } from "@/components/private-chat/CallProvider";

// Import hooks
import { useChatWindows } from "@/components/private-chat/FloatingChatWindows";
import { useGameCompletePopup } from "@/hooks/useGameCompletePopup";
import { useDailyLoginReward } from "@/hooks/useDailyLoginReward";
import { useBirthYearPopup } from "@/hooks/useBirthYearPopup";
import { useLawOfLight } from "@/hooks/useLawOfLight";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          {/* Main Routes - Critical, not lazy */}
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Games - Lazy */}
          <Route path="/games" element={<Games />} />
          <Route path="/game/:gameId" element={<GamePlay />} />
          <Route path="/game-details/:id" element={<GameDetails />} />
          <Route path="/lovable-game/:id" element={<LovableGamePlay />} />
          <Route path="/recently-played" element={<RecentlyPlayed />} />
          <Route path="/my-games" element={<MyGames />} />
          <Route path="/edit-game/:id" element={<EditGame />} />
          <Route path="/sample-games" element={<SampleGames />} />
          
          {/* Upload & Creator */}
          <Route path="/upload" element={<UploadGame />} />
          <Route path="/upload-game" element={<UploadGame />} />
          <Route path="/builder" element={<PlanetExplorer />} />
          
          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
          <Route path="/dashboard" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/nft-gallery" element={<NFTGallery />} />
          <Route path="/nft" element={<NFTGallery />} />
          
          {/* Airdrop */}
          <Route path="/airdrop" element={<GlobalAirdrop />} />
          <Route path="/global-airdrop" element={<GlobalAirdrop />} />
          <Route path="/rewards-history" element={<RewardsHistory />} />
          <Route path="/reward-galaxy" element={<RewardGalaxy />} />
          
          {/* Social & Community */}
          <Route path="/friends" element={<Friends />} />
          <Route path="/find-friends" element={<FindFriends />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/community" element={<Community />} />
          <Route path="/messages" element={<PrivateMessages />} />
          
          {/* Leaderboards */}
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/nexus-leaderboard" element={<NexusLeaderboard />} />
          <Route path="/combo-leaderboard" element={<ComboLeaderboard />} />
          <Route path="/camly-leaderboard" element={<CamlyLeaderboard />} />
          <Route path="/achievement-leaderboard" element={<AchievementLeaderboard />} />
          <Route path="/full-ranking" element={<FullRanking />} />
          
          {/* Music */}
          <Route path="/music" element={<MusicLibrary />} />
          <Route path="/public-music" element={<PublicMusic />} />
          
          {/* Parent & Education */}
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          <Route path="/education" element={<Education />} />
          
          {/* Admin */}
          <Route path="/admin/master" element={<AdminMasterDashboard />} />
          <Route path="/admin/game-review" element={<AdminMasterDashboard />} />
          <Route path="/admin-dashboard" element={<AdminMasterDashboard />} />
          <Route path="/admin/rewards" element={<AdminMasterDashboard />} />
          
          {/* Other */}
          <Route path="/about" element={<About />} />
          <Route path="/planet-explorer" element={<PlanetExplorer />} />
          <Route path="/angel-ai" element={<AngelAIHubPage />} />
          <Route path="/law-of-light" element={<LawOfLight />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/install" element={<Install />} />
          
          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

// Floating Chat Windows Component
const FloatingChats = () => {
  const { user } = useAuth();
  const { windows, closeChat, toggleMinimize } = useChatWindows();
  
  if (!user || windows.length === 0) return null;
  
  return (
    <Suspense fallback={null}>
      <FloatingChatWindows
        currentUserId={user.id}
        windows={windows}
        onClose={closeChat}
        onToggleMinimize={toggleMinimize}
      />
    </Suspense>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  const { needsRoleSelection, loading: roleLoading } = useUserRole();
  const { isOpen: gameCompleteOpen, score, gameName, bonusAmount, hidePopup } = useGameCompletePopup();
  const { 
    showRewardPopup, 
    claimedAmount, 
    closeRewardPopup
  } = useDailyLoginReward();
  const {
    showPopup: showBirthYearPopup,
    closePopup: closeBirthYearPopup,
    onBirthYearSaved,
  } = useBirthYearPopup();
  const {
    showPopup: showLawOfLightPopup,
    handleAccept: handleLawOfLightAccept,
  } = useLawOfLight();

  return (
    <>
      <Toaster />
      <Sonner />
      <CoinNotification />
      <RewardMarquee />
      
      {/* Lazy loaded components with Suspense */}
      <Suspense fallback={null}>
        <BackgroundMusicPlayer />
      </Suspense>
      
      <Suspense fallback={null}>
        <PWAInstallPrompt />
      </Suspense>
      
      {/* Role Selection Modal for new users */}
      {user && !roleLoading && needsRoleSelection && (
        <Suspense fallback={null}>
          <RoleSelectionModal 
            isOpen={needsRoleSelection} 
            onClose={() => {}} 
          />
        </Suspense>
      )}
      
      <BrowserRouter>
        <Suspense fallback={null}>
          <MobileBottomNavEnhanced />
        </Suspense>
        
        <AnimatedRoutes />
        
        {/* Floating Chat Windows for Desktop */}
        <FloatingChats />
        
        {/* Floating Chat Button - Mobile only, draggable */}
        <Suspense fallback={null}>
          <FloatingChatButton />
        </Suspense>
        
        {/* Welcome Creator Popup - Shows for new users */}
        <Suspense fallback={null}>
          <WelcomeCreatorPopup />
        </Suspense>
        
        {/* Game Complete Claim Popup - Shows after games */}
        {gameCompleteOpen && (
          <Suspense fallback={null}>
            <GameCompleteClaimPopup
              isOpen={gameCompleteOpen}
              onClose={hidePopup}
              score={score}
              gameName={gameName}
              bonusAmount={bonusAmount}
            />
          </Suspense>
        )}
        
        {/* Daily Login Reward Popup - Shows on login */}
        {showRewardPopup && (
          <Suspense fallback={null}>
            <DailyLoginRewardPopup
              isOpen={showRewardPopup}
              amount={claimedAmount}
              onClose={closeRewardPopup}
            />
          </Suspense>
        )}
        
        {/* Birth Year Popup - Shows for users without birth_year */}
        {showBirthYearPopup && (
          <Suspense fallback={null}>
            <BirthYearPopup
              open={showBirthYearPopup}
              onOpenChange={closeBirthYearPopup}
              onBirthYearSaved={onBirthYearSaved}
            />
          </Suspense>
        )}
        
        {/* Law of Light Popup - Shows for new users who haven't accepted */}
        {showLawOfLightPopup && (
          <Suspense fallback={null}>
            <LawOfLightPopup
              open={showLawOfLightPopup}
              onAccept={handleLawOfLightAccept}
            />
          </Suspense>
        )}
        
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <TooltipProvider>
          <CallProvider>
            <Suspense fallback={<LoadingFallback />}>
              <AppContent />
            </Suspense>
          </CallProvider>
        </TooltipProvider>
      </Web3Provider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
