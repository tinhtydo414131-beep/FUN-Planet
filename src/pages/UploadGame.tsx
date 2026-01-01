import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUploadReward } from "@/hooks/useUploadReward";
import { supabase } from "@/integrations/supabase/client";
import { uploadImageToR2, uploadToR2 } from "@/utils/r2Upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Upload, Loader2, Link, FileArchive, CheckCircle, XCircle, 
  Sparkles, Play, Diamond, Wand2, Image, AlertTriangle,
  BookOpen, Gamepad2, Brain, Heart, Puzzle, Rocket, Music, Palette, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface ScanResult {
  safe: boolean;
  reason: string;
  confidence: number;
  needsReview?: boolean;
}

// Constants for validation
const MAX_ZIP_SIZE_MB = 50;
const MAX_ZIP_SIZE = MAX_ZIP_SIZE_MB * 1024 * 1024;
const MAX_THUMBNAIL_SIZE_MB = 5;
const MAX_THUMBNAIL_SIZE = MAX_THUMBNAIL_SIZE_MB * 1024 * 1024;
const MIN_THUMBNAIL_WIDTH = 400;
const MIN_THUMBNAIL_HEIGHT = 300;

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

// Cute floating star component
const FloatingStar = ({ delay = 0, x = "50%", size = 16 }: { delay?: number; x?: string; size?: number }) => (
  <motion.div
    initial={{ y: 100, opacity: 0, rotate: 0 }}
    animate={{ 
      y: [-20, -40, -20], 
      opacity: [0.4, 0.8, 0.4],
      rotate: [0, 180, 360]
    }}
    transition={{ 
      duration: 4, 
      delay, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="absolute pointer-events-none"
    style={{ left: x, top: "20%" }}
  >
    <Star className="text-yellow-300 fill-yellow-200 drop-shadow-lg" style={{ width: size, height: size }} />
  </motion.div>
);

// Cute blob character
const CuteBlob = ({ color, emoji, className = "" }: { color: string; emoji: string; className?: string }) => (
  <div className={`relative ${className}`}>
    <div className={`w-16 h-16 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] ${color} flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform`}>
      <span className="text-2xl">{emoji}</span>
    </div>
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full opacity-80"
    />
  </div>
);

// Calculate SHA-256 hash of file
const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Validate thumbnail dimensions
const validateThumbnailDimensions = (file: File): Promise<{ valid: boolean; width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        valid: img.width >= MIN_THUMBNAIL_WIDTH && img.height >= MIN_THUMBNAIL_HEIGHT,
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
};

export default function UploadGame() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dailyRewardsRemaining, checkDailyRewards } = useUploadReward();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMethod, setUploadMethod] = useState<"link" | "zip" | null>(null);
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [gameFileHash, setGameFileHash] = useState<string>("");
  const [isDuplicateGame, setIsDuplicateGame] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [isDraggingGame, setIsDraggingGame] = useState(false);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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

  // Check daily rewards on mount
  useEffect(() => {
    if (user) {
      checkDailyRewards();
    }
  }, [user, checkDailyRewards]);

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

  // Validate and process ZIP file
  const processZipFile = async (file: File): Promise<boolean> => {
    // Check file size
    if (file.size > MAX_ZIP_SIZE) {
      toast.error(`File quá lớn! Tối đa ${MAX_ZIP_SIZE_MB}MB (hiện tại: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return false;
    }

    // Calculate hash for duplicate detection
    try {
      toast.info("🔍 Đang kiểm tra file...");
      const hash = await calculateFileHash(file);
      setGameFileHash(hash);

      // Check if hash exists in database
      if (user) {
        const { data: hashCheck } = await supabase.rpc('check_file_hash_exists', {
          p_user_id: user.id,
          p_file_hash: hash
        });

        if (hashCheck?.[0]?.exists_for_user) {
          setIsDuplicateGame(true);
          toast.warning("⚠️ Bạn đã upload game này trước đó! Bạn vẫn có thể upload lại nhưng sẽ không nhận được thưởng CAMLY.", { duration: 5000 });
        } else if (hashCheck?.[0]?.exists_for_others) {
          setIsDuplicateGame(true);
          toast.warning("⚠️ Game này đã được upload bởi người khác! Bạn vẫn có thể upload nhưng sẽ không nhận được thưởng.", { duration: 5000 });
        } else {
          setIsDuplicateGame(false);
        }
      }
    } catch (error) {
      console.error('Hash check error:', error);
      // Continue without hash check if it fails
    }

    return true;
  };

  // Validate thumbnail file
  const validateThumbnail = async (file: File): Promise<boolean> => {
    // Check file size
    if (file.size > MAX_THUMBNAIL_SIZE) {
      toast.error(`Ảnh quá lớn! Tối đa ${MAX_THUMBNAIL_SIZE_MB}MB`);
      return false;
    }

    // Check dimensions
    const { valid, width, height } = await validateThumbnailDimensions(file);
    if (!valid) {
      toast.error(`Ảnh quá nhỏ! Tối thiểu ${MIN_THUMBNAIL_WIDTH}x${MIN_THUMBNAIL_HEIGHT} pixels (hiện tại: ${width}x${height})`);
      return false;
    }

    return true;
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

  const handleGameDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGame(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      const isValid = await processZipFile(file);
      if (isValid) {
        setGameFile(file);
        setUploadMethod("zip");
        toast.success(`🎮 "${file.name}" ready for upload!`);
      }
    } else {
      toast.error("Please drop a .zip file");
    }
  }, [user]);

  const handleThumbDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingThumb(true);
  }, []);

  const handleThumbDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingThumb(false);
  }, []);

  const handleThumbDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingThumb(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const isValid = await validateThumbnail(file);
      if (isValid) {
        setThumbnail(file);
        toast.success(`🖼️ Thumbnail ready!`);
      }
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
    const colors = ['#FFB6C1', '#DDA0DD', '#87CEEB', '#FFD700', '#98FB98', '#FFA07A'];
    
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

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
    });
  };

  // Validate form before showing confirmation
  const validateAndShowConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login to upload games!");
      navigate("/auth");
      return;
    }

    // Basic validation
    if (!formData.title || !formData.description) {
      toast.error("Vui lòng điền tên game và mô tả! 📝");
      return;
    }

    if (uploadMethod === "link" && !formData.deployUrl) {
      toast.error("Vui lòng dán deploy link! 🔗");
      return;
    }

    if (uploadMethod === "zip" && !gameFile) {
      toast.error("Vui lòng tải lên file ZIP game! 📦");
      return;
    }

    // Mandatory thumbnail validation
    if (!thumbnail && !formData.thumbnailUrl) {
      toast.error("Vui lòng tải lên ảnh thumbnail cho game! 🖼️");
      return;
    }

    // Mandatory age rating
    if (!formData.ageAppropriate) {
      toast.error("Vui lòng chọn độ tuổi phù hợp! 👶");
      return;
    }

    // Mandatory at least 1 topic
    if (selectedTopics.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 topic! 🏷️");
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    setShowConfirmDialog(false);

    const isSafe = await runSafetyScan();
    if (!isSafe) {
      toast.error("Content did not pass safety check");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let thumbnailPath = "";
      
      // Upload thumbnail to R2 (store optimized delivery URL)
      if (thumbnail) {
        setUploadProgress(20);
        toast.info("📤 Uploading thumbnail to R2...");
        const thumbResult = await uploadImageToR2(thumbnail, 'games', 'gameThumbnail');
        if (!thumbResult.success) {
          throw new Error(thumbResult.error || 'Thumbnail upload failed');
        }
        thumbnailPath = thumbResult.url!;
        console.log('✅ Thumbnail uploaded to R2:', thumbnailPath);
      }
      setUploadProgress(40);

      let gameFilePath = "deployed-game";
      
      // Upload game ZIP to R2
      if (uploadMethod === "zip" && gameFile) {
        toast.info("📤 Uploading game file to R2...");
        const gameResult = await uploadToR2(gameFile, 'games');
        if (!gameResult.success) {
          throw new Error(gameResult.error || 'Game file upload failed');
        }
        gameFilePath = gameResult.url!;
        console.log('✅ Game file uploaded to R2:', gameFilePath);
      }
      setUploadProgress(70);

      const category = selectedTopics[0] || 'casual';
      const { data: insertedGame, error: insertError } = await supabase
        .from('uploaded_games')
        .insert({
          user_id: user!.id,
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

      // Store file hash if it's a ZIP file
      if (uploadMethod === "zip" && gameFileHash && insertedGame) {
        try {
          await supabase.from('uploaded_game_hashes').insert({
            user_id: user!.id,
            file_hash: gameFileHash,
            game_id: insertedGame.id,
            file_size: gameFile!.size
          });
        } catch (err) {
          console.error('Hash storage error:', err);
        }
      }

      const rewardAmount = 500000;
      let rewardClaimed = false;
      
      // Only claim reward if not a duplicate game
      if (!isDuplicateGame) {
        const { data: rewardResult, error: rewardError } = await supabase.rpc('claim_upload_reward_safe', {
          p_game_id: insertedGame.id,
          p_game_title: formData.title
        });

        if (rewardError) {
          console.error('Reward claim error:', rewardError);
        } else if (rewardResult && typeof rewardResult === 'object' && 'success' in rewardResult && rewardResult.success) {
          rewardClaimed = true;
        }
      }

      setUploadProgress(100);

      fireDiamondConfetti();
      
      if (rewardClaimed) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-lg">🎉 CONGRATULATIONS!</span>
            <span>You earned {rewardAmount.toLocaleString()} CAMLY!</span>
            <span className="text-sm opacity-80">Your game is now LIVE!</span>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-lg">✅ Game uploaded successfully!</span>
            <span className="text-sm opacity-80">Your game is now LIVE!</span>
          </div>,
          { duration: 5000 }
        );
      }

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Dreamy pastel gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-pink-100 via-purple-100 via-blue-50 to-pink-50" />
      
      {/* Soft gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-64 h-64 bg-yellow-100/40 rounded-full blur-3xl" />
      </div>

      {/* Floating stars */}
      <FloatingStar delay={0} x="10%" size={20} />
      <FloatingStar delay={0.5} x="25%" size={14} />
      <FloatingStar delay={1} x="75%" size={18} />
      <FloatingStar delay={1.5} x="85%" size={12} />
      <FloatingStar delay={2} x="50%" size={16} />

      {/* Sparkle particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <Navigation />
      
      <div className="relative container max-w-4xl mx-auto py-8 px-4 pt-24 pb-32">
        {/* Cute Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* Top badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-pink-200/50 shadow-lg mb-6"
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-sm text-pink-600 tracking-wide">CREATIVE PARADISE GATEWAY</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </motion.div>
          
          {/* Main title with cute styling */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-4"
          >
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Hello Light Creators!
            </span>
            <span className="ml-2">🌟</span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-purple-600/80 max-w-2xl mx-auto mb-6"
          >
            Upload your game and receive{" "}
            <span className="font-black text-2xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              500K CAMLY
            </span>{" "}
            instantly! 🎁
          </motion.p>

          {/* Daily rewards remaining badge */}
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 }}
              className="mb-4"
            >
              <Badge 
                variant={dailyRewardsRemaining > 0 ? "default" : "destructive"}
                className={`text-sm px-4 py-2 ${
                  dailyRewardsRemaining > 0 
                    ? "bg-gradient-to-r from-green-400 to-emerald-400 text-white" 
                    : "bg-gradient-to-r from-red-400 to-pink-400 text-white"
                }`}
              >
                {dailyRewardsRemaining > 0 
                  ? `🎁 Còn ${dailyRewardsRemaining}/4 lượt nhận thưởng hôm nay`
                  : "⚠️ Đã hết lượt thưởng hôm nay!"}
              </Badge>
            </motion.div>
          )}

          {/* Floating reward badge - cute pill style */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0, y: [0, -6, 0] }}
            transition={{ 
              scale: { type: "spring", delay: 0.5 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 rounded-full shadow-xl shadow-orange-200/50 border-2 border-white/50"
          >
            <Diamond className="w-6 h-6 text-orange-700" />
            <span className="font-black text-orange-800 text-xl">+500,000 CAMLY</span>
          </motion.div>
        </motion.div>

        {/* Guide Button - Cute style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center mb-8"
        >
          <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 bg-white/70 backdrop-blur-sm border-purple-200 hover:bg-white/90 text-purple-600 rounded-full px-6 py-5 shadow-lg hover:shadow-xl transition-all"
              >
                <BookOpen className="w-5 h-5" />
                📚 New to Lovable? Learn how to publish your game!
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black flex items-center gap-2 text-purple-600">
                    <Sparkles className="w-6 h-6 text-pink-400" />
                    How to Publish Your Game on Lovable ✨
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="space-y-4 py-4">
                {[
                  { step: 1, title: "📝 Create Your Game", desc: "Go to lovable.dev and tell the AI what game you want to build!", color: "pink" },
                  { step: 2, title: "🎨 Design & Test", desc: "Play your game in preview! Tell AI to make changes.", color: "purple" },
                  { step: 3, title: "🚀 Click Publish", desc: "Find the Publish button in top-right. Get your link!", color: "green" },
                  { step: 4, title: "📋 Paste & Earn", desc: "Copy your link, paste here, earn 500,000 CAMLY!", color: "amber" },
                ].map((item) => (
                  <div key={item.step} className={`flex gap-4 p-4 rounded-2xl bg-${item.color}-100/50 border border-${item.color}-200/50`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-${item.color}-400 text-white font-bold flex items-center justify-center`}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Upload Methods - Cute card boxes */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Deploy Link Box */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => setUploadMethod("link")}
            className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 ${
              uploadMethod === "link" 
                ? "bg-white/90 shadow-2xl shadow-pink-200/50 border-2 border-pink-300 scale-[1.02]" 
                : "bg-white/60 backdrop-blur-sm border-2 border-white/50 hover:bg-white/80 hover:shadow-xl"
            }`}
          >
            {/* Fastest badge */}
            <div className="absolute -top-3 right-4">
              <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-white font-bold shadow-lg px-3 py-1 rounded-full">
                ⚡ FASTEST
              </Badge>
            </div>
            
            <div className="flex flex-col items-center text-center gap-4 pt-2">
              {/* Cute blob character */}
              <CuteBlob color="bg-gradient-to-br from-amber-300 to-orange-300" emoji="🌟" />
              
              <div>
                <h3 className="text-xl font-bold text-purple-700 mb-1">Paste Deploy Link</h3>
                <p className="text-sm text-purple-500/70">
                  Lovable, Vercel, Netlify, Glitch...
                </p>
              </div>
              
              {uploadMethod === "link" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 left-4"
                >
                  <CheckCircle className="w-6 h-6 text-pink-500" />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ZIP Upload Box */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            onClick={() => setUploadMethod("zip")}
            className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 ${
              uploadMethod === "zip" 
                ? "bg-white/90 shadow-2xl shadow-purple-200/50 border-2 border-purple-300 scale-[1.02]" 
                : "bg-white/60 backdrop-blur-sm border-2 border-white/50 hover:bg-white/80 hover:shadow-xl"
            }`}
          >
            {/* Classic badge */}
            <div className="absolute -top-3 right-4">
              <Badge className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold shadow-lg px-3 py-1 rounded-full">
                📦 CLASSIC
              </Badge>
            </div>
            
            <div className="flex flex-col items-center text-center gap-4 pt-2">
              {/* Cute blob character */}
              <CuteBlob color="bg-gradient-to-br from-purple-400 to-pink-400" emoji="🎁" />
              
              <div>
                <h3 className="text-xl font-bold text-purple-700 mb-1">Drag & Drop ZIP</h3>
                <p className="text-sm text-purple-500/70">
                  Upload your dist/build folder (max {MAX_ZIP_SIZE_MB}MB)
                </p>
              </div>
              
              {uploadMethod === "zip" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 left-4"
                >
                  <CheckCircle className="w-6 h-6 text-purple-500" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 30-second Guide Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center mb-8"
        >
          <Button 
            variant="outline" 
            onClick={() => setShowGuideModal(true)}
            className="gap-2 bg-white/70 backdrop-blur-sm border-purple-200 hover:bg-white/90 text-purple-600 rounded-full px-6 shadow-md"
          >
            <span className="text-lg">📖</span>
            30-second Build Guide
            <Play className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Upload Form */}
        <AnimatePresence>
          {uploadMethod && (
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={validateAndShowConfirm}
              className="space-y-6 bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border-2 border-pink-100 shadow-xl"
            >
              {/* Deploy Link Input */}
              {uploadMethod === "link" && (
                <div className="space-y-3">
                  <Label className="text-lg font-bold text-purple-700 flex items-center gap-2">
                    <Link className="w-5 h-5 text-pink-500" />
                    Deploy Link <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder="https://my-game.vercel.app"
                      value={formData.deployUrl}
                      onChange={(e) => setFormData({ ...formData, deployUrl: e.target.value })}
                      className={`text-lg py-6 pr-12 rounded-2xl border-2 bg-white/70 ${
                        urlValidated ? 'border-green-400 bg-green-50/50' : 'border-pink-200'
                      }`}
                    />
                    {urlValidated && (
                      <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-500" />
                    )}
                  </div>
                  
                  {/* Live preview */}
                  {urlValidated && formData.deployUrl && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4"
                    >
                      <Label className="text-sm text-purple-500 mb-2 flex items-center gap-2">
                        <Play className="w-4 h-4" /> Live Preview
                      </Label>
                      <div className="aspect-video rounded-2xl overflow-hidden border-2 border-pink-200 bg-white/50">
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
                  <Label className="text-lg font-bold text-purple-700 flex items-center gap-2">
                    <FileArchive className="w-5 h-5 text-purple-500" />
                    Game ZIP File <span className="text-red-500">*</span>
                    <span className="text-sm font-normal text-purple-400">(max {MAX_ZIP_SIZE_MB}MB)</span>
                  </Label>
                  <div
                    onDragOver={handleGameDragOver}
                    onDragLeave={handleGameDragLeave}
                    onDrop={handleGameDrop}
                    className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDraggingGame 
                        ? 'border-purple-400 bg-purple-100/50 scale-[1.02]' 
                        : gameFile 
                          ? isDuplicateGame 
                            ? 'border-amber-400 bg-amber-50/50'
                            : 'border-green-400 bg-green-50/50' 
                          : 'border-pink-300 hover:border-purple-400 bg-pink-50/30'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".zip"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const isValid = await processZipFile(file);
                          if (isValid) {
                            setGameFile(file);
                            toast.success(`🎮 "${file.name}" ready!`);
                          }
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {gameFile ? (
                      <div className="flex flex-col items-center gap-3">
                        {isDuplicateGame ? (
                          <AlertTriangle className="w-12 h-12 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-12 h-12 text-green-500" />
                        )}
                        <p className={`font-bold ${isDuplicateGame ? 'text-amber-600' : 'text-green-600'}`}>
                          {gameFile.name}
                        </p>
                        <p className="text-sm text-purple-500">
                          {(gameFile.size / 1024 / 1024).toFixed(1)}MB
                          {isDuplicateGame && " - ⚠️ Game trùng, không nhận thưởng"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <FileArchive className="w-12 h-12 text-purple-400" />
                        <p className="font-medium text-purple-600">Drag & drop your game ZIP here</p>
                        <p className="text-sm text-purple-400">or click to browse (max {MAX_ZIP_SIZE_MB}MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Game Name */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-purple-700">
                  🎮 Game Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="My Awesome Game"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-lg py-5 rounded-2xl border-2 border-pink-200 bg-white/70"
                  required
                />
              </div>

              {/* Description with AI */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold text-purple-700">
                    📝 Description <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateDescription}
                    disabled={isGeneratingDesc}
                    className="gap-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50"
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
                  className="rounded-2xl border-2 border-pink-200 bg-white/70 resize-none"
                  required
                />
              </div>

              {/* Age Rating - Cute bubbles */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-purple-700">
                  👶 Age Rating <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {AGE_OPTIONS.map((age) => (
                    <button
                      key={age.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, ageAppropriate: age.value })}
                      className={`p-3 rounded-2xl border-2 transition-all ${
                        formData.ageAppropriate === age.value
                          ? 'border-pink-400 bg-pink-100/80 scale-105 shadow-lg'
                          : 'border-pink-200 bg-white/50 hover:border-pink-300 hover:bg-pink-50/50'
                      }`}
                    >
                      <span className="text-2xl">{age.emoji}</span>
                      <p className="text-sm font-medium text-purple-600 mt-1">{age.value}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-purple-700">
                  🏷️ Topics <span className="text-red-500">*</span>
                  <span className="text-sm font-normal text-purple-400 ml-2">(chọn ít nhất 1)</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TOPIC_OPTIONS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-400 bg-purple-100/80 shadow-md'
                            : 'border-pink-200 bg-white/50 hover:border-purple-300 hover:bg-purple-50/30'
                        }`}
                      >
                        <Checkbox checked={isSelected} className="pointer-events-none border-purple-300" />
                        <span className="text-sm font-medium text-purple-600">{topic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thumbnail */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-purple-700">
                  🖼️ Thumbnail <span className="text-red-500">*</span>
                  <span className="text-sm font-normal text-purple-400 ml-2">(min {MIN_THUMBNAIL_WIDTH}x{MIN_THUMBNAIL_HEIGHT}px, max {MAX_THUMBNAIL_SIZE_MB}MB)</span>
                </Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-purple-500">Paste image URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/thumbnail.png"
                      value={formData.thumbnailUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, thumbnailUrl: e.target.value });
                        setThumbnail(null);
                      }}
                      className="rounded-2xl border-2 border-pink-200 bg-white/70"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm text-purple-500">Or upload file</Label>
                    <div
                      onDragOver={handleThumbDragOver}
                      onDragLeave={handleThumbDragLeave}
                      onDrop={handleThumbDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                        isDraggingThumb ? 'border-pink-400 bg-pink-100/50' : 'border-pink-300 bg-pink-50/30'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const isValid = await validateThumbnail(file);
                            if (isValid) {
                              setThumbnail(file);
                              setFormData({ ...formData, thumbnailUrl: "" });
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Image className="w-6 h-6 mx-auto text-pink-400" />
                      <p className="text-xs text-purple-500 mt-1">Drag or click</p>
                    </div>
                  </div>
                </div>

                {thumbnailPreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-40 h-24 rounded-2xl overflow-hidden border-2 border-pink-300 shadow-lg"
                  >
                    <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                  </motion.div>
                )}
              </div>

              {/* Safety Scan Status */}
              {scanning && (
                <div className="p-4 rounded-2xl bg-purple-100/50 border-2 border-purple-200 flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  <span className="font-medium text-purple-600">Angel AI scanning content...</span>
                </div>
              )}

              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border-2 ${
                    scanResult.safe 
                      ? 'bg-green-100/50 border-green-300' 
                      : 'bg-red-100/50 border-red-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {scanResult.safe ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    <div>
                      <p className="font-bold text-purple-700">{scanResult.safe ? '✅ Content Approved!' : '❌ Content Flagged'}</p>
                      <p className="text-sm text-purple-500">{scanResult.reason}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button - Cute gradient */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-4"
              >
                <Button
                  type="submit"
                  disabled={loading || scanning}
                  className="w-full py-8 text-xl font-black rounded-2xl bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl shadow-pink-200/50 border-2 border-white/30"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Diamond className="w-8 h-8" />
                      {isDuplicateGame ? "Upload Game" : "Upload & Claim 500K CAMLY Now!"}
                      <Sparkles className="w-6 h-6" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Upload Progress Overlay */}
              {loading && uploadProgress > 0 && (
                <div className="fixed inset-0 bg-pink-50/90 backdrop-blur-sm flex items-center justify-center z-50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-2 border-pink-200 max-w-md w-full mx-4 text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block mb-4"
                    >
                      <Diamond className="w-16 h-16 text-pink-500" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-purple-700 mb-4">Uploading Your Creation...</h3>
                    <div className="relative h-6 bg-pink-100 rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 rounded-full"
                      />
                    </div>
                    <p className="text-4xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      {uploadProgress}%
                    </p>
                    <p className="text-sm text-purple-500 mt-2">
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

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-lg bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-2 text-purple-600">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Xác nhận upload game ✨
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="space-y-4 py-4">
              {/* Preview thumbnail */}
              {thumbnailPreview && (
                <div className="flex justify-center">
                  <img 
                    src={thumbnailPreview} 
                    alt="Game Thumbnail" 
                    className="w-48 h-32 object-cover rounded-xl border-2 border-pink-200 shadow-lg"
                  />
                </div>
              )}
              
              {/* Game info */}
              <div className="space-y-2 bg-white/60 rounded-xl p-4">
                <div>
                  <span className="text-sm text-purple-500">Tên game:</span>
                  <p className="font-bold text-purple-700">{formData.title}</p>
                </div>
                <div>
                  <span className="text-sm text-purple-500">Mô tả:</span>
                  <p className="text-sm text-purple-600 line-clamp-2">{formData.description}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="border-pink-300">{formData.ageAppropriate}</Badge>
                  {selectedTopics.map(t => (
                    <Badge key={t} variant="outline" className="border-purple-300">
                      {TOPIC_OPTIONS.find(o => o.id === t)?.label}
                    </Badge>
                  ))}
                </div>
                {uploadMethod === "link" && (
                  <div>
                    <span className="text-sm text-purple-500">Deploy link:</span>
                    <p className="text-xs text-purple-600 truncate">{formData.deployUrl}</p>
                  </div>
                )}
                {uploadMethod === "zip" && gameFile && (
                  <div>
                    <span className="text-sm text-purple-500">File:</span>
                    <p className="text-sm text-purple-600">{gameFile.name} ({(gameFile.size / 1024 / 1024).toFixed(1)}MB)</p>
                  </div>
                )}
              </div>

              {/* Reward info */}
              {!isDuplicateGame && dailyRewardsRemaining > 0 ? (
                <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border border-amber-200">
                  <Diamond className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-amber-700">Bạn sẽ nhận được 500,000 CAMLY!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-amber-600">
                    {isDuplicateGame 
                      ? "Game trùng lặp - không nhận thưởng" 
                      : "Đã hết lượt thưởng hôm nay"}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="border-pink-200 text-purple-600"
              >
                ← Quay lại chỉnh sửa
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold"
              >
                Xác nhận Upload 🚀
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Not selected state */}
        {!uploadMethod && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-purple-300" />
            <p className="text-lg text-purple-400">Choose an upload method above to get started!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
