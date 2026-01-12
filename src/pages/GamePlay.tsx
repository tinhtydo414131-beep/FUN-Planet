import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Zap, RotateCcw, Maximize, Minimize } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGameLevel } from "@/hooks/useGameLevel";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useIsLandscape } from "@/hooks/use-mobile";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import { useGameAchievements } from "@/hooks/useGameAchievements";
import { usePlayTimeRewards } from "@/hooks/usePlayTimeRewards";
import { type GameCategory } from "@/config/playtimeRewards";
import { LevelSelector } from "@/components/LevelSelector";
import { FlowerFieldLevelSelector } from "@/components/FlowerFieldLevelSelector";
import { DailyChallengeCard } from "@/components/DailyChallengeCard";
import { LiveComboNotifications } from "@/components/LiveComboNotifications";
import { LandscapePrompt } from "@/components/LandscapePrompt";
import { Web3RewardNotification } from "@/components/Web3RewardNotification";
import { haptics } from "@/utils/haptics";
import confetti from "canvas-confetti";
import { toast } from "sonner";

// Import all game components
import { WordScramble } from "@/components/games/WordScramble";
import { SimonSays } from "@/components/games/SimonSays";
import { TreasureHunt } from "@/components/games/TreasureHunt";
import { TreasureHunt3D } from "@/components/games/TreasureHunt3D";


import HappinessGarden from "@/components/games/HappinessGarden";
import SpaceExplorer from "@/components/games/SpaceExplorer";

import StarCollector from "@/components/games/StarCollector";
import DreamWorld from "@/components/games/DreamWorld";
import GardenBuilder from "@/components/games/GardenBuilder";
import OceanExplorer from "@/components/games/OceanExplorer";
import SkyCastle from "@/components/games/SkyCastle";
import PetParadise from "@/components/games/PetParadise";
import MusicCreator from "@/components/games/MusicCreator";
import FlowerField from "@/components/games/FlowerField";
import LilBlockBuddy from "@/components/games/LilBlockBuddy";
import { HappyKitchenJoy } from "@/components/games/HappyKitchenJoy";
import { CookingMama } from "@/components/games/CookingMama";
import SchoolBuilder from "@/components/games/SchoolBuilder";
import HappyPark from "@/components/games/HappyPark";
import HomeDesigner from "@/components/games/HomeDesigner";
import CommunityHub from "@/components/games/CommunityHub";
import EcoVillage from "@/components/games/EcoVillage";
import { ArtStudio } from "@/components/games/ArtStudio";
import { PetCare } from "@/components/games/PetCare";
import { FarmBuilder } from "@/components/games/FarmBuilder";
import { SpaceStation } from "@/components/games/SpaceStation";

import { HospitalManager } from "@/components/games/HospitalManager";
import { CinemaBoss } from "@/components/games/CinemaBoss";
import { LibraryKeeper } from "@/components/games/LibraryKeeper";
import { RestaurantChef } from "@/components/games/RestaurantChef";
import { ThemeParkBuilder } from "@/components/games/ThemeParkBuilder";
import { RockPaperScissors } from "@/components/games/RockPaperScissors";
import { FlappyBird } from "@/components/games/FlappyBird";

import { SimonSays3D } from "@/components/games/SimonSays3D";
import { WordScramble3D } from "@/components/games/WordScramble3D";

import { StarCollector3D } from "@/components/games/StarCollector3D";
import { PetParadise3D } from "@/components/games/PetParadise3D";
import { DreamWorld3D } from "@/components/games/DreamWorld3D";
import { SkyCastle3D } from "@/components/games/SkyCastle3D";
import { OceanExplorer3D } from "@/components/games/OceanExplorer3D";
import { HappinessGarden3D } from "@/components/games/HappinessGarden3D";
import { FlowerField3D } from "@/components/games/FlowerField3D";
import { MusicCreator3D } from "@/components/games/MusicCreator3D";
import { SpaceExplorer3D } from "@/components/games/SpaceExplorer3D";
import { SpaceStation3D } from "@/components/games/SpaceStation3D";
import ArtStudio3D from "@/components/games/ArtStudio3D";
import EcoVillage3D from "@/components/games/EcoVillage3D";
import HomeDesigner3D from "@/components/games/HomeDesigner3D";
import RockPaperScissors3D from "@/components/games/RockPaperScissors3D";
import FlappyBird3D from "@/components/games/FlappyBird3D";
import PetCare3D from "@/components/games/PetCare3D";

import HospitalManager3D from "@/components/games/HospitalManager3D";
import CinemaBoss3D from "@/components/games/CinemaBoss3D";
import LibraryKeeper3D from "@/components/games/LibraryKeeper3D";
import RestaurantChef3D from "@/components/games/RestaurantChef3D";
import HappyPark3D from "@/components/games/HappyPark3D";
import CommunityHub3D from "@/components/games/CommunityHub3D";
import LilBlockBuddy3D from "@/components/games/LilBlockBuddy3D";
import CookingMama3D from "@/components/games/CookingMama3D";

import HappyKitchenJoy3D from "@/components/games/HappyKitchenJoy3D";


interface Game {
  id: string;
  title: string;
  description: string;
  component_name: string;
  total_plays: number;
}

const GamePlay = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const { checkExplorerAchievements } = useGameAchievements();
  const { startSession, endSession, recordActivity } = usePlayTimeRewards();
  const { claimFirstGameReward, pendingReward, clearPendingReward } = useWeb3Rewards();
  const isLandscape = useIsLandscape();
  const { isFullscreen, toggleFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelSelector, setShowLevelSelector] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const hasTrackedPlayRef = useRef(false);
  const [shownDoubleTapHint, setShownDoubleTapHint] = useState(() => {
    return localStorage.getItem("shownDoubleTapHint") === "true";
  });
  const [autoLevel, setAutoLevel] = useState(() => {
    const saved = localStorage.getItem("autoLevel");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoFullscreen, setAutoFullscreen] = useState(() => {
    const saved = localStorage.getItem("autoFullscreen");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showFullscreenExitHint, setShowFullscreenExitHint] = useState(false);

  // Double-tap to toggle fullscreen
  const doubleTapHandlers = useDoubleTap({
    onDoubleTap: () => {
      haptics.medium();
      toggleFullscreen();
      if (!isFullscreen) {
        setShowFullscreenExitHint(true);
      }
      toast.success(isFullscreen ? "Thoát toàn màn hình" : "Chế độ toàn màn hình", {
        duration: 1500,
      });
    },
  });

  // Auto-hide double-tap hint after 5 seconds
  useEffect(() => {
    if (gameStarted && !shownDoubleTapHint) {
      const timer = setTimeout(() => {
        setShownDoubleTapHint(true);
        localStorage.setItem("shownDoubleTapHint", "true");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, shownDoubleTapHint]);

  // Auto-fullscreen when game starts (if enabled)
  useEffect(() => {
    if (gameStarted && autoFullscreen && !isFullscreen) {
      // Small delay to ensure game is rendered
      const timer = setTimeout(() => {
        enterFullscreen();
        setShowFullscreenExitHint(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, autoFullscreen]);

  // Auto-hide fullscreen exit hint after 2.5 seconds
  useEffect(() => {
    if (showFullscreenExitHint) {
      const timer = setTimeout(() => {
        setShowFullscreenExitHint(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showFullscreenExitHint]);

  // Handle auto fullscreen toggle
  const handleAutoFullscreenToggle = (checked: boolean) => {
    setAutoFullscreen(checked);
    localStorage.setItem("autoFullscreen", JSON.stringify(checked));
  };
  
  const {
    currentLevel,
    setCurrentLevel,
    highestLevelCompleted,
    loading: levelLoading,
    completeLevel,
    getLevelConfig,
    getCoinReward,
  } = useGameLevel(gameId || "");

  useEffect(() => {
    if (gameId) {
      hasTrackedPlayRef.current = false; // Reset tracking when game changes
      fetchGame();
    }
    
    // Cleanup: end session when leaving the page
    return () => {
      endSession();
    };
  }, [gameId]);

  useEffect(() => {
    if (game && user && !hasTrackedPlayRef.current) {
      hasTrackedPlayRef.current = true;
      trackGamePlay();
    }
  }, [game, user]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error) throw error;
      setGame(data);
    } catch (error) {
      console.error("Error fetching game:", error);
    } finally {
      setLoading(false);
    }
  };

  const trackGamePlay = async () => {
    if (!game || !user) return;

    try {
      // Insert into game_plays table for tracking
      await supabase
        .from("game_plays")
        .insert({
          user_id: user.id,
          game_id: game.id,
        });

      // Update game plays count only (no rewards until level completion)
      await supabase
        .from("games")
        .update({ total_plays: game.total_plays + 1 })
        .eq("id", game.id);

      // Update user profile plays count only
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_plays")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ 
            total_plays: (profile.total_plays || 0) + 1
          })
          .eq("id", user.id);
      }

      // Check explorer achievements after tracking the play
      checkExplorerAchievements();
    } catch (error) {
      console.error("Error tracking play:", error);
    }
  };

  const handleStartGame = () => {
    setShowLevelSelector(false);
    setGameStarted(true);
    
    // Start playtime rewards session
    if (game && user) {
      const category = (game as any).category || 'default';
      startSession(game.id, 'builtin', category as GameCategory);
    }
  };

  const handleBackToLevelSelect = () => {
    // End current session before going back
    endSession();
    setShowLevelSelector(true);
    setGameStarted(false);
  };

  const handleAutoLevelToggle = (checked: boolean) => {
    setAutoLevel(checked);
    localStorage.setItem("autoLevel", JSON.stringify(checked));
  };

  const handleLevelComplete = async () => {
    completeLevel(currentLevel);
    
    // Haptic feedback for success
    haptics.success();

    // NOTE: Level complete reward removed - rewards now based on:
    // 1. First play bonus (10,000 CAMLY per new game - handled by usePlayTimeRewards)
    // 2. Playtime rewards (500 CAMLY per minute - handled by usePlayTimeRewards)
    
    // Fire confetti 5 times
    const fireConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181']
      });
    };

    // Fire confetti 5 times with delay
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        fireConfetti();
      }, i * 300);
    }

    // Auto-advance to next level after confetti if enabled
    setTimeout(() => {
      if (autoLevel && currentLevel < 10) {
        setCurrentLevel(currentLevel + 1);
        setShowLevelSelector(false);
        setGameStarted(true);
      } else {
        // Show level selector if auto-level is off or all levels completed
        setShowLevelSelector(true);
        setGameStarted(false);
      }
    }, 2000);
  };

  const renderGame = () => {
    const levelConfig = getLevelConfig(currentLevel);
    const gameProps = {
      level: currentLevel,
      difficultyMultiplier: levelConfig.difficultyMultiplier,
      onLevelComplete: handleLevelComplete,
      onBack: handleBackToLevelSelect,
    };

    // Support both database games and direct gameId routing
    const componentKey = game?.component_name || gameId;

    // Map component_name from database to actual components
    switch (componentKey) {
      // Casual & Happy Games
      case "StarCollector": return <StarCollector3D {...gameProps} />;
      case "StarCollector2D": return <StarCollector {...gameProps} />;
      case "HappinessGarden": return <HappinessGarden3D {...gameProps} />;
      case "HappinessGarden2D": return <HappinessGarden {...gameProps} />;
      case "FlowerField": return <FlowerField3D {...gameProps} />;
      case "FlowerField2D": return <FlowerField {...gameProps} />;
      case "PetParadise": return <PetParadise3D {...gameProps} />;
      case "PetParadise2D": return <PetParadise {...gameProps} />;
      case "MusicCreator": return <MusicCreator3D {...gameProps} />;
      case "MusicCreator2D": return <MusicCreator {...gameProps} />;
      
      // Brain & Educational Games
      case "WordScramble": return <WordScramble3D {...gameProps} />;
      case "WordScramble2D": return <WordScramble {...gameProps} />;
      case "SimonSays": return <SimonSays3D {...gameProps} />;
      case "SimonSays2D": return <SimonSays {...gameProps} />;
      
      // Building & Creation Games
      case "GardenBuilder": return <GardenBuilder {...gameProps} />;
      case "GardenBuilder2D": return <GardenBuilder {...gameProps} />;
      case "SkyCastle": return <SkyCastle3D {...gameProps} />;
      case "SkyCastle2D": return <SkyCastle {...gameProps} />;
      case "DreamWorld": return <DreamWorld3D {...gameProps} />;
      case "DreamWorld2D": return <DreamWorld {...gameProps} />;
      case "SchoolBuilder":
      case "school-builder":
      case "SchoolBuilder2D": 
        return <SchoolBuilder {...gameProps} />;
      case "HappyPark":
      case "happy-park":
        return <HappyPark3D {...gameProps} />;
      case "HappyPark2D": return <HappyPark {...gameProps} />;
      case "HomeDesigner":
      case "home-designer":
        return <HomeDesigner3D {...gameProps} />;
      case "HomeDesigner2D": return <HomeDesigner {...gameProps} />;
      case "CommunityHub":
      case "community-hub":
        return <CommunityHub3D {...gameProps} />;
      case "CommunityHub2D": return <CommunityHub {...gameProps} />;
      case "EcoVillage":
      case "eco-village":
        return <EcoVillage3D {...gameProps} />;
      case "EcoVillage2D": return <EcoVillage {...gameProps} />;
      case "ArtStudio":
      case "art-studio":
        return <ArtStudio3D {...gameProps} />;
      case "ArtStudio2D": return <ArtStudio {...gameProps} />;
      case "PetCare":
      case "pet-care":
        return <PetCare3D {...gameProps} />;
      case "PetCare2D": return <PetCare {...gameProps} />;
      case "FarmBuilder":
      case "farm-builder":
      case "FarmBuilder2D": 
        return <FarmBuilder {...gameProps} />;
      case "SpaceStation":
      case "space-station":
        return <SpaceStation3D {...gameProps} />;
      case "SpaceStation2D": return <SpaceStation {...gameProps} />;
      case "HospitalManager":
      case "hospital-manager":
        return <HospitalManager3D {...gameProps} />;
      case "HospitalManager2D": return <HospitalManager {...gameProps} />;
      case "CinemaBoss":
      case "cinema-boss":
        return <CinemaBoss3D {...gameProps} />;
      case "CinemaBoss2D": return <CinemaBoss {...gameProps} />;
      case "LibraryKeeper":
      case "library-keeper":
        return <LibraryKeeper3D {...gameProps} />;
      case "LibraryKeeper2D": return <LibraryKeeper {...gameProps} />;
      case "RestaurantChef":
      case "restaurant-chef":
        return <RestaurantChef3D {...gameProps} />;
      case "RestaurantChef2D": return <RestaurantChef {...gameProps} />;
      case "ThemeParkBuilder":
      case "theme-park-builder":
      case "ThemeParkBuilder2D": 
        return <ThemeParkBuilder {...gameProps} />;
      
      // Exploration & Adventure Games
      case "SpaceExplorer": return <SpaceExplorer3D {...gameProps} />;
      case "SpaceExplorer2D": return <SpaceExplorer {...gameProps} />;
      case "OceanExplorer": return <OceanExplorer3D {...gameProps} />;
      case "OceanExplorer2D": return <OceanExplorer {...gameProps} />;
      case "TreasureHunt": return <TreasureHunt3D {...gameProps} />;
      case "TreasureHunt2D": return <TreasureHunt {...gameProps} />;
      case "LilBlockBuddy": return <LilBlockBuddy3D {...gameProps} />;
      case "LilBlockBuddy2D": return <LilBlockBuddy {...gameProps} />;
      case "CookingMama":
      case "cooking-mama":
        return <CookingMama3D {...gameProps} />;
      case "CookingMama2D": return <CookingMama />;
      case "HappyKitchenJoy": 
      case "happy-kitchen-joy":
        return <HappyKitchenJoy3D {...gameProps} />;
      case "HappyKitchenJoy2D":
        return <HappyKitchenJoy onBack={handleBackToLevelSelect} />;
      
      // Classic & Arcade Games
      case "RockPaperScissors":
      case "rock-paper-scissors":
        return <RockPaperScissors3D {...gameProps} />;
      case "RockPaperScissors2D": return <RockPaperScissors {...gameProps} />;
      case "FlappyBird":
      case "flappy-bird":
        return <FlappyBird3D {...gameProps} />;
      case "FlappyBird2D": return <FlappyBird {...gameProps} />;
      
      
      
      default:
        return (
          <div className="text-center py-20">
            <p className="text-2xl font-fredoka text-muted-foreground">
              Game not available yet! 🎮
            </p>
          </div>
        );
    }
  };

  if (loading || levelLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-32 px-4 text-center">
          <div className="animate-bounce text-6xl mb-4">🎮</div>
          <p className="text-2xl font-fredoka text-primary">Loading game... ⏳</p>
        </div>
      </div>
    );
  }

  // Allow playing games that aren't in database yet
  const isDirectGame = gameId === 'cooking-mama' || 
                       gameId === 'happy-kitchen-joy' ||
                       gameId === 'school-builder' ||
                       gameId === 'happy-park' ||
                       gameId === 'home-designer' ||
                       gameId === 'community-hub' ||
                       gameId === 'eco-village' ||
                       gameId === 'art-studio' ||
                       gameId === 'pet-care' ||
                       gameId === 'farm-builder' ||
                       gameId === 'space-station' ||
                       gameId === 'hospital-manager' ||
                       gameId === 'cinema-boss' ||
                       gameId === 'library-keeper' ||
                       gameId === 'restaurant-chef' ||
                       gameId === 'theme-park-builder';
  
  if (!game && !isDirectGame) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-32 px-4 text-center space-y-4">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-3xl font-fredoka text-primary">Game not found!</p>
          <Link to="/games">
            <Button className="font-fredoka font-bold text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary">
              <ArrowLeft className="mr-2" />
              Back to Games
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={isLandscape ? "min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden" : "min-h-screen bg-white"}>
      {!isLandscape && <Navigation />}
      <LiveComboNotifications />
      <Web3RewardNotification 
        isOpen={!!pendingReward}
        amount={pendingReward?.amount || 0}
        description={pendingReward?.description || ''}
        onClose={clearPendingReward} 
      />
      
      {isLandscape && gameStarted && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/95 to-secondary/95 backdrop-blur-md px-3 py-1.5 flex items-center justify-between border-b-2 border-white/20 shadow-xl">
          <Link to="/games">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/20 font-fredoka font-bold h-8 px-3 active:scale-95 transition-transform"
              onClick={() => haptics.light()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-fredoka font-bold text-white/90 truncate max-w-[200px]">
              {game?.title || 'Game'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              haptics.light();
              toggleFullscreen();
            }}
            className="text-white hover:bg-white/20 font-fredoka font-bold h-8 px-3 active:scale-95 transition-transform"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      )}
      
      {/* Fullscreen FAB Button - positioned above bottom nav */}
      {!isLandscape && gameStarted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            haptics.light();
            toggleFullscreen();
            if (!isFullscreen) {
              setShowFullscreenExitHint(true);
            }
          }}
          className="md:hidden fixed z-40 bg-primary/90 hover:bg-primary text-white shadow-lg rounded-full w-12 h-12 animate-scale-in active:scale-95 transition-transform"
          style={{ 
            bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
            right: '1rem'
          }}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
      )}

      {/* Fullscreen Exit Hint */}
      {isFullscreen && showFullscreenExitHint && (
        <div className="md:hidden fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-black/80 text-white px-4 py-2 rounded-full text-sm font-comic animate-fade-in shadow-xl">
          👆👆 Nhấn đúp để thoát toàn màn hình
        </div>
      )}

      {/* Mobile Fullscreen Exit Button */}
      {isFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            haptics.light();
            exitFullscreen();
          }}
          className="md:hidden fixed top-4 right-4 z-[100] bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 active:scale-95 transition-transform"
        >
          <Minimize className="h-4 w-4" />
        </Button>
      )}
      
      <section className={isLandscape ? "pt-10 pb-0 px-2 h-screen" : "pt-20 pb-28 md:pb-12 px-2 md:px-4"}>
        <div className={isLandscape ? "h-[calc(100vh-2.5rem)] flex items-center justify-center" : "container mx-auto max-w-6xl"}>
          {!isLandscape && (
            <div className="mb-4 md:mb-8 flex items-center justify-between animate-fade-in">
              <Link to="/games">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="font-fredoka font-bold border-2 md:border-4 border-primary/30 hover:border-primary hover:bg-primary/10 transform hover:scale-105 transition-all touch-manipulation"
                >
                  <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Back to Games</span>
                  <span className="md:hidden">Back</span>
                </Button>
              </Link>
              
              <div className="flex items-center gap-2 md:gap-4">
                {/* Auto Level Toggle */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-primary/30">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <Label htmlFor="auto-level" className="font-fredoka font-bold text-xs md:text-base text-foreground cursor-pointer">
                    Auto
                  </Label>
                  <Switch
                    id="auto-level"
                    checked={autoLevel}
                    onCheckedChange={handleAutoLevelToggle}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                {/* Auto Fullscreen Toggle - Mobile Only */}
                <div className="md:hidden flex items-center gap-2 bg-gradient-to-r from-secondary/10 to-accent/10 px-3 py-2 rounded-xl border-2 border-secondary/30">
                  <Maximize className="h-4 w-4 text-secondary" />
                  <Label htmlFor="auto-fullscreen" className="font-fredoka font-bold text-xs text-foreground cursor-pointer">
                    Full
                  </Label>
                  <Switch
                    id="auto-fullscreen"
                    checked={autoFullscreen}
                    onCheckedChange={handleAutoFullscreenToggle}
                    className="data-[state=checked]:bg-secondary"
                  />
                </div>
              </div>
            </div>
          )}

          <div 
            {...(gameStarted ? doubleTapHandlers : {})}
            className={isLandscape && gameStarted 
              ? "w-full h-full bg-gradient-to-br from-background/98 to-background/95 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-2xl p-2 overflow-hidden flex items-center justify-center game-container" 
              : "bg-background/80 backdrop-blur-lg rounded-2xl md:rounded-3xl border-2 md:border-4 border-primary/30 shadow-2xl p-4 md:p-8 space-y-4 md:space-y-6 animate-scale-in game-container"
            }
          >
            {/* Double-tap hint for mobile */}
            {gameStarted && !shownDoubleTapHint && (
              <div 
                className="md:hidden fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-comic animate-bounce shadow-lg"
                onClick={() => setShownDoubleTapHint(true)}
              >
                👆👆 Nhấn đúp 2 lần để phóng to
              </div>
            )}
            
            {(!isLandscape || !gameStarted) && (
              <div className="text-center space-y-1 md:space-y-2">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-fredoka font-bold text-primary">
                  {game?.title || (gameId === 'cooking-mama' ? 'Cooking Mama' : 'Game')} 🎮
                </h1>
                <p className="text-sm md:text-lg font-comic text-muted-foreground max-w-2xl mx-auto line-clamp-2">
                  {game?.description || (gameId === 'cooking-mama' ? 'Master recipes!' : '')}
                </p>
                {game && (
                  <p className="text-xs md:text-sm font-comic text-muted-foreground">
                    🎯 {game.total_plays} lượt chơi
                  </p>
                )}
              </div>
            )}

            <div className={isLandscape && gameStarted ? "w-full h-full flex items-center justify-center" : "w-full"}>
              {/* Show Daily Challenge Card for Gold Miner game */}
              {!isLandscape && (gameId === 'gold-miner' || game?.component_name === 'GoldMiner') && gameStarted && (
                <div className="mb-6">
                  <DailyChallengeCard />
                </div>
              )}
              
              {showLevelSelector && !gameStarted && game?.component_name !== "HappyKitchenJoy" && game?.component_name !== "CookingMama" && game?.component_name !== "TicTacToe" && game?.component_name !== "Game2048Nexus" && !isDirectGame ? (
                game.component_name === "FlowerField" ? (
                  <FlowerFieldLevelSelector
                    highestLevelCompleted={highestLevelCompleted}
                    currentLevel={currentLevel}
                    onLevelSelect={setCurrentLevel}
                    onStartGame={handleStartGame}
                    getCoinReward={getCoinReward}
                  />
                ) : (
                  <LevelSelector
                    highestLevelCompleted={highestLevelCompleted}
                    currentLevel={currentLevel}
                    onLevelSelect={setCurrentLevel}
                    onStartGame={handleStartGame}
                    getCoinReward={getCoinReward}
                  />
                )
              ) : (
                renderGame()
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GamePlay;
