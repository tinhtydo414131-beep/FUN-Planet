import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, GamepadIcon, Users, Trophy, Gem, ExternalLink, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FriendActionButton } from "@/components/FriendActionButton";
import { MessageButton } from "@/components/private-chat/MessageButton";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  totalCamly?: number;
  userRank?: number;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  total_plays: number;
  total_friends: number;
  leaderboard_score: number;
}

export function UserProfileModal({ 
  open, 
  onOpenChange, 
  userId,
  totalCamly = 0,
  userRank
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (open && userId) {
      fetchUserProfile(userId);
    }
  }, [open, userId]);

  const fetchUserProfile = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, total_plays, total_friends, leaderboard_score")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullProfile = () => {
    if (userId) {
      onOpenChange(false);
      navigate(`/profile/${userId}`);
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-2 border-transparent p-0 overflow-hidden" 
        style={{
          backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #f472b6, #fbbf24, #3b82f6)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box"
        }}>
        
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          Thông tin người dùng {profile?.username || ""}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Xem thông tin chi tiết, kết bạn và nhắn tin với người dùng này
        </DialogDescription>

        {loading ? (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-3 justify-center">
              <Skeleton className="h-16 w-20 rounded-xl" />
              <Skeleton className="h-16 w-20 rounded-xl" />
              <Skeleton className="h-16 w-20 rounded-xl" />
            </div>
          </div>
        ) : profile ? (
          <div className="p-6">
            {/* Header with Avatar */}
            <div className="flex flex-col items-center mb-5">
              {/* Avatar with glow */}
              <div className="relative mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 blur-md"
                  style={{ transform: "scale(1.15)" }}
                />
                <Avatar className="relative z-10 h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-blue-400 text-white font-bold text-2xl">
                    {profile.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Rank badge if provided */}
                {userRank && userRank <= 3 && (
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-2 -right-2 z-20"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                      userRank === 1 
                        ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black" 
                        : userRank === 2 
                        ? "bg-gradient-to-br from-slate-300 to-gray-400 text-gray-800"
                        : "bg-gradient-to-br from-orange-400 to-amber-600 text-white"
                    }`}>
                      #{userRank}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Username */}
              <h3 className="text-xl font-bold text-gray-800">
                {profile.username}
              </h3>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-500 text-sm text-center mt-1 max-w-[280px] line-clamp-2">
                  {profile.bio}
                </p>
              )}

              {/* Total CAMLY */}
              <div className="flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-yellow-50 to-pink-50 rounded-full border border-yellow-200">
                <Gem className="h-5 w-5 text-yellow-500 drop-shadow-[0_0_6px_rgba(255,255,0,0.6)]" />
                <span className="font-extrabold text-lg bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                  {totalCamly.toLocaleString()} CAMLY
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="flex flex-col items-center p-3 bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-100">
                <GamepadIcon className="h-5 w-5 text-pink-500 mb-1" />
                <span className="text-lg font-bold text-gray-800">{profile.total_plays || 0}</span>
                <span className="text-xs text-gray-500">Lượt chơi</span>
              </div>

              <div className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
                <Users className="h-5 w-5 text-blue-500 mb-1" />
                <span className="text-lg font-bold text-gray-800">{profile.total_friends || 0}</span>
                <span className="text-xs text-gray-500">Bạn bè</span>
              </div>

              <div className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-100">
                <Trophy className="h-5 w-5 text-yellow-500 mb-1" />
                <span className="text-lg font-bold text-gray-800">
                  {userRank ? `#${userRank}` : (profile.leaderboard_score || 0)}
                </span>
                <span className="text-xs text-gray-500">{userRank ? 'Xếp hạng' : 'Điểm'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && currentUser && (
              <div className="flex gap-3 mb-4">
                <FriendActionButton
                  targetUserId={profile.id}
                  targetUsername={profile.username}
                  size="default"
                  className="flex-1"
                  showMessage={false}
                />
                <MessageButton
                  user={{
                    id: profile.id,
                    username: profile.username,
                    avatar_url: profile.avatar_url
                  }}
                  size="default"
                  className="flex-1"
                />
              </div>
            )}

            {/* View Full Profile Button */}
            <Button
              onClick={handleViewFullProfile}
              variant="outline"
              className="w-full border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Xem Profile Đầy Đủ
            </Button>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Không tìm thấy thông tin người dùng
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
