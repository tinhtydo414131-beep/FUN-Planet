import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, TrendingUp, Users, Gamepad2, Music, BookOpen, 
  Palette, Brain, Heart, ChevronLeft, ChevronRight, 
  Search, Bell, PlusCircle, Sparkles, Star, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { PostCard } from '@/components/profile/PostCard';
import { CreatePostCard } from '@/components/profile/CreatePostCard';
import { toast } from 'sonner';

interface InterestGroup {
  id: string;
  name: string;
  name_vi?: string;
  icon: string;
  member_count: number;
  category?: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  video_url?: string | null;
  feeling?: string | null;
  privacy: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string | null;
  };
}

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: Home, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'trending', name: 'Trending', icon: TrendingUp, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
  { id: 'puzzle', name: 'Puzzle', icon: Brain, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  { id: 'educational', name: 'Học tập', icon: BookOpen, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  { id: 'creative', name: 'Sáng tạo', icon: Palette, color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  { id: 'music', name: 'Âm nhạc', icon: Music, color: 'bg-gradient-to-r from-violet-500 to-purple-500' },
  { id: 'games', name: 'Games', icon: Gamepad2, color: 'bg-gradient-to-r from-indigo-500 to-blue-500' },
  { id: 'kindness', name: 'Tử tế', icon: Heart, color: 'bg-gradient-to-r from-rose-500 to-pink-500' },
];

export default function Community() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [interestGroups, setInterestGroups] = useState<InterestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user?.id]);

  // Load interest groups
  useEffect(() => {
    supabase
      .from('interest_groups')
      .select('*')
      .order('member_count', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setInterestGroups(data);
      });
  }, []);

  // Load posts
  const loadPosts = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    const limit = 10;
    const offset = currentPage * limit;

    try {
      // First get posts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Then get user profiles for each post
      const userIds = [...new Set((postsData || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const postsWithUsers: Post[] = (postsData || []).map(post => ({
        ...post,
        user: profileMap.get(post.user_id) || { username: 'Unknown', avatar_url: null }
      }));

      if (reset) {
        setPosts(postsWithUsers);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...postsWithUsers]);
        setPage(prev => prev + 1);
      }

      setHasMore((postsData?.length || 0) === limit);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Initial load
  useEffect(() => {
    loadPosts(true);
  }, [selectedCategory]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadPosts]);

  const handlePostCreated = () => {
    loadPosts(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 72 : 260 }}
          className="fixed left-0 top-16 h-[calc(100vh-64px)] bg-card border-r border-border z-40 hidden lg:block"
        >
          <div className="flex flex-col h-full">
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-4 z-50 h-6 w-6 rounded-full border bg-background shadow-md"
            >
              {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>

            <ScrollArea className="flex-1 px-2 py-4">
              {/* Categories */}
              <div className="space-y-1">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  
                  return (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive 
                          ? `${category.color} text-white shadow-lg`
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="font-medium whitespace-nowrap overflow-hidden"
                          >
                            {category.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* Divider */}
              {!sidebarCollapsed && (
                <div className="my-4 border-t border-border" />
              )}

              {/* Interest Groups */}
              {!sidebarCollapsed && (
                <div className="space-y-2">
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nhóm sở thích
                  </h3>
                  {interestGroups.slice(0, 5).map((group) => {
                    // Get color based on category
                    const categoryColors: Record<string, string> = {
                      games: 'from-indigo-500 to-blue-500',
                      education: 'from-green-500 to-emerald-500',
                      creative: 'from-pink-500 to-rose-500',
                      music: 'from-violet-500 to-purple-500',
                      puzzle: 'from-blue-500 to-cyan-500',
                    };
                    
                    return (
                    <motion.button
                      key={group.id}
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left"
                    >
                      <span className="text-xl">{group.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{group.name_vi || group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.member_count.toLocaleString()} thành viên</p>
                      </div>
                    </motion.button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main 
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
          }`}
        >
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Community
                </h1>
                <p className="text-muted-foreground text-sm">
                  Chia sẻ và kết nối với bạn bè
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Category Pills - Mobile */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 lg:hidden scrollbar-hide">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                
                return (
                  <Button
                    key={category.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`shrink-0 ${isActive ? category.color : ''}`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {category.name}
                  </Button>
                );
              })}
            </div>

            {/* Create Post */}
            {user && profile && (
              <div className="mb-6">
                <CreatePostCard profile={profile} onPostCreated={handlePostCreated} />
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
              {loading && posts.length === 0 ? (
                // Skeleton loaders
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-3/4 bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Chưa có bài viết nào</h3>
                  <p className="text-muted-foreground text-sm">
                    Hãy là người đầu tiên chia sẻ!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUserId={user?.id || ''} 
                  />
                ))
              )}

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                {loading && posts.length > 0 && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Desktop Only */}
        <aside className="hidden xl:block w-80 shrink-0 p-4 sticky top-16 h-[calc(100vh-64px)]">
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-500" />
              Người sáng tạo nổi bật
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                      C{i}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">Creator {i}</p>
                    <p className="text-xs text-muted-foreground">{1000 * i} followers</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {['#funplanet', '#game', '#creative', '#puzzle', '#learn', '#music'].map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
