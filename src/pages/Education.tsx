import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, MessageSquare, Users, Lightbulb, Heart, 
  Send, Plus, TrendingUp, Clock, ThumbsUp, Reply
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface EducationPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface EducationComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

const CATEGORIES = [
  { id: "general", label: "Tổng hợp", icon: BookOpen, color: "bg-blue-500" },
  { id: "parenting", label: "Phụ huynh", icon: Users, color: "bg-pink-500" },
  { id: "development", label: "Phát triển", icon: Lightbulb, color: "bg-yellow-500" },
  { id: "safety", label: "An toàn", icon: Heart, color: "bg-green-500" },
  { id: "creative", label: "Sáng tạo", icon: TrendingUp, color: "bg-purple-500" },
];

export default function Education() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<EducationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });
  const [selectedPost, setSelectedPost] = useState<EducationPost | null>(null);
  const [comments, setComments] = useState<EducationComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
    
    // Realtime subscription
    const channel = supabase
      .channel('education-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'education_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('education_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for each post
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const postsWithProfiles = data.map(post => ({
          ...post,
          profiles: profileMap.get(post.user_id) || { username: 'Ẩn danh', avatar_url: null }
        }));
        setPosts(postsWithProfiles);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('education_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profileMap.get(comment.user_id) || { username: 'Ẩn danh', avatar_url: null }
        }));
        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng bài");
      return;
    }
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('education_posts')
        .insert({
          user_id: user.id,
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
        });

      if (error) throw error;

      toast.success("Đăng bài thành công!");
      setNewPost({ title: "", content: "", category: "general" });
      setShowNewPost(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("Không thể đăng bài");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !selectedPost) return;
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('education_comments')
        .insert({
          post_id: selectedPost.id,
          user_id: user.id,
          content: newComment,
        });

      if (error) throw error;

      // Update comments count
      await supabase
        .from('education_posts')
        .update({ comments_count: selectedPost.comments_count + 1 })
        .eq('id', selectedPost.id);

      toast.success("Bình luận thành công!");
      setNewComment("");
      fetchComments(selectedPost.id);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Không thể bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (post: EducationPost) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    try {
      // Check if already liked
      const { data: existing } = await supabase
        .from('education_post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Unlike
        await supabase.from('education_post_likes').delete().eq('id', existing.id);
        await supabase
          .from('education_posts')
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq('id', post.id);
      } else {
        // Like
        await supabase.from('education_post_likes').insert({ post_id: post.id, user_id: user.id });
        await supabase
          .from('education_posts')
          .update({ likes_count: post.likes_count + 1 })
          .eq('id', post.id);
      }

      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const openPostDetail = (post: EducationPost) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent mb-2">
            Cộng đồng Giáo dục
          </h1>
          <p className="text-muted-foreground">
            Nơi phụ huynh, nhà phát triển và cộng đồng kết nối, chia sẻ
          </p>
        </motion.div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="whitespace-nowrap"
          >
            Tất cả
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="whitespace-nowrap gap-2"
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </Button>
          ))}
        </div>

        {/* New Post Button */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            {!showNewPost ? (
              <Button onClick={() => setShowNewPost(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Tạo bài viết mới
              </Button>
            ) : (
              <Card className="p-4 space-y-4">
                <Input
                  placeholder="Tiêu đề bài viết..."
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
                <Textarea
                  placeholder="Nội dung chia sẻ của bạn..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                />
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={newPost.category === cat.id ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setNewPost({ ...newPost, category: cat.id })}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreatePost} disabled={submitting}>
                    <Send className="w-4 h-4 mr-2" /> Đăng bài
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewPost(false)}>
                    Hủy
                  </Button>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Posts List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có bài viết nào</p>
              {user && (
                <Button className="mt-4" onClick={() => setShowNewPost(true)}>
                  Tạo bài viết đầu tiên
                </Button>
              )}
            </Card>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openPostDetail(post)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {post.profiles?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{post.profiles?.username || "Ẩn danh"}</span>
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                        </Badge>
                        {post.is_pinned && (
                          <Badge className="bg-yellow-500">📌 Ghim</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mt-1">{post.title}</h3>
                      <p className="text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <button 
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikePost(post);
                          }}
                        >
                          <ThumbsUp className="w-4 h-4" /> {post.likes_count}
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> {post.comments_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> 
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Post Detail Modal */}
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <Avatar>
                  <AvatarImage src={selectedPost.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedPost.profiles?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium">{selectedPost.profiles?.username}</span>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true, locale: vi })}
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-3">{selectedPost.title}</h2>
              <p className="text-foreground whitespace-pre-wrap mb-6">{selectedPost.content}</p>

              <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                <button 
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                  onClick={() => handleLikePost(selectedPost)}
                >
                  <ThumbsUp className="w-5 h-5" /> {selectedPost.likes_count} thích
                </button>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-5 h-5" /> {comments.length} bình luận
                </span>
              </div>

              {/* Comments */}
              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {comment.profiles?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.profiles?.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              {user && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Viết bình luận..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <Button onClick={handleAddComment} disabled={submitting}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => setSelectedPost(null)}
              >
                Đóng
              </Button>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
