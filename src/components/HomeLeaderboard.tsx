import { useState, useEffect } from 'react';
import { Crown, Medal, Award, Search, ChevronDown, Trophy, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar_url: string | null;
  wallet_balance: number;
  total_plays: number;
}

export default function HomeLeaderboard() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"wallet_balance" | "total_plays">("wallet_balance");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('public_leaderboard')
        .select('id, username, avatar_url, total_plays, leaderboard_score')
        .order(sortBy === 'wallet_balance' ? 'leaderboard_score' : 'total_plays', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedData: LeaderboardEntry[] = (data || []).map((player, index) => ({
        rank: index + 1,
        username: player.username || 'Anonymous',
        avatar_url: player.avatar_url,
        wallet_balance: player.leaderboard_score || 0,
        total_plays: player.total_plays || 0,
      }));

      setLeaderboardData(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-10 h-10 md:w-12 md:h-12 text-yellow-400 drop-shadow-lg" />;
    if (rank === 2) return <Medal className="w-8 h-8 md:w-10 md:h-10 text-gray-400 drop-shadow-lg" />;
    if (rank === 3) return <Award className="w-8 h-8 md:w-10 md:h-10 text-orange-600 drop-shadow-lg" />;
    return (
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm md:text-lg">
        #{rank}
      </div>
    );
  };

  const getReward = (rank: number) => {
    if (rank === 1) return "50,000 CAMLY";
    if (rank === 2) return "30,000 CAMLY";
    if (rank === 3) return "20,000 CAMLY";
    if (rank <= 10) return "10,000 CAMLY";
    if (rank <= 50) return "5,000 CAMLY";
    return "1,000 CAMLY";
  };

  const filteredData = leaderboardData.filter(player =>
    player.username.toLowerCase().includes(search.toLowerCase())
  );

  const displayedData = filteredData.slice(0, visibleCount);
  const top3 = filteredData.slice(0, 3);
  const restData = displayedData.slice(3);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 text-center">
        <Trophy className="w-16 h-16 text-primary animate-bounce mx-auto mb-4" />
        <p className="text-xl font-fredoka text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-fredoka font-bold bg-gradient-to-r from-yellow-400 via-primary to-secondary bg-clip-text text-transparent">
            HONOR BOARD ✨
          </h2>
          <p className="text-lg text-muted-foreground mt-2 font-comic">Top 100 vui vẻ nhất Fun Planet!</p>
        </motion.div>

        {/* Search + Sort */}
        <motion.div 
          className="flex flex-col md:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Tìm tên người chơi..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-primary/20 focus:border-primary text-lg h-14"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
          </div>
          <Button 
            onClick={() => setSortBy(prev => prev === 'wallet_balance' ? 'total_plays' : 'wallet_balance')}
            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-2xl font-bold hover:scale-105 transition h-14"
          >
            {sortBy === 'wallet_balance' ? 'Điểm' : 'Lượt chơi'} <ChevronDown className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Top 3 Special Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[2, 1, 3].map((pos, idx) => {
            const player = top3.find(p => p.rank === pos);
            if (!player) return null;
            return (
              <motion.div 
                key={pos} 
                className={`relative transform hover:scale-105 transition-all duration-300 ${
                  pos === 1 ? 'md:-mt-6 md:order-2' : pos === 2 ? 'md:mt-4 md:order-1' : 'md:mt-4 md:order-3'
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
              >
                <div className={`bg-card rounded-3xl shadow-2xl overflow-hidden border-4 ${
                  pos === 1 ? 'border-yellow-400' : pos === 2 ? 'border-gray-400' : 'border-orange-500'
                }`}>
                  <div className={`p-6 text-center ${
                    pos === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
                    pos === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                    'bg-gradient-to-br from-orange-400 to-orange-600'
                  }`}>
                    {getRankIcon(pos)}
                    <div className="text-4xl mt-2">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.username} className="w-16 h-16 rounded-full mx-auto border-4 border-white/50" />
                      ) : (
                        pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'
                      )}
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl md:text-2xl font-fredoka font-bold text-foreground truncate">{player.username}</h3>
                    <p className="text-2xl md:text-3xl font-bold text-primary mt-2">
                      {(sortBy === 'wallet_balance' ? player.wallet_balance : player.total_plays).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {sortBy === 'wallet_balance' ? 'điểm' : 'lượt chơi'}
                    </p>
                    <p className="text-lg text-green-600 dark:text-green-400 font-bold mt-2">
                      🏆 {getReward(pos)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Rest of leaderboard - Card list */}
        <div className="space-y-3">
          {restData.map((player, idx) => (
            <motion.div 
              key={player.rank} 
              className="bg-card rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transition border-2 border-primary/10 hover:border-primary/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + idx * 0.02 }}
            >
              <div className="flex-shrink-0">{getRankIcon(player.rank)}</div>
              <div className="flex-shrink-0">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.username} className="w-12 h-12 rounded-full border-2 border-primary/30" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-fredoka font-bold text-foreground truncate">{player.username}</h3>
                <p className="text-muted-foreground text-sm">
                  {sortBy === 'wallet_balance' ? 'Điểm' : 'Lượt chơi'}: {(sortBy === 'wallet_balance' ? player.wallet_balance : player.total_plays).toLocaleString()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm md:text-base font-bold text-green-600 dark:text-green-400">{getReward(player.rank)}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleCount < filteredData.length && (
          <motion.div 
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button 
              onClick={() => setVisibleCount(prev => Math.min(prev + 20, 100))}
              className="px-10 py-6 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-lg font-bold rounded-full hover:scale-110 transition"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Xem thêm người chơi ✨
            </Button>
          </motion.div>
        )}

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground font-comic">Không tìm thấy người chơi nào 😢</p>
          </div>
        )}
      </div>
    </section>
  );
}
