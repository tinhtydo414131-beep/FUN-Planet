import { useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Float, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import { 
  Rocket, Star, Globe, Sparkles, Trophy, Lock, 
  ChevronRight, Home, Palette, Zap, Award, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Planet Component with customizable colors
const Planet = ({ 
  position, 
  color, 
  size = 1, 
  hasRing = false,
  name,
  unlocked = true,
  onClick 
}: { 
  position: [number, number, number];
  color: string;
  size?: number;
  hasRing?: boolean;
  name: string;
  unlocked?: boolean;
  onClick?: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.002;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={position} onClick={onClick}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial 
            color={unlocked ? color : "#4a5568"} 
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
        
        {hasRing && (
          <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[size * 1.5, size * 0.1, 16, 100]} />
            <meshStandardMaterial 
              color={unlocked ? "#FFD700" : "#718096"} 
              roughness={0.5}
            />
          </mesh>
        )}
        
        {!unlocked && (
          <Html center>
            <div className="bg-background/80 backdrop-blur px-2 py-1 rounded-full">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          </Html>
        )}
        
        <Html position={[0, size + 0.5, 0]} center>
          <div className={`text-center transition-all ${unlocked ? 'text-white' : 'text-muted-foreground'}`}>
            <span className="text-sm font-bold whitespace-nowrap">{name}</span>
          </div>
        </Html>
      </group>
    </Float>
  );
};

// Spaceship Component
const Spaceship = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group ref={meshRef} position={position} scale={0.3}>
      {/* Main body */}
      <mesh>
        <coneGeometry args={[0.3, 1, 8]} />
        <meshStandardMaterial color="#4ECDC4" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wings */}
      <mesh position={[0.4, -0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.5, 0.1, 0.3]} />
        <meshStandardMaterial color="#FF6B35" />
      </mesh>
      <mesh position={[-0.4, -0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.5, 0.1, 0.3]} />
        <meshStandardMaterial color="#FF6B35" />
      </mesh>
      {/* Flame */}
      <mesh position={[0, -0.6, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#FFE66D" emissive="#FF6B35" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

// Space Scene Component
const SpaceScene = ({ 
  planets, 
  selectedPlanet, 
  onPlanetClick,
  playerPosition 
}: { 
  planets: PlanetData[];
  selectedPlanet: string | null;
  onPlanetClick: (id: string) => void;
  playerPosition: [number, number, number];
}) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFE66D" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ECDC4" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {planets.map((planet) => (
        <Planet
          key={planet.id}
          position={planet.position}
          color={planet.color}
          size={planet.size}
          hasRing={planet.hasRing}
          name={planet.name}
          unlocked={planet.unlocked}
          onClick={() => planet.unlocked && onPlanetClick(planet.id)}
        />
      ))}
      
      <Spaceship position={playerPosition} />
      
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={30}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
};

interface PlanetData {
  id: string;
  name: string;
  namevi: string;
  position: [number, number, number];
  color: string;
  size: number;
  hasRing: boolean;
  unlocked: boolean;
  achievement: string;
  achievementVi: string;
  requiredStars: number;
}

const PlanetExplorer = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isVN = i18n.language === 'vi';
  
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [totalStars, setTotalStars] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<PlanetData | null>(null);
  const [mintingNFT, setMintingNFT] = useState(false);

  const planets: PlanetData[] = [
    {
      id: 'earth',
      name: 'Earth',
      namevi: 'Trái Đất',
      position: [-6, 0, 0],
      color: '#4ECDC4',
      size: 1.2,
      hasRing: false,
      unlocked: true,
      achievement: 'Home Planet Explorer',
      achievementVi: 'Nhà thám hiểm Trái Đất',
      requiredStars: 0
    },
    {
      id: 'mars',
      name: 'Mars',
      namevi: 'Sao Hỏa',
      position: [-2, 2, -2],
      color: '#FF6B35',
      size: 0.9,
      hasRing: false,
      unlocked: totalStars >= 10,
      achievement: 'Mars Pioneer',
      achievementVi: 'Người tiên phong Sao Hỏa',
      requiredStars: 10
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      namevi: 'Sao Mộc',
      position: [2, -1, 3],
      color: '#FFE66D',
      size: 2,
      hasRing: false,
      unlocked: totalStars >= 30,
      achievement: 'Gas Giant Explorer',
      achievementVi: 'Nhà thám hiểm khổng lồ khí',
      requiredStars: 30
    },
    {
      id: 'saturn',
      name: 'Saturn',
      namevi: 'Sao Thổ',
      position: [6, 1, -1],
      color: '#F4D03F',
      size: 1.8,
      hasRing: true,
      unlocked: totalStars >= 50,
      achievement: 'Ring Master',
      achievementVi: 'Bậc thầy vành đai',
      requiredStars: 50
    },
    {
      id: 'neptune',
      name: 'Neptune',
      namevi: 'Sao Hải Vương',
      position: [0, 3, 6],
      color: '#3498DB',
      size: 1.5,
      hasRing: false,
      unlocked: totalStars >= 100,
      achievement: 'From Earth to Stars',
      achievementVi: 'Từ Trái Đất đến Sao',
      requiredStars: 100
    }
  ];

  const handlePlanetClick = (id: string) => {
    const planet = planets.find(p => p.id === id);
    if (planet) {
      setSelectedPlanet(id);
      setCurrentAchievement(planet);
      
      // Award stars for exploring
      const starsEarned = Math.floor(Math.random() * 5) + 1;
      setTotalStars(prev => prev + starsEarned);
      
      toast.success(
        isVN 
          ? `+${starsEarned} ⭐ khi khám phá ${planet.namevi}!`
          : `+${starsEarned} ⭐ for exploring ${planet.name}!`
      );
    }
  };

  const handleMintAchievementNFT = async () => {
    if (!user || !currentAchievement) return;
    
    setMintingNFT(true);
    
    try {
      // Record the NFT mint in database
      const { error } = await supabase
        .from('minted_achievement_nfts')
        .insert({
          user_id: user.id,
          achievement_type: `planet_${currentAchievement.id}`,
          token_id: `PLANET-${Date.now()}`,
          tx_hash: `0x${Math.random().toString(16).slice(2)}`,
          wallet_address: '0x...'
        });

      if (error) throw error;

      setShowAchievement(true);
      
      // Fire confetti
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#4ECDC4', '#FFE66D', '#FF6B35', '#FF69B4']
      });

      toast.success(
        isVN 
          ? `🎉 NFT "${currentAchievement.achievementVi}" đã được mint!`
          : `🎉 NFT "${currentAchievement.achievement}" minted!`
      );
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error(isVN ? 'Có lỗi xảy ra!' : 'Something went wrong!');
    } finally {
      setMintingNFT(false);
    }
  };

  const selectedPlanetData = planets.find(p => p.id === selectedPlanet);
  const nextMilestone = planets.find(p => !p.unlocked);
  const progressToNext = nextMilestone 
    ? (totalStars / nextMilestone.requiredStars) * 100 
    : 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Badge variant="secondary" className="mb-4 gap-2">
              <Rocket className="w-4 h-4" />
              {isVN ? 'Khám phá vũ trụ 3D' : '3D Space Exploration'}
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {isVN ? 'Từ Trái Đất đến Sao' : 'From Earth to Stars'}
              </span>
            </h1>
            
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isVN 
                ? '🚀 Khám phá các hành tinh, thu thập sao, và mint NFT thành tựu độc quyền!'
                : '🚀 Explore planets, collect stars, and mint exclusive achievement NFTs!'}
            </p>
          </motion.div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="flex items-center gap-3 p-4">
                <Star className="w-6 h-6 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{totalStars}</div>
                  <div className="text-xs text-muted-foreground">
                    {isVN ? 'Sao thu thập' : 'Stars Collected'}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="flex items-center gap-3 p-4">
                <Globe className="w-6 h-6 text-cyan-500" />
                <div>
                  <div className="text-2xl font-bold">{planets.filter(p => p.unlocked).length}/{planets.length}</div>
                  <div className="text-xs text-muted-foreground">
                    {isVN ? 'Hành tinh mở khóa' : 'Planets Unlocked'}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="flex items-center gap-3 p-4">
                <Trophy className="w-6 h-6 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{planets.filter(p => p.unlocked).length}</div>
                  <div className="text-xs text-muted-foreground">
                    {isVN ? 'NFT có thể mint' : 'NFTs Available'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3D Scene */}
      <section className="px-4 pb-8">
        <div className="container mx-auto">
          <Card className="overflow-hidden">
            <div className="relative h-[500px] md:h-[600px] bg-gradient-to-b from-slate-900 to-slate-800">
              <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
                <Suspense fallback={null}>
                  <SpaceScene
                    planets={planets}
                    selectedPlanet={selectedPlanet}
                    onPlanetClick={handlePlanetClick}
                    playerPosition={[0, -3, 8]}
                  />
                </Suspense>
              </Canvas>
              
              {/* Overlay Controls */}
              <div className="absolute bottom-4 left-4 right-4">
                <Card className="bg-card/80 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm">
                          {isVN ? 'Nhấp vào hành tinh để khám phá!' : 'Click on a planet to explore!'}
                        </span>
                      </div>
                      
                      {nextMilestone && (
                        <div className="flex items-center gap-3 flex-1 max-w-xs">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {isVN ? `Tiếp: ${nextMilestone.namevi}` : `Next: ${nextMilestone.name}`}
                          </span>
                          <Progress value={progressToNext} className="h-2 flex-1" />
                          <span className="text-xs font-bold">{totalStars}/{nextMilestone.requiredStars}⭐</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Planet Details Panel */}
      <AnimatePresence>
        {selectedPlanetData && (
          <section className="px-4 pb-8">
            <div className="container mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Card className="border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: selectedPlanetData.color }}
                          />
                          {isVN ? selectedPlanetData.namevi : selectedPlanetData.name}
                        </CardTitle>
                        <CardDescription>
                          {isVN 
                            ? `Thành tựu: ${selectedPlanetData.achievementVi}`
                            : `Achievement: ${selectedPlanetData.achievement}`}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Star className="w-3 h-3" />
                        {selectedPlanetData.requiredStars} {isVN ? 'sao yêu cầu' : 'stars required'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={handleMintAchievementNFT}
                        disabled={mintingNFT || !user}
                        className="gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                      >
                        {mintingNFT ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Award className="w-4 h-4" />
                        )}
                        {isVN ? 'Mint NFT Thành Tựu' : 'Mint Achievement NFT'}
                      </Button>
                      
                      <Button variant="outline" onClick={() => setSelectedPlanet(null)}>
                        {isVN ? 'Tiếp tục khám phá' : 'Continue Exploring'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        )}
      </AnimatePresence>

      {/* Achievement NFT Cards */}
      <section className="px-4 pb-12">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isVN ? '🏆 Bộ sưu tập NFT Vũ Trụ' : '🏆 Space NFT Collection'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {planets.map((planet, index) => (
              <motion.div
                key={planet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`text-center transition-all ${
                  planet.unlocked 
                    ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                    : 'opacity-50'
                }`}>
                  <CardContent className="p-4">
                    <div 
                      className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: planet.unlocked ? planet.color : '#4a5568' }}
                    >
                      {planet.unlocked ? (
                        <Globe className="w-8 h-8 text-white" />
                      ) : (
                        <Lock className="w-6 h-6 text-white/50" />
                      )}
                    </div>
                    <h3 className="font-bold text-sm mb-1">
                      {isVN ? planet.namevi : planet.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {planet.unlocked 
                        ? (isVN ? planet.achievementVi : planet.achievement)
                        : `${planet.requiredStars} ⭐`}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievement Modal */}
      <Dialog open={showAchievement} onOpenChange={setShowAchievement}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              {isVN ? 'Thành tựu đã đạt!' : 'Achievement Unlocked!'}
            </DialogTitle>
            <DialogDescription>
              {currentAchievement && (
                <div className="py-6 space-y-4">
                  <div 
                    className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                    style={{ backgroundColor: currentAchievement.color }}
                  >
                    <Globe className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-xl font-bold">
                    {isVN ? currentAchievement.achievementVi : currentAchievement.achievement}
                  </div>
                  <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                    <Gift className="w-4 h-4 mr-2" />
                    NFT Soulbound
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Button onClick={() => setShowAchievement(false)} className="w-full">
            {isVN ? 'Tuyệt vời!' : 'Awesome!'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanetExplorer;
