import { useState, useEffect, useRef, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Music2, 
  Search, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  RefreshCw,
  Clock,
  User,
  Loader2
} from "lucide-react";
import { deleteFromR2 } from "@/utils/r2Upload";

interface MusicTrack {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  storage_path: string;
  file_size: number | null;
  duration: string | null;
  genre: string | null;
  parent_approved: boolean;
  pending_approval: boolean;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

interface AdminMusicTabProps {
  onStatsUpdate?: () => void;
}

const UPLOAD_REWARD = 20000; // 20k CAMLY per song

const AdminMusicTab = forwardRef<HTMLDivElement, AdminMusicTabProps>(({ onStatsUpdate }, ref) => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<MusicTrack | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [trackToReject, setTrackToReject] = useState<MusicTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadTracks();
  }, [filter]);

  const loadTracks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("user_music")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter === "pending") {
        query = query.eq("pending_approval", true);
      } else if (filter === "approved") {
        query = query.eq("parent_approved", true).eq("pending_approval", false);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch usernames for each track
      const userIds = [...new Set(data?.map(t => t.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const enrichedTracks = (data || []).map(track => ({
        ...track,
        username: profileMap.get(track.user_id)?.username || "Unknown",
        avatar_url: profileMap.get(track.user_id)?.avatar_url
      }));

      setTracks(enrichedTracks);
    } catch (error) {
      console.error("Error loading tracks:", error);
      toast.error("Không thể tải danh sách nhạc");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = (track: MusicTrack) => {
    if (currentlyPlaying === track.id) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.storage_path);
      audioRef.current.play();
      audioRef.current.onended = () => setCurrentlyPlaying(null);
      setCurrentlyPlaying(track.id);
    }
  };

  const handleApprove = async (track: MusicTrack) => {
    setProcessingId(track.id);
    try {
      // 1. Update status
      const { error: updateError } = await supabase
        .from("user_music")
        .update({
          parent_approved: true,
          pending_approval: false
        })
        .eq("id", track.id);

      if (updateError) throw updateError;

      // 2. Grant reward to uploader
      const { error: rpcError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: track.user_id,
        p_amount: UPLOAD_REWARD,
        p_operation: 'add'
      });

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        // Continue even if RPC fails - we'll record the transaction
      }

      // 3. Record transaction
      await supabase.from("camly_coin_transactions").insert({
        user_id: track.user_id,
        amount: UPLOAD_REWARD,
        transaction_type: "music_upload_reward",
        description: `Phần thưởng tải nhạc (Admin duyệt): ${track.title}`
      });

      // 4. Send notification to user
      await supabase.from("user_notifications").insert({
        user_id: track.user_id,
        notification_type: "music_approved",
        title: "Nhạc đã được duyệt! 🎵",
        message: `"${track.title}" đã được duyệt và nhận ${UPLOAD_REWARD.toLocaleString()} CAMLY!`,
        data: { track_id: track.id, reward: UPLOAD_REWARD }
      });

      toast.success(`Đã duyệt "${track.title}" và thưởng ${UPLOAD_REWARD.toLocaleString()} CAMLY!`);
      loadTracks();
      onStatsUpdate?.();
    } catch (error) {
      console.error("Error approving track:", error);
      toast.error("Không thể duyệt nhạc");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (track: MusicTrack) => {
    setTrackToReject(track);
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!trackToReject) return;
    
    setRejectDialogOpen(false);
    setProcessingId(trackToReject.id);
    
    try {
      // Delete from database
      const { error } = await supabase
        .from("user_music")
        .delete()
        .eq("id", trackToReject.id);

      if (error) throw error;

      // Try to delete from R2
      if (trackToReject.storage_path.includes("r2.dev") || trackToReject.storage_path.includes("cloudflare")) {
        const key = trackToReject.storage_path.split("/").slice(-2).join("/");
        try {
          await deleteFromR2(key);
        } catch (r2Error) {
          console.warn("Could not delete from R2:", r2Error);
        }
      }

      // Send rejection notification
      await supabase.from("user_notifications").insert({
        user_id: trackToReject.user_id,
        notification_type: "music_rejected",
        title: "Nhạc không được duyệt 😔",
        message: `"${trackToReject.title}" không đạt tiêu chuẩn. Vui lòng thử lại với file khác.`
      });

      toast.success(`Đã từ chối "${trackToReject.title}"`);
      loadTracks();
    } catch (error) {
      console.error("Error rejecting track:", error);
      toast.error("Không thể từ chối nhạc");
    } finally {
      setProcessingId(null);
      setTrackToReject(null);
    }
  };

  const openDeleteDialog = (track: MusicTrack, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setTrackToDelete(track);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!trackToDelete) return;
    
    setDeleteDialogOpen(false);
    setProcessingId(trackToDelete.id);
    
    try {
      const { error } = await supabase
        .from("user_music")
        .delete()
        .eq("id", trackToDelete.id);

      if (error) throw error;

      // Try to delete from R2
      if (trackToDelete.storage_path.includes("r2.dev") || trackToDelete.storage_path.includes("cloudflare")) {
        const key = trackToDelete.storage_path.split("/").slice(-2).join("/");
        try {
          await deleteFromR2(key);
        } catch (r2Error) {
          console.warn("Could not delete from R2:", r2Error);
        }
      }

      toast.success(`Đã xóa "${trackToDelete.title}"`);
      loadTracks();
    } catch (error) {
      console.error("Error deleting track:", error);
      toast.error("Không thể xóa nhạc");
    } finally {
      setProcessingId(null);
      setTrackToDelete(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "--";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return "--:--";
    const seconds = parseFloat(duration);
    if (isNaN(seconds)) return duration;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredTracks = tracks.filter(track => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query) ||
      track.username?.toLowerCase().includes(query)
    );
  });

  const pendingCount = tracks.filter(t => t.pending_approval).length;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-quicksand flex items-center gap-2">
              <Music2 className="w-6 h-6 text-pink-500" />
              <span className="bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                Quản Lý Nhạc
              </span>
              {pendingCount > 0 && (
                <Badge className="bg-pink-500 text-white">{pendingCount} pending</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Duyệt, từ chối và quản lý nhạc upload từ cộng đồng
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadTracks}
            disabled={loading}
            className="border-gray-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-1">
            <TabsList className="bg-gray-100 border border-gray-200">
              <TabsTrigger 
                value="pending"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4 mr-1" />
                Chờ duyệt ({tracks.filter(t => t.pending_approval).length})
              </TabsTrigger>
              <TabsTrigger 
                value="approved"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-green-500 data-[state=active]:text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Đã duyệt
              </TabsTrigger>
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                Tất cả
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên, artist, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 min-w-[200px]"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Preview</TableHead>
                  <TableHead className="text-gray-600">Title / Artist</TableHead>
                  <TableHead className="text-gray-600">User</TableHead>
                  <TableHead className="text-gray-600">Size / Duration</TableHead>
                  <TableHead className="text-gray-600">Ngày upload</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" />
                    </TableCell>
                  </TableRow>
                ) : filteredTracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      <Music2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      Không có nhạc nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTracks.map((track) => (
                    <TableRow key={track.id} className="border-gray-200 hover:bg-gray-50">
                      <TableCell>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handlePlayPause(track)}
                          className={`border-pink-200 hover:bg-pink-50 ${
                            currentlyPlaying === track.id ? 'bg-pink-100 border-pink-400' : ''
                          }`}
                        >
                          {currentlyPlaying === track.id ? (
                            <Pause className="w-4 h-4 text-pink-500" />
                          ) : (
                            <Play className="w-4 h-4 text-pink-500" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-800 truncate max-w-[200px]">{track.title}</p>
                          <p className="text-sm text-gray-500">{track.artist || "Unknown"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{track.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatFileSize(track.file_size)} / {formatDuration(track.duration)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(track.created_at).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {track.pending_approval ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(track)}
                                disabled={processingId === track.id}
                                className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white"
                              >
                                {processingId === track.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                )}
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(track)}
                                disabled={processingId === track.id}
                                className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Từ chối
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => openDeleteDialog(track, e)}
                              disabled={processingId === track.id}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Mobile Cards */}
        <div className="block sm:hidden space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Music2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Không có nhạc nào</p>
            </div>
          ) : (
            filteredTracks.map((track) => (
              <div 
                key={track.id} 
                className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handlePlayPause(track)}
                    className={`shrink-0 border-pink-200 ${
                      currentlyPlaying === track.id ? 'bg-pink-100 border-pink-400' : ''
                    }`}
                  >
                    {currentlyPlaying === track.id ? (
                      <Pause className="w-4 h-4 text-pink-500" />
                    ) : (
                      <Play className="w-4 h-4 text-pink-500" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{track.title}</p>
                    <p className="text-sm text-gray-500 truncate">{track.artist || "Unknown"}</p>
                    <p className="text-xs text-gray-400">by {track.username}</p>
                  </div>
                  {track.pending_approval && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(track.file_size)} • {formatDuration(track.duration)}</span>
                  <span>{new Date(track.created_at).toLocaleDateString("vi-VN")}</span>
                </div>

                <div className="flex gap-2">
                  {track.pending_approval ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(track)}
                        disabled={processingId === track.id}
                        className="flex-1 bg-gradient-to-r from-green-400 to-green-500 text-white"
                      >
                        {processingId === track.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Duyệt
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openRejectDialog(track)}
                        disabled={processingId === track.id}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Từ chối
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => openDeleteDialog(track, e)}
                      disabled={processingId === track.id}
                      className="w-full border-red-200 text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhạc</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa vĩnh viễn "{trackToDelete?.title}"? 
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

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối nhạc</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn từ chối và xóa "{trackToReject?.title}"? 
              Người dùng sẽ nhận thông báo về việc này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});

AdminMusicTab.displayName = "AdminMusicTab";

export { AdminMusicTab };
