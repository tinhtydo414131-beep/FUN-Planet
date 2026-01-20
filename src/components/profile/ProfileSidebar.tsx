import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Gift, Trophy, Gamepad2, Users, MapPin, 
  Copy, Check, ArrowUpRight, ArrowDownLeft,
  History, Pencil, Save, X, Loader2, Gem
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';


interface ProfileSidebarProps {
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    bio?: string | null;
    total_plays: number;
    total_friends: number;
  };
  friends: Array<{
    id: string;
    username: string;
    avatar_url: string | null;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    description: string | null;
    transaction_type: string;
  }>;
  camlyBalance: number;
  userRank: number;
  walletAddress: string | null;
  isConnected: boolean;
  onConnectWallet: () => void;
  onProfileUpdate?: () => void;
}

export function ProfileSidebar({
  profile,
  friends,
  transactions,
  camlyBalance,
  userRank,
  walletAddress,
  isConnected,
  onProfileUpdate,
}: ProfileSidebarProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [saving, setSaving] = useState(false);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (address: string | null) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: editBio.trim() || null })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('✅ Đã cập nhật giới thiệu!');
      setIsEditing(false);
      onProfileUpdate?.();
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật!');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditBio(profile.bio || '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4 pb-20 sm:pb-0">
      {/* Intro Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-bold">Intro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-3 sm:px-6">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Viết vài dòng về bản thân..."
                className="min-h-20 resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {editBio.length}/200 ký tự
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveBio}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Lưu
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {profile.bio ? (
                <p className="text-sm text-center text-muted-foreground">{profile.bio}</p>
              ) : (
                <p className="text-sm text-center text-muted-foreground italic">Chưa có giới thiệu</p>
              )}
            </>
          )}
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-primary">{camlyBalance.toLocaleString()} CAMLY</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <span>Rank #{userRank} on Leaderboard</span>
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-muted-foreground" />
              <span>{profile.total_plays} games played</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{profile.total_friends} friends</span>
            </div>
            {isConnected && walletAddress && (
              <button 
                onClick={handleCopyAddress}
                className="flex items-center gap-2 w-full text-left hover:bg-muted p-2 rounded-lg transition"
              >
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-xs truncate">{shortenAddress(walletAddress)}</span>
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {!isEditing && (
            <Button variant="outline" className="w-full" onClick={() => {
              setEditBio(profile.bio || '');
              setIsEditing(true);
            }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Friends Mini Grid */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-bold">Friends</CardTitle>
            <Button variant="link" size="sm" className="h-8 px-2" onClick={() => navigate('/friends')}>
              See All
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{profile.total_friends} friends</p>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
            {friends.slice(0, 9).map((friend) => (
              <button
                key={friend.id}
                onClick={() => navigate(`/profile/${friend.id}`)}
                className="text-center hover:bg-muted active:scale-95 p-1.5 sm:p-2 rounded-lg transition min-h-[60px]"
              >
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1 rounded-lg">
                  <AvatarImage src={friend.avatar_url || ''} />
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-secondary text-white text-sm sm:text-lg">
                    {friend.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-[10px] sm:text-xs font-medium truncate">{friend.username}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Recent Transactions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <History className="w-4 h-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 sm:px-6">
          {transactions.slice(0, 4).map((tx, index) => (
            <motion.div 
              key={tx.id} 
              className="flex items-center gap-2 text-xs sm:text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${
                tx.amount > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}>
                {tx.amount > 0 ? <ArrowDownLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              </div>
              <span className="flex-1 truncate">{tx.description || tx.transaction_type}</span>
              <span className={`shrink-0 ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
              </span>
            </motion.div>
          ))}
          <Button variant="ghost" size="sm" className="w-full h-9" onClick={() => navigate('/rewards-history')}>
            View All
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
