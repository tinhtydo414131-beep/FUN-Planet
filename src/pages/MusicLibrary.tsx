import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Music, Trash2, Download, Coins, AlertTriangle, CheckCircle2, Info, Clock, Star, Sparkles, Play, Pause, Globe, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  validateMusicUpload, 
  formatCoins, 
  ValidationResponse,
  ValidationCodeIcons 
} from "@/utils/musicUploadValidation";
import { uploadToR2, deleteFromR2 } from "@/utils/r2Upload";

interface MusicFile {
  id: string;
  title: string;
  artist: string | null;
  storage_path: string;
  file_size: number | null;
  duration: string | null;
  created_at: string;
  pending_approval?: boolean;
  parent_approved?: boolean;
}

interface CommunityTrack {
  id: string;
  title: string;
  artist: string | null;
  storage_path: string;
  file_size: number | null;
  duration: string | null;
  created_at: string;
  uploader_name?: string;
}

// ===== CẤU HÌNH HIỂN THỊ =====
const CONFIG = {
  MAX_DAILY_REWARDS: 4,
  REWARD_AMOUNT: 20000,
};

export default function MusicLibrary() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [searchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyInfo, setDailyInfo] = useState<{
    rewardsUsed: number;
    rewardsRemaining: number;
    maxDaily: number;
  } | null>(null);
  const [lastValidation, setLastValidation] = useState<ValidationResponse | null>(null);
  const [activeTab, setActiveTab] = useState("my-music");
  const [communityMusic, setCommunityMusic] = useState<CommunityTrack[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<MusicFile | null>(null);

  // Handle URL query param for tab deep-linking
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'community') {
      setActiveTab('community');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadDailyInfo();
      loadMusicFiles();
    }
    loadCommunityMusic();
  }, [user]);

  const loadDailyInfo = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('daily_upload_rewards')
        .select('reward_count')
        .eq('user_id', user.id)
        .eq('reward_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading daily info:', error);
        return;
      }

      const rewardsUsed = data?.reward_count || 0;
      setDailyInfo({
        rewardsUsed,
        rewardsRemaining: CONFIG.MAX_DAILY_REWARDS - rewardsUsed,
        maxDaily: CONFIG.MAX_DAILY_REWARDS
      });
    } catch (error) {
      console.error('Error loading daily info:', error);
    }
  };

  const loadMusicFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_music')
        .select('id, title, artist, storage_path, file_size, duration, created_at, pending_approval, parent_approved')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setMusicFiles(data || []);
    } catch (error) {
      console.error('Error loading music files:', error);
      toast.error("Không thể tải danh sách nhạc");
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityMusic = async () => {
    setLoadingCommunity(true);
    setCommunityError(null);
    try {
      // Step 1: Fetch approved music
      const { data: musicData, error } = await supabase
        .from('user_music')
        .select('id, title, artist, storage_path, file_size, duration, created_at, user_id')
        .eq('parent_approved', true)
        .eq('pending_approval', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching community music:', error);
        setCommunityError(`Không thể tải nhạc: ${error.message}`);
        setCommunityMusic([]);
        setLoadingCommunity(false);
        return;
      }
      
      if (!musicData || musicData.length === 0) {
        setCommunityMusic([]);
        setLoadingCommunity(false);
        return;
      }

      // Step 2: Fetch usernames for uploaders (don't fail if this fails)
      let profileMap = new Map<string, string>();
      try {
        const userIds = [...new Set(musicData.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
        profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);
      } catch (profileError) {
        console.warn('Could not fetch profile names:', profileError);
      }

      const tracks: CommunityTrack[] = musicData.map(item => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        storage_path: item.storage_path,
        file_size: item.file_size,
        duration: item.duration,
        created_at: item.created_at,
        uploader_name: profileMap.get(item.user_id) || 'Unknown'
      }));

      setCommunityMusic(tracks);
    } catch (error) {
      console.error('Error loading community music:', error);
      setCommunityError('Đã xảy ra lỗi khi tải nhạc cộng đồng');
      setCommunityMusic([]);
    } finally {
      setLoadingCommunity(false);
    }
  };

  const handlePlayCommunity = (track: CommunityTrack) => {
    if (currentlyPlaying === track.id) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.storage_path);
      audioRef.current.play().catch(() => {
        toast.error("Không thể phát nhạc");
      });
      audioRef.current.onended = () => setCurrentlyPlaying(null);
      setCurrentlyPlaying(track.id);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    event.target.value = '';

    const supportedTypes = [
      'audio/mpeg', 'audio/mp3',
      'audio/mp4', 'audio/m4a', 'audio/x-m4a',
      'audio/wav', 'audio/x-wav', 'audio/wave',
      'audio/ogg', 'audio/vorbis',
      'audio/flac', 'audio/x-flac'
    ];
    
    const supportedExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac'];
    
    const isValidType = supportedTypes.some(type => file.type.includes(type));
    const isValidExtension = supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType && !isValidExtension) {
      toast.error("Chỉ chấp nhận file MP3, M4A, WAV, OGG, hoặc FLAC");
      return;
    }

    setValidating(true);
    setLastValidation(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Phiên đăng nhập không hợp lệ");
        setValidating(false);
        return;
      }

      toast.info("🔍 Đang kiểm tra file...");
      
      const validation = await validateMusicUpload(file, session.access_token);
      setLastValidation(validation);
      
      if (validation.dailyInfo) {
        setDailyInfo(validation.dailyInfo);
      }

      if (!validation.canUpload) {
        toast.error(validation.message);
        setValidating(false);
        return;
      }

      setValidating(false);
      setUploading(true);

      toast.info("📤 Đang tải lên...");
      
      const uploadResult = await uploadToR2(file, 'music');

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Save with pending_approval = true (admin must approve)
      const { error: dbError } = await supabase
        .from('user_music')
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: null,
          storage_path: uploadResult.url!,
          file_size: file.size,
          duration: null,
          parent_approved: false,  // Requires admin approval
          pending_approval: true   // Pending review
        });

      if (dbError) {
        console.error('Error saving to database:', dbError);
        toast.warning("File đã tải lên nhưng không thể lưu vào database");
      }

      // Updated message - no instant reward
      toast.success("🎵 Đã tải nhạc lên! Nhạc của bạn đang chờ Admin duyệt.", {
        duration: 5000,
        icon: '⏳'
      });

      loadMusicFiles();
      loadDailyInfo();

    } catch (error) {
      console.error('Error uploading music:', error);
      toast.error("Không thể tải nhạc lên. Vui lòng thử lại.");
    } finally {
      setValidating(false);
      setUploading(false);
    }
  };

  const openDeleteDialog = (file: MusicFile) => {
    setTrackToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!trackToDelete) return;
    
    setDeleteDialogOpen(false);
    const { id, storage_path: storagePath, title } = trackToDelete;

    try {
      const { error } = await supabase
        .from('user_music')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (storagePath.includes('r2.dev') || storagePath.includes('cloudflare')) {
        const key = storagePath.split('/').slice(-2).join('/');
        try {
          await deleteFromR2(key);
        } catch (r2Error) {
          console.warn('Could not delete from R2:', r2Error);
        }
      }

      toast.success(`Đã xóa "${title}"`);
      loadMusicFiles();
    } catch (error) {
      console.error('Error deleting music:', error);
      toast.error("Không thể xóa file nhạc");
    } finally {
      setTrackToDelete(null);
    }
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return '--:--';
    const seconds = parseFloat(duration);
    if (isNaN(seconds)) return duration;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '--';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (file: MusicFile) => {
    if (file.pending_approval) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Chờ duyệt
        </Badge>
      );
    }
    if (file.parent_approved) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Đã duyệt
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/30 to-blue-50/30">
      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-32 sm:pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-fredoka font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                🎵 Thư Viện Nhạc
              </span>
            </h1>
            <p className="text-lg text-gray-600 font-comic">
              Tải lên và quản lý các file nhạc của bạn
            </p>
          </div>

          {/* Daily Rewards Info */}
          {user && dailyInfo && (
            <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-fredoka text-lg text-gray-800">Thưởng Hôm Nay</span>
                  </div>
                  <span className="font-bold text-lg bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                    {dailyInfo.rewardsUsed}/{dailyInfo.maxDaily} bài
                  </span>
                </div>
                
                <Progress 
                  value={(dailyInfo.rewardsUsed / dailyInfo.maxDaily) * 100} 
                  className="h-3 mb-2"
                />
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {dailyInfo.rewardsRemaining > 0 
                      ? `Còn ${dailyInfo.rewardsRemaining} lần nhận ${formatCoins(CONFIG.REWARD_AMOUNT)} coins`
                      : '🎯 Đã đạt giới hạn hôm nay!'
                    }
                  </span>
                  <span className="font-semibold bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                    +{formatCoins(CONFIG.REWARD_AMOUNT)} coins/bài
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Validation Result */}
          {lastValidation && !lastValidation.success && (
            <Alert 
              variant={lastValidation.canUpload ? "default" : "destructive"} 
              className="mb-6 bg-white border-gray-200"
            >
              {lastValidation.canUpload ? (
                <Info className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle className="text-gray-800">
                {ValidationCodeIcons[lastValidation.code] || '⚠️'} Thông báo
              </AlertTitle>
              <AlertDescription className="text-gray-600">
                {lastValidation.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Section */}
          <Card className="mb-8 bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-fredoka text-2xl flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-500">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
                  Tải Nhạc Lên
                </span>
                {dailyInfo && dailyInfo.rewardsRemaining > 0 && (
                  <Badge className="ml-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-0">
                    +{formatCoins(CONFIG.REWARD_AMOUNT)} 🪙
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-gray-600">
                Upload nhạc để nhận thưởng Camly coins! (Tối đa {CONFIG.MAX_DAILY_REWARDS} bài/ngày)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="music-upload" className="cursor-pointer">
                    <div className={`
                      border-2 border-dashed rounded-2xl p-8 text-center transition-all
                      ${validating || uploading 
                        ? 'border-gray-300 cursor-not-allowed opacity-60 bg-gray-50' 
                        : 'border-pink-300 hover:border-pink-500 hover:bg-pink-50/50'
                      }
                    `}>
                      {validating ? (
                        <>
                          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
                          <p className="font-fredoka text-lg mb-2 text-gray-800">
                            Đang kiểm tra file...
                          </p>
                          <p className="text-sm text-gray-500">
                            Xác minh hash & metadata chống trùng lặp
                          </p>
                        </>
                      ) : uploading ? (
                        <>
                          <div className="animate-pulse">
                            <Upload className="w-12 h-12 mx-auto mb-4 text-pink-500" />
                          </div>
                          <p className="font-fredoka text-lg mb-2 text-gray-800">
                            Đang tải lên...
                          </p>
                        </>
                      ) : (
                        <>
                          <Music className="w-12 h-12 mx-auto mb-4 text-pink-500" />
                          <p className="font-fredoka text-lg mb-2 text-gray-800">
                            Nhấp để chọn file nhạc
                          </p>
                          <p className="text-sm text-gray-500">
                            MP3, M4A, WAV, OGG, FLAC (Tối đa 50MB)
                          </p>
                        </>
                      )}
                    </div>
                  </Label>
                  <Input
                    id="music-upload"
                    type="file"
                    accept=".mp3,.m4a,.wav,.ogg,.flac,audio/mpeg,audio/mp4,audio/m4a,audio/wav,audio/ogg,audio/flac"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading || validating || !user}
                  />
                </div>
                
                {!user && (
                  <p className="text-center text-sm text-gray-500">
                    Vui lòng đăng nhập để tải nhạc lên và nhận thưởng
                  </p>
                )}

                {/* Info boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-xl p-4 border border-yellow-200">
                    <p className="font-semibold text-sm flex items-center gap-2 text-yellow-700 mb-2">
                      <Clock className="w-4 h-4" />
                      Quy trình duyệt
                    </p>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      <li>• Upload → Chờ Admin duyệt</li>
                      <li>• Duyệt → Nhận thưởng + Hiển thị public</li>
                      <li>• Thời gian duyệt: 1-24 giờ</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
                    <p className="font-semibold text-sm flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Chống abuse
                    </p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• Kiểm tra SHA-256 hash</li>
                      <li>• Giới hạn {CONFIG.MAX_DAILY_REWARDS} bài/ngày</li>
                      <li>• Phân tích metadata</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for My Music / Community */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white border border-gray-200 p-1.5 mb-4 flex flex-col sm:flex-row gap-2 sm:gap-0 h-auto sm:h-10 relative z-10">
              <TabsTrigger 
                value="my-music" 
                className="flex-1 py-3 sm:py-1.5 text-base sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <span className="inline-flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Nhạc Của Bạn ({musicFiles.length})
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="community" 
                className="flex-1 py-3 sm:py-1.5 text-base sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                <span className="inline-flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Nhạc Cộng Đồng ({communityMusic.length})
                </span>
              </TabsTrigger>
            </TabsList>

            {/* My Music Tab */}
            <TabsContent value="my-music">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-fredoka text-2xl flex items-center gap-2">
                    <div className="p-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-500">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
                      Nhạc Của Bạn
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    <Button
                      onClick={loadMusicFiles}
                      variant="outline"
                      size="sm"
                      disabled={loading || !user}
                      className="mt-2 border-gray-300 hover:bg-gray-50"
                    >
                      {loading ? "Đang tải..." : "Làm mới danh sách"}
                    </Button>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {!user ? (
                      <div className="text-center py-12">
                        <Music className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="font-comic text-gray-500">
                          Đăng nhập để xem nhạc của bạn
                        </p>
                      </div>
                    ) : musicFiles.length === 0 ? (
                      <div className="text-center py-12">
                        <Music className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="font-comic text-gray-500">
                          Chưa có nhạc nào. Tải lên file đầu tiên nhé!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {musicFiles.map((file) => (
                          <div
                            key={file.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all gap-3 ${
                              file.pending_approval 
                                ? 'bg-yellow-50 border border-yellow-200' 
                                : 'bg-white border border-gray-200 hover:border-pink-200 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-full shrink-0 ${
                                file.pending_approval 
                                  ? 'bg-yellow-200' 
                                  : 'bg-gradient-to-r from-pink-400 to-pink-500'
                              }`}>
                                <Music className={`w-4 h-4 ${file.pending_approval ? 'text-yellow-700' : 'text-white'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-fredoka font-bold truncate text-gray-800">
                                    {file.title}
                                  </p>
                                  {getStatusBadge(file)}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {file.artist || 'Unknown Artist'} • {formatDuration(file.duration)} • {formatFileSize(file.file_size)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(file.created_at).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            
                            {/* Audio Player */}
                            <audio 
                              controls 
                              className="h-8 w-full sm:w-32 md:w-48"
                              src={file.storage_path}
                            />
                            
                            <div className="flex items-center gap-2 shrink-0 justify-end">
                              <a
                                href={file.storage_path}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="border-gray-300 hover:bg-pink-50 hover:border-pink-300"
                                >
                                  <Download className="w-4 h-4 text-pink-500" />
                                </Button>
                              </a>
                              
                              {isAdmin && (
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => openDeleteDialog(file)}
                                  className="border-red-200 hover:bg-red-50 text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Community Music Tab */}
            <TabsContent value="community">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-fredoka text-2xl flex items-center gap-2">
                    <div className="p-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
                      Nhạc Cộng Đồng
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Tất cả nhạc đã được duyệt từ cộng đồng Fun Planet
                    <Button
                      onClick={loadCommunityMusic}
                      variant="outline"
                      size="sm"
                      disabled={loadingCommunity}
                      className="ml-4 border-gray-300 hover:bg-gray-50"
                    >
                      {loadingCommunity ? "Đang tải..." : "Làm mới"}
                    </Button>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] sm:h-[500px] pb-20 sm:pb-0">
                    {loadingCommunity ? (
                      <div className="text-center py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="font-comic text-gray-500">
                          Đang tải nhạc cộng đồng...
                        </p>
                      </div>
                    ) : communityError ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <p className="font-comic text-red-500 mb-2">Lỗi tải nhạc</p>
                        <p className="text-sm text-gray-500 mb-4">{communityError}</p>
                        <Button 
                          onClick={loadCommunityMusic} 
                          variant="outline" 
                          className="border-red-300 hover:bg-red-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Thử lại
                        </Button>
                      </div>
                    ) : communityMusic.length === 0 ? (
                      <div className="text-center py-12">
                        <Globe className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                        <p className="font-comic text-gray-500 mb-4">
                          Chưa có nhạc nào trong thư viện cộng đồng
                        </p>
                        <Button 
                          onClick={loadCommunityMusic} 
                          variant="outline" 
                          className="border-blue-300 hover:bg-blue-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Thử tải lại
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {communityMusic.map((track) => (
                          <div
                            key={track.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all gap-3 bg-gradient-to-r from-blue-50/50 to-pink-50/50 border border-blue-200 hover:border-blue-300 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Play/Pause Button */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handlePlayCommunity(track)}
                                className={`shrink-0 w-10 h-10 rounded-full ${
                                  currentlyPlaying === track.id 
                                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white' 
                                    : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600'
                                }`}
                              >
                                {currentlyPlaying === track.id ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5" />
                                )}
                              </Button>
                              
                              <div className="min-w-0 flex-1">
                                <p className="font-fredoka font-bold truncate text-gray-800">
                                  {track.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {track.artist || 'Unknown Artist'} • {formatDuration(track.duration)} • {formatFileSize(track.file_size)}
                                </p>
                                <p className="text-xs text-blue-500 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {track.uploader_name}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0 justify-end">
                              <a
                                href={track.storage_path}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <Download className="w-4 h-4 text-blue-500" />
                                </Button>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhạc</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa "{trackToDelete?.title}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
