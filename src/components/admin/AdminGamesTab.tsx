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
} from "lucide-react";
import { format } from "date-fns";

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

  useEffect(() => {
    loadGames();
  }, [statusFilter]);

  const loadGames = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("uploaded_games")
        .select("id, title, description, thumbnail_path, status, play_count, rating_count, created_at, user_id")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "approved" | "pending" | "rejected");
      }

      const { data: gamesData } = await query;

      if (gamesData) {
        const userIds = [...new Set(gamesData.map((g) => g.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        const gamesWithUsers: Game[] = gamesData.map((game) => ({
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
                      <TableCell>{game.play_count || 0}</TableCell>
                      <TableCell>{game.rating_count || 0}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(game.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
    </div>
  );
}
