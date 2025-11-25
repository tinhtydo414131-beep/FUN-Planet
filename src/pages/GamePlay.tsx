import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Import all game components
import { TicTacToe } from "@/components/games/TicTacToe";
import { MemoryCards } from "@/components/games/MemoryCards";
import { Snake } from "@/components/games/Snake";
import { Game2048 } from "@/components/games/Game2048";
import { GuessNumber } from "@/components/games/GuessNumber";
import { RockPaperScissors } from "@/components/games/RockPaperScissors";
import { ColorMatch } from "@/components/games/ColorMatch";
import { WhackAMole } from "@/components/games/WhackAMole";
import { BalloonPop } from "@/components/games/BalloonPop";
import { FlappyBird } from "@/components/games/FlappyBird";
import { Sudoku } from "@/components/games/Sudoku";
import { WordScramble } from "@/components/games/WordScramble";
import { MathQuiz } from "@/components/games/MathQuiz";
import { SimonSays } from "@/components/games/SimonSays";
import { TriviaQuiz } from "@/components/games/TriviaQuiz";
import { MazeRunner } from "@/components/games/MazeRunner";
import { TreasureHunt } from "@/components/games/TreasureHunt";
import { SpaceShooter } from "@/components/games/SpaceShooter";
import { Platformer } from "@/components/games/Platformer";
import { DungeonCrawler } from "@/components/games/DungeonCrawler";
import { Racing } from "@/components/games/Racing";
import { TowerDefense } from "@/components/games/TowerDefense";

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
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  useEffect(() => {
    if (game && user) {
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
      // Update game plays
      await supabase
        .from("games")
        .update({ total_plays: game.total_plays + 1 })
        .eq("id", game.id);

      // Update user profile plays
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_plays")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ total_plays: (profile.total_plays || 0) + 1 })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Error tracking play:", error);
    }
  };

  const renderGame = () => {
    if (!game) return null;

    // Map component_name from database to actual components
    switch (game.component_name) {
      case "TicTacToe": return <TicTacToe />;
      case "MemoryCards": return <MemoryCards />;
      case "Snake": return <Snake />;
      case "Game2048": return <Game2048 />;
      case "FlappyBird": return <FlappyBird />;
      case "SpaceShooter": return <SpaceShooter />;
      case "MazeRunner": return <MazeRunner />;
      case "ColorMatch": return <ColorMatch />;
      case "MathQuiz": return <MathQuiz />;
      case "RockPaperScissors": return <RockPaperScissors />;
      case "Platformer": return <Platformer />;
      case "Racing": return <Racing />;
      case "TowerDefense": return <TowerDefense />;
      case "DungeonCrawler": return <DungeonCrawler />;
      
      // Old games still available
      case "GuessNumber": return <GuessNumber />;
      case "WhackAMole": return <WhackAMole />;
      case "BalloonPop": return <BalloonPop />;
      case "Sudoku": return <Sudoku />;
      case "WordScramble": return <WordScramble />;
      case "SimonSays": return <SimonSays />;
      case "TriviaQuiz": return <TriviaQuiz />;
      case "TreasureHunt": return <TreasureHunt />;
      
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

  if (loading) {
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

  if (!game) {
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <Navigation />
      
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between animate-fade-in">
            <Link to="/games">
              <Button 
                variant="outline" 
                className="font-fredoka font-bold border-4 border-primary/30 hover:border-primary hover:bg-primary/10 transform hover:scale-105 transition-all"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Games
              </Button>
            </Link>
          </div>

          <div className="bg-background/80 backdrop-blur-lg rounded-3xl border-4 border-primary/30 shadow-2xl p-8 space-y-6 animate-scale-in">
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-primary">
                {game.title} 🎮
              </h1>
              <p className="text-lg font-comic text-muted-foreground max-w-2xl mx-auto">
                {game.description}
              </p>
              <p className="text-sm font-comic text-muted-foreground">
                🎯 Played {game.total_plays} times! Keep it up! 🌟
              </p>
            </div>

            <div className="w-full">
              {renderGame()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GamePlay;
