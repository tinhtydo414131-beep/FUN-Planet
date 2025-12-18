import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Upload, Loader2, Link, FileArchive, CheckCircle, XCircle, 
  AlertTriangle, Sparkles, Play, Diamond, Wand2, Image, Video,
  BookOpen, Gamepad2, Brain, Heart, Puzzle, Rocket, Music, Palette
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import confetti from "canvas-confetti";
import uploadGameHero from "@/assets/upload-game-hero.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ScanResult {
  safe: boolean;
  reason: string;
  confidence: number;
  needsReview?: boolean;
}

const TOPIC_OPTIONS = [
  { id: "puzzle", label: "🧩 Puzzle & Logic", icon: Puzzle },
  { id: "adventure", label: "🗺️ Adventure", icon: Rocket },
  { id: "creative", label: "🎨 Creative & Art", icon: Palette },
  { id: "educational", label: "📚 Educational", icon: BookOpen },
  { id: "music", label: "🎵 Music & Rhythm", icon: Music },
  { id: "brain", label: "🧠 Brain Training", icon: Brain },
  { id: "kindness", label: "💖 Kindness & Love", icon: Heart },
  { id: "casual", label: "🎮 Casual Fun", icon: Gamepad2 },
];

const AGE_OPTIONS = [
  { value: "3+", label: "👶 3+ years", emoji: "🍼" },
  { value: "6+", label: "🧒 6+ years", emoji: "⭐" },
  { value: "9+", label: "👦 9+ years", emoji: "🚀" },
  { value: "12+", label: "🧑 12+ years", emoji: "💫" },
];

export default function UploadGame() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMethod, setUploadMethod] = useState<"link" | "zip" | null>(null);
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [isDraggingGame, setIsDraggingGame] = useState(false);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [urlValidated, setUrlValidated] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ageAppropriate: "",
    deployUrl: "",
    thumbnailUrl: "",
  });

  // Validate deploy URL
  const validateDeployUrl = useCallback((url: string) => {
    if (!url) {
      setUrlValidated(false);
      return;
    }
    const validPatterns = [
      /^https?:\/\/[a-zA-Z0-9-]+\.vercel\.app/,
      /^https?:\/\/[a-zA-Z0-9-]+\.netlify\.app/,
      /^https?:\/\/[a-zA-Z0-9-]+\.lovable\.(app|dev)/,
      /^https?:\/\/[a-zA-Z0-9-]+\.replit\.dev/,
      /^https?:\/\/[a-zA-Z0-9-]+\.glitch\.me/,
      /^https?:\/\/[a-zA-Z0-9-]+\.pages\.dev/,
      /^https?:\/\/[a-zA-Z0-9-]+\.github\.io/,
      /^https?:\/\/.+/,
    ];
    const isValid = validPatterns.some(pattern => pattern.test(url));
    setUrlValidated(isValid);
    if (isValid) {
      toast.success("✨ Deploy link detected!", { duration: 2000 });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.deployUrl) {
        validateDeployUrl(formData.deployUrl);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.deployUrl, validateDeployUrl]);

  // Handle thumbnail preview
  useEffect(() => {
    if (thumbnail) {
      const url = URL.createObjectURL(thumbnail);
      setThumbnailPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (formData.thumbnailUrl) {
      setThumbnailPreview(formData.thumbnailUrl);
    } else {
      setThumbnailPreview("");
    }
  }, [thumbnail, formData.thumbnailUrl]);

  // AI Description Suggestion
  const generateDescription = async () => {
    if (!formData.title) {
      toast.error("Please enter a game name first!");
      return;
    }
    setIsGeneratingDesc(true);
    try {
      // Simple AI-like suggestion based on title and topics
      const topicLabels = selectedTopics.map(t => TOPIC_OPTIONS.find(o => o.id === t)?.label || t).join(", ");
      const suggestion = `${formData.title} is a delightful ${topicLabels || "fun"} game designed for children. Players will enjoy interactive challenges that develop creativity, problem-solving skills, and bring joy to every moment of play! 🌟`;
      setFormData(prev => ({ ...prev, description: suggestion }));
      toast.success("✨ Angel AI suggested a description!");
    } catch (error) {
      toast.error("Could not generate description");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // Drag & drop handlers
  const handleGameDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGame(true);
  }, []);

  const handleGameDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGame(false);
  }, []);

  const handleGameDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGame(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      setGameFile(file);
      setUploadMethod("zip");
      toast.success(`🎮 "${file.name}" ready for upload!`);
    } else {
      toast.error("Please drop a .zip file");
    }
  }, []);

  const handleThumbDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingThumb(true);
  }, []);

  const handleThumbDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingThumb(false);
  }, []);

  const handleThumbDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingThumb(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnail(file);
      toast.success(`🖼️ Thumbnail ready!`);
    } else {
      toast.error("Please drop an image file");
    }
  }, []);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  // AI Safety Scan
  const runSafetyScan = async (): Promise<boolean> => {
    if (!formData.title || !formData.description) return false;
    setScanning(true);
    setScanResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('scan-game-content', {
        body: { title: formData.title, description: formData.description }
      });
      if (error) throw error;
      setScanResult(data);
      return data.safe;
    } catch (error) {
      setScanResult({ safe: true, reason: "Scan unavailable - will require manual review", confidence: 0.5, needsReview: true });
      return true;
    } finally {
      setScanning(false);
    }
  };

  // Fire diamond confetti celebration
  const fireDiamondConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#00BFFF', '#FF69B4', '#FFD700', '#00FF7F', '#FF6347', '#9370DB'];
    
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        shapes: ['circle', 'square'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        shapes: ['circle', 'square'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Big burst in center
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login to upload games!");
      navigate("/auth");
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error("Please fill in the game name and description");
      return;
    }

    if (uploadMethod === "link" && !formData.deployUrl) {
      toast.error("Please paste your deploy link");
      return;
    }

    if (uploadMethod === "zip" && !gameFile) {
      toast.error("Please upload your game ZIP file");
      return;
    }

    const isSafe = await runSafetyScan();
    if (!isSafe) {
      toast.error("Content did not pass safety check");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let thumbnailPath = "";
      
      // Upload thumbnail if provided
      if (thumbnail) {
        setUploadProgress(20);
        const thumbnailFileName = `${user.id}/${Date.now()}_${thumbnail.name}`;
        const { error: thumbError } = await supabase.storage
          .from('uploaded-games')
          .upload(thumbnailFileName, thumbnail);
        if (thumbError) throw thumbError;
        thumbnailPath = thumbnailFileName;
      }
      setUploadProgress(40);

      let gameFilePath = "deployed-game";
      
      // Upload ZIP if provided
      if (uploadMethod === "zip" && gameFile) {
        const gameFileName = `${user.id}/${Date.now()}_${gameFile.name}`;
        const { error: gameError } = await supabase.storage
          .from('uploaded-games')
          .upload(gameFileName, gameFile);
        if (gameError) throw gameError;
        gameFilePath = gameFileName;
      }
      setUploadProgress(70);

      // Insert game record
      const category = selectedTopics[0] || 'casual';
      const { data: insertedGame, error: insertError } = await supabase
        .from('uploaded_games')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: category as any,
          game_file_path: gameFilePath,
          thumbnail_path: thumbnailPath || formData.thumbnailUrl || '',
          tags: [formData.ageAppropriate || '3+', ...selectedTopics],
          status: 'approved',
          approved_at: new Date().toISOString(),
          external_url: uploadMethod === "link" ? formData.deployUrl : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setUploadProgress(85);

      // Award 500,000 CAMLY coins!
      const rewardAmount = 500000;
      
      await supabase
        .from('camly_coin_transactions')
        .insert({
          user_id: user.id,
          amount: rewardAmount,
          transaction_type: 'reward',
          description: `🎮 Creator reward: ${formData.title}`,
        });

      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      await supabase
        .from('profiles')
        .update({ wallet_balance: (profile?.wallet_balance || 0) + rewardAmount })
        .eq('id', user.id);

      setUploadProgress(100);

      // Fire celebration!
      fireDiamondConfetti();
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">🎉 CONGRATULATIONS!</span>
          <span>You earned {rewardAmount.toLocaleString()} CAMLY!</span>
          <span className="text-sm opacity-80">Your game is now LIVE!</span>
        </div>,
        { duration: 5000 }
      );

      // Navigate to the new game after a short delay
      setTimeout(() => {
        if (insertedGame?.id) {
          navigate(`/game/${insertedGame.id}`);
        } else {
          navigate('/games');
        }
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload game");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation />
      
      <div className="container max-w-4xl mx-auto py-8 px-4 pt-24 pb-32">
        {/* Magical Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="font-bold text-sm">CREATIVE PARADISE GATEWAY</span>
            <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-4">
            Hello Light Creators! ✨
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your game and receive{" "}
            <span className="font-black text-2xl bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              500K CAMLY
            </span>{" "}
            instantly! 🎁
          </p>

          {/* Floating reward badge */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400/90 to-orange-500/90 rounded-full shadow-lg"
          >
            <Diamond className="w-6 h-6 text-white" />
            <span className="font-black text-white text-lg">+500,000 CAMLY</span>
          </motion.div>

          {/* Cute Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8"
          >
            <motion.img
              src={uploadGameHero}
              alt="Upload Game Hero"
              className="mx-auto max-w-full h-auto rounded-2xl shadow-xl"
              style={{ maxHeight: '300px' }}
              animate={{ 
                boxShadow: [
                  "0 10px 30px -10px rgba(139, 92, 246, 0.3)",
                  "0 20px 40px -10px rgba(236, 72, 153, 0.3)",
                  "0 10px 30px -10px rgba(139, 92, 246, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>

        {/* Lovable Publish Guide for Kids */}
        <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                How to Publish Your Game on Lovable ✨
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="text-center mb-6">
                <p className="text-lg text-muted-foreground">
                  Follow these simple steps to get your game link! 🎮
                </p>
              </div>
              
              {/* Step 1 */}
              <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center">1</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">📝 Create Your Game</h4>
                  <p className="text-muted-foreground text-sm">
                    Go to <span className="font-mono bg-muted px-2 py-0.5 rounded">lovable.dev</span> and tell the AI what game you want to build. Example: "Make me a fun puzzle game with colorful blocks!"
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-white font-bold flex items-center justify-center">2</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">🎨 Design & Test</h4>
                  <p className="text-muted-foreground text-sm">
                    Play your game in the preview window! If something doesn't work, just tell the AI: "Make the jump button bigger" or "Change the background to blue"
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 text-white font-bold flex items-center justify-center">3</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">🚀 Click "Publish"</h4>
                  <p className="text-muted-foreground text-sm">
                    Look for the <span className="font-bold text-green-500">"Publish"</span> button in the top-right corner. Click it! Your game will get a special link like: <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">your-game.lovable.app</span>
                  </p>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500 text-white font-bold flex items-center justify-center">4</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">📋 Copy Your Link</h4>
                  <p className="text-muted-foreground text-sm">
                    After publishing, copy the link from the address bar or the share button. Paste it here and earn <span className="font-black text-yellow-600">500,000 CAMLY!</span> 🎁
                  </p>
                </div>
              </div>
              
              {/* Tips Box */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-primary/20">
                <h4 className="font-bold flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Tips for Young Creators
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✨ Ask a parent or teacher for help if needed!</li>
                  <li>🎮 Make games that are fun and kind</li>
                  <li>🌟 Test your game before publishing</li>
                  <li>💝 Share with friends to get feedback</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Methods - Big beautiful boxes */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Help Button for Kids */}
          <div className="md:col-span-2 flex justify-center mb-2">
            <Button 
              variant="outline" 
              onClick={() => setShowGuideModal(true)}
              className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
            >
              <BookOpen className="w-4 h-4" />
              📚 New to Lovable? Learn how to publish your game!
            </Button>
          </div>

          {/* Deploy Link Box */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setUploadMethod("link")}
            className={`relative cursor-pointer rounded-3xl p-6 border-3 transition-all duration-300 ${
              uploadMethod === "link" 
                ? "border-primary bg-primary/10 shadow-xl shadow-primary/20" 
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <div className="absolute top-3 right-3">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                ⚡ FASTEST
              </Badge>
            </div>
            
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`p-4 rounded-2xl ${uploadMethod === "link" ? "bg-primary/20" : "bg-muted"}`}>
                <Link className={`w-12 h-12 ${uploadMethod === "link" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Paste Deploy Link</h3>
                <p className="text-sm text-muted-foreground">
                  Lovable, Vercel, Netlify, Glitch...
                </p>
              </div>
              {uploadMethod === "link" && (
                <CheckCircle className="w-6 h-6 text-primary" />
              )}
            </div>
          </motion.div>

          {/* ZIP Upload Box */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setUploadMethod("zip")}
            className={`relative cursor-pointer rounded-3xl p-6 border-3 transition-all duration-300 ${
              uploadMethod === "zip" 
                ? "border-secondary bg-secondary/10 shadow-xl shadow-secondary/20" 
                : "border-border hover:border-secondary/50 hover:bg-secondary/5"
            }`}
          >
            <div className="absolute top-3 right-3">
              <Badge variant="secondary">📦 CLASSIC</Badge>
            </div>
            
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`p-4 rounded-2xl ${uploadMethod === "zip" ? "bg-secondary/20" : "bg-muted"}`}>
                <FileArchive className={`w-12 h-12 ${uploadMethod === "zip" ? "text-secondary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Drag & Drop ZIP</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your dist/build folder
                </p>
              </div>
              {uploadMethod === "zip" && (
                <CheckCircle className="w-6 h-6 text-secondary" />
              )}
            </div>
          </motion.div>
        </div>

        {/* 30-second Guide Button */}
        <div className="flex justify-center mb-8">
          <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-full px-6">
                <Video className="w-4 h-4" />
                30-second Build Guide
                <Play className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  Quick Build Guide
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium">Deploy to Vercel in 30 seconds!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      1. Push your game to GitHub<br/>
                      2. Connect to Vercel (free)<br/>
                      3. Get your deploy link!
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted rounded-xl">
                    <span className="text-2xl">🚀</span>
                    <p className="text-sm mt-1">Vercel</p>
                  </div>
                  <div className="p-3 bg-muted rounded-xl">
                    <span className="text-2xl">💜</span>
                    <p className="text-sm mt-1">Lovable</p>
                  </div>
                  <div className="p-3 bg-muted rounded-xl">
                    <span className="text-2xl">🎸</span>
                    <p className="text-sm mt-1">Glitch</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upload Form - Shows when method is selected */}
        <AnimatePresence>
          {uploadMethod && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-6 bg-card rounded-3xl p-6 md:p-8 border shadow-xl"
            >
              {/* Deploy Link Input */}
              {uploadMethod === "link" && (
                <div className="space-y-3">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <Link className="w-5 h-5 text-primary" />
                    Deploy Link
                  </Label>
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder="https://my-game.vercel.app"
                      value={formData.deployUrl}
                      onChange={(e) => setFormData({ ...formData, deployUrl: e.target.value })}
                      className={`text-lg py-6 pr-12 rounded-xl ${urlValidated ? 'border-green-500 bg-green-500/5' : ''}`}
                    />
                    {urlValidated && (
                      <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-500" />
                    )}
                  </div>
                  
                  {/* Real-time iframe preview */}
                  {urlValidated && formData.deployUrl && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4"
                    >
                      <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Play className="w-4 h-4" /> Live Preview
                      </Label>
                      <div className="aspect-video rounded-xl overflow-hidden border-2 border-primary/30 bg-muted">
                        <iframe
                          src={formData.deployUrl}
                          className="w-full h-full"
                          title="Game Preview"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ZIP Drop Zone */}
              {uploadMethod === "zip" && (
                <div className="space-y-3">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <FileArchive className="w-5 h-5 text-secondary" />
                    Game ZIP File
                  </Label>
                  <div
                    onDragOver={handleGameDragOver}
                    onDragLeave={handleGameDragLeave}
                    onDrop={handleGameDrop}
                    className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDraggingGame 
                        ? 'border-secondary bg-secondary/10 scale-[1.02]' 
                        : gameFile 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-muted-foreground/30 hover:border-secondary/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setGameFile(file);
                          toast.success(`🎮 "${file.name}" ready!`);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {gameFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                        <p className="font-bold text-green-600">{gameFile.name}</p>
                        <p className="text-sm text-muted-foreground">Ready to upload!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <FileArchive className="w-12 h-12 text-muted-foreground" />
                        <p className="font-medium">Drag & drop your game ZIP here</p>
                        <p className="text-sm text-muted-foreground">or click to browse</p>
                      </div>
                    )}
                  </div>

                  {/* Diamond progress bar during upload */}
                  {loading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Diamond className="w-4 h-4 text-primary animate-pulse" />
                          Uploading...
                        </span>
                        <span className="font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                          style={{
                            backgroundSize: "200% 100%",
                            animation: "shimmer 2s linear infinite",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Diamond className="w-3 h-3 text-white drop-shadow" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Game Name */}
              <div className="space-y-3">
                <Label className="text-lg font-bold">🎮 Game Name</Label>
                <Input
                  placeholder="My Awesome Game"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-lg py-5 rounded-xl"
                  required
                />
              </div>

              {/* Description with AI Suggestion */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">📝 Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateDescription}
                    disabled={isGeneratingDesc}
                    className="gap-2 text-primary hover:text-primary"
                  >
                    {isGeneratingDesc ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    Angel AI Suggestion
                  </Button>
                </div>
                <Textarea
                  placeholder="Describe your amazing game..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="rounded-xl resize-none"
                  required
                />
              </div>

              {/* Age Rating */}
              <div className="space-y-3">
                <Label className="text-lg font-bold">👶 Age Rating</Label>
                <div className="grid grid-cols-4 gap-3">
                  {AGE_OPTIONS.map((age) => (
                    <button
                      key={age.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, ageAppropriate: age.value })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.ageAppropriate === age.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{age.emoji}</span>
                      <p className="text-sm font-medium mt-1">{age.value}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Checkboxes */}
              <div className="space-y-3">
                <Label className="text-lg font-bold">🏷️ Topics (select multiple)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TOPIC_OPTIONS.map((topic) => {
                    const Icon = topic.icon;
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                        <span className="text-sm font-medium">{topic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thumbnail */}
              <div className="space-y-3">
                <Label className="text-lg font-bold">🖼️ Thumbnail</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Paste image URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/thumbnail.png"
                      value={formData.thumbnailUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, thumbnailUrl: e.target.value });
                        setThumbnail(null);
                      }}
                      className="rounded-xl"
                    />
                  </div>
                  
                  {/* Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Or upload file</Label>
                    <div
                      onDragOver={handleThumbDragOver}
                      onDragLeave={handleThumbDragLeave}
                      onDrop={handleThumbDrop}
                      className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                        isDraggingThumb ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setThumbnail(file);
                            setFormData({ ...formData, thumbnailUrl: "" });
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Image className="w-6 h-6 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-1">Drag or click</p>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Preview */}
                {thumbnailPreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-40 h-24 rounded-xl overflow-hidden border-2 border-primary/30"
                  >
                    <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                  </motion.div>
                )}
              </div>

              {/* AI Safety Scan Status */}
              {scanning && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="font-medium">Angel AI scanning content...</span>
                </div>
              )}

              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border ${
                    scanResult.safe 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {scanResult.safe ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    <div>
                      <p className="font-bold">{scanResult.safe ? '✅ Content Approved!' : '❌ Content Flagged'}</p>
                      <p className="text-sm text-muted-foreground">{scanResult.reason}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Big Diamond Submit Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-4"
              >
                <Button
                  type="submit"
                  disabled={loading || scanning}
                  className="w-full py-8 text-xl font-black rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] hover:animate-shimmer shadow-2xl shadow-primary/30 border-2 border-white/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Diamond className="w-8 h-8" />
                      Upload & Claim 500K CAMLY Now!
                      <Sparkles className="w-6 h-6" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Upload Progress Overlay */}
              {loading && uploadProgress > 0 && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-card p-8 rounded-3xl shadow-2xl border max-w-md w-full mx-4 text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block mb-4"
                    >
                      <Diamond className="w-16 h-16 text-primary" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-4">Uploading Your Creation...</h3>
                    <div className="relative h-6 bg-muted rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                      />
                    </div>
                    <p className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {uploadProgress}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {uploadProgress < 50 ? "📤 Uploading files..." : 
                       uploadProgress < 80 ? "✨ Processing..." : 
                       "🎁 Claiming your reward..."}
                    </p>
                  </motion.div>
                </div>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        {/* Not selected state - Show prompt */}
        {!uploadMethod && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-muted-foreground"
          >
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Choose an upload method above to get started!</p>
          </motion.div>
        )}
      </div>

      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .hover\\:animate-shimmer:hover {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
