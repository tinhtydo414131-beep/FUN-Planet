import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { CreatePostCard } from "@/components/profile/CreatePostCard";
import { PostCard } from "@/components/profile/PostCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export function HomeSocialFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const { posts, loading, hasMore, loadMoreRef, addPost } = useInfiniteFeed({
    pageSize: 5,
    enabled: true
  });

  // Fetch profile when user is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    };
    
    fetchProfile();
  }, [user]);

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold">Bảng Tin Cộng Đồng</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            Chia sẻ khoảnh khắc của bạn ✨
          </h2>
          <p className="text-muted-foreground">
            Kết nối với bạn bè, chia sẻ niềm vui gaming!
          </p>
        </motion.div>

        {/* Create Post (nếu đã đăng nhập) */}
        {user && profile ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <CreatePostCard 
              profile={{
                id: profile.id,
                username: profile.username || 'User',
                avatar_url: profile.avatar_url
              }} 
              onPostCreated={(newPost) => addPost(newPost)} 
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-6 text-center border-2 border-dashed border-primary/30 bg-primary/5">
              <Users className="w-12 h-12 mx-auto text-primary/50 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Đăng nhập để chia sẻ</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Tham gia cộng đồng và chia sẻ những khoảnh khắc tuyệt vời!
              </p>
              <Button onClick={() => navigate('/auth')} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Đăng nhập ngay
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PostCard 
                post={post} 
                currentUserId={user?.id || ''} 
              />
            </motion.div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Load More Trigger (invisible) */}
          {hasMore && <div ref={loadMoreRef} className="h-10" />}

          {/* Empty state */}
          {!loading && posts.length === 0 && (
            <Card className="p-8 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Chưa có bài viết nào</h3>
              <p className="text-muted-foreground mb-4">
                Hãy là người đầu tiên chia sẻ với cộng đồng!
              </p>
              {!user && (
                <Button onClick={() => navigate('/auth')} variant="outline">
                  Đăng nhập để đăng bài
                </Button>
              )}
            </Card>
          )}

          {/* No more posts */}
          {!loading && posts.length > 0 && !hasMore && (
            <p className="text-center text-muted-foreground py-4">
              Bạn đã xem hết bài viết! 🎉
            </p>
          )}
        </div>

        {/* View All Button */}
        {posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <Button
              onClick={() => navigate('/community')}
              variant="outline"
              size="lg"
              className="gap-2 border-2 border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              <Users className="w-5 h-5" />
              Xem tất cả bài viết
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
