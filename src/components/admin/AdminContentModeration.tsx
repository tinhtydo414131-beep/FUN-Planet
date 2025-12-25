import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Gamepad2, Music, Search, CheckCircle, XCircle, 
  Eye, Loader2, RefreshCw, Coins, ExternalLink 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface GameData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  user_id: string;
  created_at: string;
  thumbnail_path: string | null;
  play_count: number;
  profile?: {
    username: string;
  };
}

interface MusicData {
  id: string;
  title: string;
  artist: string | null;
  user_id: string;
  created_at: string;
  pending_approval: boolean;
  parent_approved: boolean;
  profile?: {
    username: string;
  };
}

export function AdminContentModeration() {
  const [games, setGames] = useState<GameData[]>([]);
  const [music, setMusic] = useState<MusicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'game' | 'music'; title: string } | null>(null);
  const [rewardAmount, setRewardAmount] = useState('50000');
  const [rewardNote, setRewardNote] = useState('');

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch pending games
      const { data: gamesData } = await supabase
        .from('uploaded_games')
        .select('id, title, description, status, user_id, created_at, thumbnail_path, play_count')
        .in('status', ['pending', 'approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (gamesData) {
        const userIds = [...new Set(gamesData.map(g => g.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        setGames(gamesData.map(game => ({
          ...game,
          profile: profiles?.find(p => p.id === game.user_id)
        })));
      }

      // Fetch music needing approval
      const { data: musicData } = await supabase
        .from('user_music')
        .select('id, title, artist, user_id, created_at, pending_approval, parent_approved')
        .order('created_at', { ascending: false })
        .limit(50);

      if (musicData) {
        const userIds = [...new Set(musicData.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        setMusic(musicData.map(m => ({
          ...m,
          profile: profiles?.find(p => p.id === m.user_id)
        })));
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleApproveGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('uploaded_games')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', gameId);

      if (error) throw error;
      setGames(games.map(g => g.id === gameId ? { ...g, status: 'approved' } : g));
      toast.success('Game approved!');
    } catch (error) {
      toast.error('Failed to approve game');
    }
  };

  const handleRejectGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('uploaded_games')
        .update({ status: 'rejected' })
        .eq('id', gameId);

      if (error) throw error;
      setGames(games.map(g => g.id === gameId ? { ...g, status: 'rejected' } : g));
      toast.success('Game rejected');
    } catch (error) {
      toast.error('Failed to reject game');
    }
  };

  const handleManualReward = async () => {
    if (!selectedItem) return;
    
    const amount = parseInt(rewardAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid reward amount');
      return;
    }

    toast.success(`Manual reward of ${amount.toLocaleString()} $C sent for "${selectedItem.title}"`);
    setRewardModalOpen(false);
    setSelectedItem(null);
    setRewardAmount('50000');
    setRewardNote('');
  };

  const openRewardModal = (id: string, type: 'game' | 'music', title: string) => {
    setSelectedItem({ id, type, title });
    setRewardModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredGames = games.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.profile?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingGames = filteredGames.filter(g => g.status === 'pending');
  const pendingMusic = music.filter(m => m.pending_approval);

  return (
    <>
      <Card className="border-amber-200/50 dark:border-amber-800/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-500" />
                Content Moderation
              </CardTitle>
              <CardDescription>
                Review and approve games & music uploads ({pendingGames.length} games, {pendingMusic.length} music pending)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  className="pl-9 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchContent} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="games">
            <TabsList className="mb-4">
              <TabsTrigger value="games" className="gap-2">
                <Gamepad2 className="w-4 h-4" />
                Games ({pendingGames.length} pending)
              </TabsTrigger>
              <TabsTrigger value="music" className="gap-2">
                <Music className="w-4 h-4" />
                Music ({pendingMusic.length} pending)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plays</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGames.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No games found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredGames.map((game) => (
                          <TableRow key={game.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                  <Gamepad2 className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                  <p className="font-medium">{game.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {game.description || 'No description'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{game.profile?.username || 'Unknown'}</span>
                            </TableCell>
                            <TableCell>{getStatusBadge(game.status)}</TableCell>
                            <TableCell>{game.play_count || 0}</TableCell>
                            <TableCell>
                              <span className="text-sm">{format(new Date(game.created_at), 'dd/MM/yyyy')}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {game.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-500 hover:text-green-600"
                                      onClick={() => handleApproveGame(game.id)}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-500 hover:text-red-600"
                                      onClick={() => handleRejectGame(game.id)}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-amber-500 hover:text-amber-600"
                                  onClick={() => openRewardModal(game.id, 'game', game.title)}
                                >
                                  <Coins className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(`/game-details/${game.id}`, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="music">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Track</TableHead>
                        <TableHead>Uploader</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {music.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No music found
                          </TableCell>
                        </TableRow>
                      ) : (
                        music.map((track) => (
                          <TableRow key={track.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                  <Music className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                  <p className="font-medium">{track.title}</p>
                                  <p className="text-xs text-muted-foreground">{track.artist || 'Unknown Artist'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{track.profile?.username || 'Unknown'}</TableCell>
                            <TableCell>
                              {track.pending_approval ? (
                                <Badge className="bg-yellow-500">Pending</Badge>
                              ) : track.parent_approved ? (
                                <Badge className="bg-green-500">Approved</Badge>
                              ) : (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{format(new Date(track.created_at), 'dd/MM/yyyy')}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-amber-500 hover:text-amber-600"
                                  onClick={() => openRewardModal(track.id, 'music', track.title)}
                                >
                                  <Coins className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Manual Reward Modal */}
      <Dialog open={rewardModalOpen} onOpenChange={setRewardModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Manual Reward
            </DialogTitle>
            <DialogDescription>
              Send a manual CAMLY reward for "{selectedItem?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reward Amount ($CAMLY)</Label>
              <Input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                value={rewardNote}
                onChange={(e) => setRewardNote(e.target.value)}
                placeholder="Reason for manual reward..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-orange-500"
              onClick={handleManualReward}
            >
              <Coins className="w-4 h-4 mr-2" />
              Send Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
