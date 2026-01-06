import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Gamepad2,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  Loader2,
  Clock,
  Users,
  ThumbsUp,
  Gift,
  Sparkles,
  Brain,
} from "lucide-react";
import { format } from "date-fns";
import { AgeBadge, SafetyBadge, AIReviewCard } from "@/components/games/AIGameRating";

interface GameAIReview {
  overall_score: number;
  is_safe_for_kids: boolean;
  recommended_age: string;
  violence_score: number;
  violence_types: string[];
  violence_details: string;
  has_lootbox: boolean;
  has_gambling_mechanics: boolean;
  monetization_concerns: string[];
  educational_score: number;
  educational_categories: string[];
  learning_outcomes: string[];
  detected_themes: string[];
  positive_aspects: string[];
  concerns: string[];
  review_summary: string;
  confidence_score: number;
}

interface Game {
  id: string;
  title: string;
  description: string | null;
  thumbnail_path: string | null;
  status: "approved" | "pending" | "rejected";
  play_count: number;
  rating_count: number;
  created_at: string;
  user_id: string;
  username: string;
  external_url?: string | null;
  game_file_path?: string | null;
  ai_review?: GameAIReview | null;
}

interface AdminGamesTabProps {
  onStatsUpdate: () => void;
}

export function AdminGamesTab({ onStatsUpdate }: AdminGamesTabProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingGame, setRejectingGame] = useState<Game | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewingGame, setPreviewingGame] = useState<Game | null>(null);
  
  // AI Review modal state
  const [aiReviewModalOpen, setAiReviewModalOpen] = useState(false);
  const [reviewingGame, setReviewingGame] = useState<Game | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [batchEvaluating, setBatchEvaluating] = useState(false);

  useEffect(() => {
    loadGames();
  }, [statusFilter]);

  const loadGames = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("uploaded_games")
        .select("id, title, description, thumbnail_path, status, play_count, rating_count, created_at, user_id, external_url, game_file_path")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "approved" | "pending" | "rejected");
      }

      const { data: gamesData } = await query;

      if (gamesData) {
        const userIds = [...new Set(gamesData.map((g) => g.user_id))];
        const gameIds = gamesData.map(g => g.id);
        
        // Fetch profiles and AI reviews in parallel
        const [profilesResult, aiReviewsResult] = await Promise.all([
          supabase.from("profiles").select("id, username").in("id", userIds),
          supabase.from("game_ai_reviews").select("*").in("game_id", gameIds)
        ]);

        const profiles = profilesResult.data;
        const aiReviews = aiReviewsResult.data;

        const gamesWithUsers: Game[] = gamesData.map((game: any) => ({
          id: game.id,
          title: game.title,
          description: game.description,
          thumbnail_path: game.thumbnail_path,
          status: game.status,
          play_count: game.play_count || 0,
          rating_count: game.rating_count || 0,
          created_at: game.created_at,
          user_id: game.user_id,
          username: profiles?.find((p) => p.id === game.user_id)?.username || "Unknown",
          external_url: game.external_url,
          game_file_path: game.game_file_path,
          ai_review: aiReviews?.find((r) => r.game_id === game.id) || null,
        }));

        setGames(gamesWithUsers);
      }
    } catch (error) {
      console.error("Load games error:", error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  // Open reject modal
  const openRejectModal = (game: Game) => {
    setRejectingGame(game);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  // Open preview modal
  const openPreviewModal = (game: Game) => {
    setPreviewingGame(game);
    setPreviewModalOpen(true);
  };

  // Open AI review modal
  const openAIReviewModal = (game: Game) => {
    setReviewingGame(game);
    setAiReviewModalOpen(true);
  };

  // Convert relative path to absolute URL for Edge Function
  const getAbsoluteThumbnailUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Trigger AI evaluation for a game
  const triggerAIEvaluation = async (game: Game) => {
    setEvaluatingId(game.id);
    try {
      const absoluteThumbnailUrl = getAbsoluteThumbnailUrl(game.thumbnail_path);
      console.log('[Admin] Triggering AI evaluation with thumbnail:', absoluteThumbnailUrl);
      
      const { data, error } = await supabase.functions.invoke('angel-evaluate-game', {
        body: {
          game_id: game.id,
          title: game.title,
          description: game.description,
          categories: [],
          thumbnail_url: absoluteThumbnailUrl
        }
      });

      if (error) throw error;

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">🔮 Angel AI đã đánh giá xong!</span>
          <span className="text-sm">{data.message}</span>
        </div>
      );
      
      loadGames();
    } catch (error: any) {
      console.error("AI evaluation error:", error);
      toast.error("Lỗi khi đánh giá AI: " + (error.message || "Unknown error"));
    } finally {
      setEvaluatingId(null);
    }
  };

  // Batch AI evaluation for games missing reviews
  const evaluateMissingReviews = async () => {
    const gamesWithoutReview = games.filter(g => g.status === 'approved' && !g.ai_review);
    
    if (gamesWithoutReview.length === 0) {
      toast.info("Tất cả game đã có AI review!");
      return;
    }

    setBatchEvaluating(true);
    let successCount = 0;
    let failCount = 0;

    toast.info(`Đang đánh giá ${gamesWithoutReview.length} game...`);

    for (const game of gamesWithoutReview) {
      try {
        const absoluteThumbnailUrl = getAbsoluteThumbnailUrl(game.thumbnail_path);
        console.log(`[Admin Batch] Evaluating "${game.title}" with thumbnail:`, absoluteThumbnailUrl);
        
        const { error } = await supabase.functions.invoke('angel-evaluate-game', {
          body: {
            game_id: game.id,
            title: game.title,
            description: game.description,
            categories: [],
            thumbnail_url: absoluteThumbnailUrl
          }
        });

        if (error) {
          failCount++;
          console.error(`Failed to evaluate ${game.title}:`, error);
        } else {
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        failCount++;
        console.error(`Error evaluating ${game.title}:`, err);
      }
    }

    setBatchEvaluating(false);
    loadGames();
    
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold">🔮 Đánh giá batch hoàn tất!</span>
        <span className="text-sm">Thành công: {successCount} | Lỗi: {failCount}</span>
      </div>
    );
  };

  const getGamePreviewUrl = (game: Game): string | null => {
    if (game.external_url) return game.external_url;
    if (game.game_file_path) {
      const { data } = supabase.storage.from('uploaded-games').getPublicUrl(game.game_file_path);
      return data.publicUrl;
    }
    return null;
  };

  // Handle approve game with reward
  const approveGame = async (game: Game) => {
    setProcessingId(game.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update game status to approved
      const { error: updateError } = await supabase
        .from("uploaded_games")
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq("id", game.id);

      if (updateError) throw updateError;

      // Claim reward for creator (500K CAMLY)
      const { data: rewardResult, error: rewardError } = await supabase.rpc('claim_upload_reward_safe', {
        p_game_id: game.id,
        p_game_title: game.title
      });

      if (rewardError) {
        console.error('Reward claim error:', rewardError);
        // Don't throw - continue with notification even if reward fails
      }

      // Send notification to creator
      await supabase.from('user_notifications').insert({
        user_id: game.user_id,
        notification_type: 'game_approved',
        title: '🎉 Game của bạn đã được duyệt!',
        message: `"${game.title}" đã được approve! +500.000 CAMLY đã được cộng vào tài khoản của bạn.`,
        data: { 
          game_id: game.id, 
          game_title: game.title, 
          reward_amount: 500000 
        }
      });

      // Log the review action
      if (user?.id) {
        await supabase.from("game_reviews").insert({
          game_id: game.id,
          reviewer_id: user.id,
          status: 'approved',
          notes: 'Game approved by admin',
        });
      }

      // Log admin action
      await supabase.from("admin_audit_logs").insert({
        admin_id: user?.id,
        action: 'game_approved',
        target_type: "game",
        target_id: game.id,
        details: { 
          new_status: 'approved',
          reward_sent: true,
          reward_amount: 500000
        },
      });

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">✅ Game đã được duyệt!</span>
          <span className="text-sm">+500.000 CAMLY đã gửi cho {game.username}</span>
        </div>
      );
      
      loadGames();
      onStatsUpdate();
    } catch (error) {
      console.error("Approve game error:", error);
      toast.error("Failed to approve game");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject game with reason
  const rejectGame = async () => {
    if (!rejectingGame) return;
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setProcessingId(rejectingGame.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update game status to rejected with reason
      const { error: updateError } = await supabase
        .from("uploaded_games")
        .update({ 
          status: 'rejected',
          rejection_note: rejectionReason.trim()
        })
        .eq("id", rejectingGame.id);

      if (updateError) throw updateError;

      // Send notification to creator
      await supabase.from('user_notifications').insert({
        user_id: rejectingGame.user_id,
        notification_type: 'game_rejected',
        title: '❌ Game không được duyệt',
        message: `"${rejectingGame.title}" đã bị từ chối: ${rejectionReason.trim()}`,
        data: { 
          game_id: rejectingGame.id, 
          game_title: rejectingGame.title,
          rejection_reason: rejectionReason.trim()
        }
      });

      // Log the review action
      if (user?.id) {
        await supabase.from("game_reviews").insert({
          game_id: rejectingGame.id,
          reviewer_id: user.id,
          status: 'rejected',
          notes: rejectionReason.trim(),
        });
      }

      // Log admin action
      await supabase.from("admin_audit_logs").insert({
        admin_id: user?.id,
        action: 'game_rejected',
        target_type: "game",
        target_id: rejectingGame.id,
        details: { 
          new_status: 'rejected',
          rejection_reason: rejectionReason.trim()
        },
      });

      toast.success("Game đã bị từ chối");
      setRejectModalOpen(false);
      setRejectingGame(null);
      setRejectionReason("");
      loadGames();
      onStatsUpdate();
    } catch (error) {
      console.error("Reject game error:", error);
      toast.error("Failed to reject game");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm("Bạn có chắc muốn xóa game này?")) return;

    setProcessingId(gameId);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from("uploaded_games")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", gameId);

      await supabase.from("admin_audit_logs").insert({
        admin_id: user?.id,
        action: "game_deleted",
        target_type: "game",
        target_id: gameId,
      });

      toast.success("Game deleted successfully");
      loadGames();
      onStatsUpdate();
    } catch (error) {
      console.error("Delete game error:", error);
      toast.error("Failed to delete game");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-500">Approved</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-500">Pending</Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: games.length,
    pending: games.filter((g) => g.status === "pending").length,
    approved: games.filter((g) => g.status === "approved").length,
    rejected: games.filter((g) => g.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadGames}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={evaluateMissingReviews}
              disabled={batchEvaluating}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              {batchEvaluating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Re-evaluate Missing ({games.filter(g => g.status === 'approved' && !g.ai_review).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Games Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Games Management
            {stats.pending > 0 && (
              <Badge variant="destructive">{stats.pending} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-8">
              <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No games found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Sparkles className="h-4 w-4 inline mr-1" />
                      AI Review
                    </TableHead>
                    <TableHead>
                      <Users className="h-4 w-4 inline mr-1" />
                      Plays
                    </TableHead>
                    <TableHead>
                      <ThumbsUp className="h-4 w-4 inline mr-1" />
                      Likes
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGames.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {game.thumbnail_path && (
                            <img
                              src={game.thumbnail_path}
                              alt={game.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{game.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {game.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{game.username}</TableCell>
                      <TableCell>{getStatusBadge(game.status)}</TableCell>
                      <TableCell>
                        {game.ai_review ? (
                          <div className="flex items-center gap-1">
                            <AgeBadge age={game.ai_review.recommended_age} size="sm" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAIReviewModal(game)}
                              className="text-purple-500 hover:text-purple-600 p-1"
                              title="Xem đánh giá AI"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => triggerAIEvaluation(game)}
                            disabled={evaluatingId === game.id}
                            className="text-purple-500 hover:text-purple-600"
                            title="Đánh giá bằng AI"
                          >
                            {evaluatingId === game.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-1" />
                                <span className="text-xs">AI</span>
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{game.play_count || 0}</TableCell>
                      <TableCell>{game.rating_count || 0}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(game.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPreviewModal(game)}
                            disabled={!getGamePreviewUrl(game)}
                            className="text-blue-500 hover:text-blue-600"
                            title="Preview game"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {game.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveGame(game)}
                                disabled={processingId === game.id}
                                className="text-green-500 hover:text-green-600"
                                title="Duyệt game & gửi 500K CAMLY"
                              >
                                {processingId === game.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <Gift className="h-3 w-3" />
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRejectModal(game)}
                                disabled={processingId === game.id}
                                className="text-red-500 hover:text-red-600"
                                title="Từ chối game"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGame(game.id)}
                            disabled={processingId === game.id}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Rejection Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối game</DialogTitle>
            <DialogDescription>
              Nhập lý do từ chối game "{rejectingGame?.title}". Lý do này sẽ được gửi đến người tạo game.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Nhập lý do từ chối game..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={rejectGame}
              disabled={!rejectionReason.trim() || processingId === rejectingGame?.id}
            >
              {processingId === rejectingGame?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Từ chối game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {previewingGame?.title}
            </DialogTitle>
            <DialogDescription>
              Test game trước khi duyệt. Đảm bảo game hoạt động tốt.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 h-full">
            {previewingGame && getGamePreviewUrl(previewingGame) && (
              <iframe
                src={getGamePreviewUrl(previewingGame)!}
                className="w-full h-[calc(80vh-120px)] border rounded-lg bg-black"
                title={`Preview ${previewingGame.title}`}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Review Modal */}
      <Dialog open={aiReviewModalOpen} onOpenChange={setAiReviewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Angel AI Review: {reviewingGame?.title}
            </DialogTitle>
            <DialogDescription>
              Kết quả đánh giá tự động từ Angel AI
            </DialogDescription>
          </DialogHeader>
          {reviewingGame?.ai_review && (
            <AIReviewCard review={reviewingGame.ai_review as GameAIReview} />
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => reviewingGame && triggerAIEvaluation(reviewingGame)}
              disabled={evaluatingId === reviewingGame?.id}
            >
              {evaluatingId === reviewingGame?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Đánh giá lại
            </Button>
            <Button onClick={() => setAiReviewModalOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
