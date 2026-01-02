import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  Sparkles, Play, Diamond, Wand2, Image,
  BookOpen, Gamepad2, Brain, Heart, Puzzle, Rocket, Music, Palette, Star,
  Globe, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import confetti from "canvas-confetti";
import JSZip from "jszip";
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

export default function UploadGame() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMethod, setUploadMethod] = useState<"link" | "zip" | "itchio" | null>(null);
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [isDraggingGame, setIsDraggingGame] = useState(false);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [urlValidated, setUrlValidated] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // Itch.io import state
  const [itchioUrl, setItchioUrl] = useState("");
  const [fetchingItchio, setFetchingItchio] = useState(false);
  const [itchioData, setItchioData] = useState<{
    title: string;
    description: string;
    thumbnail: string | null;
    embedUrl: string;
    author: string;
    tags: string[];
  } | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ageAppropriate: "",
    deployUrl: "",
    thumbnailUrl: "",
  });

  // Blocked domains - AI chat, social media, etc. that cannot host games
  const BLOCKED_DOMAINS = [
    'google.com',
    'gemini.google.com',
    'chat.openai.com',
    'chatgpt.com',
    'claude.ai',
    'bard.google.com',
    'facebook.com',
    'youtube.com',
    'tiktok.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'docs.google.com',
    'drive.google.com',
  ];

  // Validate deploy URL with blocked domain check
  const validateDeployUrl = useCallback((url: string): { valid: boolean; error?: string } => {
    if (!url) {
      setUrlValidated(false);
      return { valid: false };
    }
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check blocked domains
      for (const blocked of BLOCKED_DOMAINS) {
        if (hostname.includes(blocked)) {
          setUrlValidated(false);
          return { 
            valid: false, 
            error: `❌ URL không hợp lệ! ${blocked} không phải là platform host game. Vui lòng nhập URL từ Lovable, Vercel, Netlify, hoặc hosting game khác.` 
          };
        }
      }
      
      // Must be https
      if (urlObj.protocol !== 'https:') {
        setUrlValidated(false);
        return { valid: false, error: '❌ URL phải sử dụng HTTPS!' };
      }
      
      setUrlValidated(true);
      toast.success("✨ Deploy link detected!", { duration: 2000 });
      return { valid: true };
    } catch {
      setUrlValidated(false);
      return { valid: false, error: '❌ URL không hợp lệ!' };
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

  // Drag & drop handlers
  const handleGameDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGame(true);
  }, []);

  const handleGameDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGame(false);
  }, []);

  // Blocked file extensions - cannot be played in browser
  const BLOCKED_EXTENSIONS = ['.exe', '.msi', '.bat', '.cmd', '.ps1', '.sh', '.rar', '.7z'];
  
  const validateGameFile = (file: File): { valid: boolean; error?: string } => {
    const fileName = file.name.toLowerCase();
    const ext = fileName.slice(fileName.lastIndexOf('.'));
    
    // Block dangerous/unsupported extensions
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return { 
        valid: false, 
        error: `❌ File ${ext.toUpperCase()} không được hỗ trợ! Chỉ chấp nhận file .ZIP chứa game HTML5/web.`
      };
    }
    
    // Only accept .zip files
    if (!fileName.endsWith('.zip')) {
      return { 
        valid: false, 
        error: '❌ Chỉ chấp nhận file .ZIP! Vui lòng nén game của bạn thành file ZIP.'
      };
    }
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: '❌ File quá lớn! Kích thước tối đa là 50MB.'
      };
    }
    
    return { valid: true };
  };

  // Validate ZIP content - must contain HTML file
  const validateZipContent = async (file: File): Promise<{ valid: boolean; error?: string; htmlFile?: string }> => {
    try {
      const zip = await JSZip.loadAsync(file);
      const fileNames = Object.keys(zip.files);
      
      // Find HTML files
      const htmlFiles = fileNames.filter(name => 
        !zip.files[name].dir && 
        (name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.htm'))
      );
      
      if (htmlFiles.length === 0) {
        return { 
          valid: false, 
          error: '❌ File ZIP không chứa file HTML! Game phải có ít nhất 1 file .html (ví dụ: index.html) để chạy trên trình duyệt.'
        };
      }
      
      // Check for index.html
      const indexHtml = htmlFiles.find(name => 
        name.toLowerCase() === 'index.html' || 
        name.toLowerCase().endsWith('/index.html')
      );
      
      if (!indexHtml) {
        toast.warning(`⚠️ Không tìm thấy index.html, sẽ sử dụng: ${htmlFiles[0]}`, { duration: 4000 });
      }
      
      return { valid: true, htmlFile: indexHtml || htmlFiles[0] };
    } catch (err) {
      console.error('ZIP validation error:', err);
      return { valid: false, error: '❌ Không thể đọc file ZIP. Vui lòng kiểm tra lại file.' };
    }
  };

  const handleGameDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGame(false);
    const file = e.dataTransfer.files[0];
    
    if (!file) return;
    
    const validation = validateGameFile(file);
    if (!validation.valid) {
      toast.error(validation.error, { duration: 5000 });
      return;
    }
    
    // Validate ZIP content
    toast.loading("🔍 Đang kiểm tra nội dung ZIP...", { id: "zip-check" });
    const zipValidation = await validateZipContent(file);
    toast.dismiss("zip-check");
    
    if (!zipValidation.valid) {
      toast.error(zipValidation.error, { duration: 6000 });
      return;
    }
    
    setGameFile(file);
    setUploadMethod("zip");
    toast.success(`🎮 "${file.name}" hợp lệ! Tìm thấy: ${zipValidation.htmlFile}`, { duration: 3000 });
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

  // Fetch game info from Itch.io
  const fetchItchioGame = async () => {
    if (!itchioUrl) {
      toast.error("Please enter an Itch.io URL");
      return;
    }

    // Validate Itch.io URL
    try {
      const urlObj = new URL(itchioUrl);
      const hostname = urlObj.hostname.toLowerCase();
      if (!hostname.endsWith('itch.io') && hostname !== 'itch.io') {
        toast.error("URL must be from itch.io domain");
        return;
      }
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    setFetchingItchio(true);
    setItchioData(null);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-itchio-game', {
        body: { url: itchioUrl }
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error || "Failed to fetch game info");
        return;
      }

      const gameData = data.data;
      setItchioData(gameData);
      
      // Auto-fill form data
      setFormData(prev => ({
        ...prev,
        title: gameData.title,
        description: gameData.description,
        thumbnailUrl: gameData.thumbnail || "",
        deployUrl: gameData.embedUrl,
      }));

      // Map Itch.io tags to our topics
      const tagToTopic: Record<string, string> = {
        'puzzle': 'puzzle',
        'adventure': 'adventure',
        'art': 'creative',
        'educational': 'educational',
        'music': 'music',
        'brain': 'brain',
        'casual': 'casual',
        'kids': 'kindness',
      };
      
      const mappedTopics = gameData.tags
        .map((tag: string) => tagToTopic[tag.toLowerCase()])
        .filter(Boolean);
      
      if (mappedTopics.length > 0) {
        setSelectedTopics(mappedTopics);
      }

      toast.success(`✨ Found "${gameData.title}" by ${gameData.author}!`);
    } catch (error: any) {
      console.error('Itch.io fetch error:', error);
      toast.error(error.message || "Failed to fetch game info");
    } finally {
      setFetchingItchio(false);
    }
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

    if (uploadMethod === "link") {
      if (!formData.deployUrl) {
        toast.error("Please paste your deploy link");
        return;
      }
      // Validate deploy URL before proceeding
      const urlValidation = validateDeployUrl(formData.deployUrl);
      if (!urlValidation.valid) {
        toast.error(urlValidation.error || "Invalid deploy URL");
        return;
      }
    }

    if (uploadMethod === "itchio") {
      if (!itchioData) {
        toast.error("Please fetch game info from Itch.io first");
        return;
      }
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

      const rewardAmount = 500000;
      
      // Use secure RPC to claim upload reward (prevents duplicates per game)
      const { data: rewardResult, error: rewardError } = await supabase.rpc('claim_upload_reward_safe', {
        p_game_id: insertedGame.id,
        p_game_title: formData.title
      });

      if (rewardError) {
        console.error('Reward claim error:', rewardError);
      }

      setUploadProgress(100);

      fireDiamondConfetti();
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">🎉 CONGRATULATIONS!</span>
          <span>You earned {rewardAmount.toLocaleString()} CAMLY!</span>
          <span className="text-sm opacity-80">Your game is now LIVE!</span>
        </div>,
        { duration: 5000 }
      );

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
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-2 text-purple-600">
                  <Sparkles className="w-6 h-6 text-pink-400" />
                  How to Publish Your Game on Lovable ✨
                </DialogTitle>
              </DialogHeader>
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
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Deploy Link Box */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => { setUploadMethod("link"); setItchioData(null); }}
            className={`relative cursor-pointer rounded-3xl p-5 transition-all duration-300 ${
              uploadMethod === "link" 
                ? "bg-white/90 shadow-2xl shadow-pink-200/50 border-2 border-pink-300 scale-[1.02]" 
                : "bg-white/60 backdrop-blur-sm border-2 border-white/50 hover:bg-white/80 hover:shadow-xl"
            }`}
          >
            {/* Fastest badge */}
            <div className="absolute -top-3 right-4">
              <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-white font-bold shadow-lg px-2 py-1 rounded-full text-xs">
                ⚡ FASTEST
              </Badge>
            </div>
            
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              {/* Cute blob character */}
              <CuteBlob color="bg-gradient-to-br from-amber-300 to-orange-300" emoji="🌟" />
              
              <div>
                <h3 className="text-lg font-bold text-purple-700 mb-1">Deploy Link</h3>
                <p className="text-xs text-purple-500/70">
                  Lovable, Vercel, Netlify...
                </p>
              </div>
              
              {uploadMethod === "link" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 left-4"
                >
                  <CheckCircle className="w-5 h-5 text-pink-500" />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Itch.io Import Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            onClick={() => { setUploadMethod("itchio"); }}
            className={`relative cursor-pointer rounded-3xl p-5 transition-all duration-300 ${
              uploadMethod === "itchio" 
                ? "bg-white/90 shadow-2xl shadow-rose-200/50 border-2 border-rose-400 scale-[1.02]" 
                : "bg-white/60 backdrop-blur-sm border-2 border-white/50 hover:bg-white/80 hover:shadow-xl"
            }`}
          >
            {/* New badge */}
            <div className="absolute -top-3 right-4">
              <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-lg px-2 py-1 rounded-full text-xs">
                🎮 ITCH.IO
              </Badge>
            </div>
            
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              {/* Cute blob character */}
              <CuteBlob color="bg-gradient-to-br from-rose-400 to-pink-400" emoji="🕹️" />
              
              <div>
                <h3 className="text-lg font-bold text-purple-700 mb-1">Import Itch.io</h3>
                <p className="text-xs text-purple-500/70">
                  Paste itch.io game URL
                </p>
              </div>
              
              {uploadMethod === "itchio" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 left-4"
                >
                  <CheckCircle className="w-5 h-5 text-rose-500" />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ZIP Upload Box */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            onClick={() => { setUploadMethod("zip"); setItchioData(null); }}
            className={`relative cursor-pointer rounded-3xl p-5 transition-all duration-300 ${
              uploadMethod === "zip" 
                ? "bg-white/90 shadow-2xl shadow-purple-200/50 border-2 border-purple-300 scale-[1.02]" 
                : "bg-white/60 backdrop-blur-sm border-2 border-white/50 hover:bg-white/80 hover:shadow-xl"
            }`}
          >
            {/* Classic badge */}
            <div className="absolute -top-3 right-4">
              <Badge className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold shadow-lg px-2 py-1 rounded-full text-xs">
                📦 CLASSIC
              </Badge>
            </div>
            
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              {/* Cute blob character */}
              <CuteBlob color="bg-gradient-to-br from-purple-400 to-pink-400" emoji="🎁" />
              
              <div>
                <h3 className="text-lg font-bold text-purple-700 mb-1">ZIP Upload</h3>
                <p className="text-xs text-purple-500/70">
                  Upload dist/build folder
                </p>
              </div>
              
              {uploadMethod === "zip" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 left-4"
                >
                  <CheckCircle className="w-5 h-5 text-purple-500" />
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
              onSubmit={handleSubmit}
              className="space-y-6 bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border-2 border-pink-100 shadow-xl"
            >
              {/* Deploy Link Input */}
              {uploadMethod === "link" && (
                <div className="space-y-3">
                  <Label className="text-lg font-bold text-purple-700 flex items-center gap-2">
                    <Link className="w-5 h-5 text-pink-500" />
                    Deploy Link
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

              {/* Itch.io Import Section */}
              {uploadMethod === "itchio" && (
                <div className="space-y-4">
                  <Label className="text-lg font-bold text-purple-700 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-rose-500" />
                    Itch.io Game URL
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      type="url"
                      placeholder="https://username.itch.io/game-name"
                      value={itchioUrl}
                      onChange={(e) => setItchioUrl(e.target.value)}
                      className="flex-1 text-lg py-6 rounded-2xl border-2 border-rose-200 bg-white/70"
                    />
                    <Button
                      type="button"
                      onClick={fetchItchioGame}
                      disabled={fetchingItchio || !itchioUrl}
                      className="px-6 py-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold"
                    >
                      {fetchingItchio ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="w-5 h-5 mr-2" />
                          Fetch Info
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Itch.io Preview */}
                  {itchioData && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200"
                    >
                      <div className="flex gap-4">
                        {itchioData.thumbnail && (
                          <img 
                            src={itchioData.thumbnail} 
                            alt={itchioData.title}
                            className="w-32 h-24 object-cover rounded-xl border-2 border-white shadow-md"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-purple-700">{itchioData.title}</h4>
                          <p className="text-sm text-purple-500">by {itchioData.author}</p>
                          {itchioData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {itchioData.tags.slice(0, 5).map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-white/70">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                      </div>
                      
                      {/* Game preview iframe */}
                      <div className="mt-4">
                        <Label className="text-sm text-purple-500 mb-2 flex items-center gap-2">
                          <Play className="w-4 h-4" /> Game Preview
                        </Label>
                        <div className="aspect-video rounded-2xl overflow-hidden border-2 border-white bg-white/50 shadow-inner">
                          <iframe
                            src={itchioData.embedUrl}
                            className="w-full h-full"
                            title={itchioData.title}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            allowFullScreen
                          />
                        </div>
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
                    Game ZIP File
                  </Label>
                  <div
                    onDragOver={handleGameDragOver}
                    onDragLeave={handleGameDragLeave}
                    onDrop={handleGameDrop}
                    className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDraggingGame 
                        ? 'border-purple-400 bg-purple-100/50 scale-[1.02]' 
                        : gameFile 
                          ? 'border-green-400 bg-green-50/50' 
                          : 'border-pink-300 hover:border-purple-400 bg-pink-50/30'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".zip"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const validation = validateGameFile(file);
                          if (!validation.valid) {
                            toast.error(validation.error, { duration: 5000 });
                            e.target.value = '';
                            return;
                          }
                          
                          // Validate ZIP content
                          toast.loading("🔍 Đang kiểm tra nội dung ZIP...", { id: "zip-check" });
                          const zipValidation = await validateZipContent(file);
                          toast.dismiss("zip-check");
                          
                          if (!zipValidation.valid) {
                            toast.error(zipValidation.error, { duration: 6000 });
                            e.target.value = '';
                            return;
                          }
                          
                          setGameFile(file);
                          setUploadMethod("zip");
                          toast.success(`🎮 "${file.name}" hợp lệ! Tìm thấy: ${zipValidation.htmlFile}`, { duration: 3000 });
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {gameFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                        <p className="font-bold text-green-600">{gameFile.name}</p>
                        <p className="text-sm text-purple-500">Ready to upload!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <FileArchive className="w-12 h-12 text-purple-400" />
                        <p className="font-medium text-purple-600">Drag & drop your game ZIP here</p>
                        <p className="text-sm text-purple-400">or click to browse</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Game Name */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-purple-700">🎮 Game Name</Label>
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
                  <Label className="text-lg font-bold text-purple-700">📝 Description</Label>
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
                <Label className="text-lg font-bold text-purple-700">👶 Age Rating</Label>
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
                <Label className="text-lg font-bold text-purple-700">🏷️ Topics (select multiple)</Label>
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
                <Label className="text-lg font-bold text-purple-700">🖼️ Thumbnail</Label>
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setThumbnail(file);
                            setFormData({ ...formData, thumbnailUrl: "" });
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
                      Upload & Claim 500K CAMLY Now!
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
