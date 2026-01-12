import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sparkles, Zap, Globe, Radio, Crown, ArrowRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface OnlineUser {
  id: string;
  username: string;
  avatar_url: string | null;
  status: 'building' | 'idle' | 'exploring';
}

interface MultiplayerTeaserProps {
  gameId?: string;
  variant?: "card" | "banner";
}

export function MultiplayerTeaser({ gameId = "puzzle-game", variant = "card" }: MultiplayerTeaserProps) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // Simulate real-time online users
  useEffect(() => {
    // Mock online users for teaser
    const mockUsers: OnlineUser[] = [
      { id: '1', username: 'GamerKid2015', avatar_url: null, status: 'building' },
      { id: '2', username: 'CreativeGirl', avatar_url: null, status: 'exploring' },
      { id: '3', username: 'StarGamer', avatar_url: null, status: 'idle' },
    ];
    setOnlineUsers(mockUsers);

    // Simulate live activity pulse
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Supabase realtime subscription for future multiplayer
  useEffect(() => {
    const channel = supabase
      .channel('multiplayer-presence')
      .on('presence', { event: 'sync' }, () => {
        // Future: sync online users
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleJoinWaitlist = async () => {
    if (!user) {
      toast.error("Đăng nhập để tham gia waitlist!");
      return;
    }

    setIsJoining(true);

    try {
      // Record interest in multiplayer feature
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: 'multiplayer_waitlist',
        content: { game_id: gameId, joined_at: new Date().toISOString() }
      });

      setWaitlistJoined(true);
      toast.success("🎉 Bạn đã tham gia waitlist Multiplayer!");
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsJoining(false);
    }
  };

  const statusColors = {
    building: 'bg-green-500',
    exploring: 'bg-blue-500',
    idle: 'bg-yellow-500'
  };

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-[2px]"
      >
        <div className="relative bg-background/95 backdrop-blur rounded-2xl p-4 flex items-center gap-4">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <motion.div
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10"
            />
          </div>

          <div className="relative z-10 flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold">🏗️ Co-Build Multiplayer</h3>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Xây dựng thế giới 3D cùng bạn bè theo thời gian thực!
              </p>
            </div>

            {/* Online users preview */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 3).map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Avatar className="w-8 h-8 border-2 border-background">
                      <AvatarImage src={u.avatar_url || ''} />
                      <AvatarFallback className="text-xs">{u.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                +{12 + pulseCount % 10} online
              </span>
            </div>

            <Button 
              onClick={handleJoinWaitlist}
              disabled={isJoining || waitlistJoined}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {waitlistJoined ? (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Đã tham gia
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Tham gia waitlist
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-card via-purple-500/5 to-pink-500/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Multiplayer
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                  Coming Soon
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">Co-Build 3D cùng bạn bè</CardDescription>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 rounded-full bg-green-500/20"
          >
            <Radio className="w-4 h-4 text-green-500" />
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Globe, label: "Realtime", color: "text-blue-500" },
            { icon: Users, label: "Co-Build", color: "text-green-500" },
            { icon: Crown, label: "Compete", color: "text-yellow-500" }
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-2 bg-muted/30 rounded-lg text-center"
            >
              <feature.icon className={`w-5 h-5 mx-auto ${feature.color}`} />
              <p className="text-xs mt-1">{feature.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Online users */}
        <div className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Đang online
          </p>
          <div className="space-y-2">
            <AnimatePresence>
              {onlineUsers.map((u, index) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={u.avatar_url || ''} />
                    <AvatarFallback className="text-xs">{u.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 truncate">{u.username}</span>
                  <span className={`w-2 h-2 rounded-full ${statusColors[u.status]}`} />
                  <span className="text-xs text-muted-foreground capitalize">{u.status}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Join waitlist */}
        <Button
          onClick={handleJoinWaitlist}
          disabled={isJoining || waitlistJoined}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {waitlistJoined ? (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Đã tham gia waitlist!
            </>
          ) : isJoining ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
              </motion.div>
              Đang tham gia...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Tham gia waitlist
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          🚀 Sắp ra mắt • Supabase Realtime
        </p>
      </CardContent>
    </Card>
  );
}