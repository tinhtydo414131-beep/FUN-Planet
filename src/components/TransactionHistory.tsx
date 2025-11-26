import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Users, Coins, Calendar, ArrowUpRight, ArrowDownLeft, Zap, Copy, ExternalLink, Check } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  token_type: string;
  status: string;
  created_at: string;
  transaction_hash?: string;
  notes?: string;
  type: 'send' | 'receive' | 'airdrop';
  recipients_count?: number;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  const [displayCount, setDisplayCount] = useState(10);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Format time intelligently
  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      const timeAgo = formatDistanceToNow(date, { addSuffix: true });
      if (timeAgo.includes('hour') || timeAgo.includes('minute')) {
        return timeAgo;
      }
      return format(date, 'MMM dd, yyyy');
    }
  };

  // Copy hash to clipboard
  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success("Transaction hash copied!");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Format hash with line breaks
  const formatHash = (hash: string): string[] => {
    if (!hash) return [];
    const chunkSize = 16;
    const chunks: string[] = [];
    for (let i = 0; i < hash.length; i += chunkSize) {
      chunks.push(hash.slice(i, i + chunkSize));
    }
    return chunks;
  };

  // Load more transactions
  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, transactions.length));
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = (e: any) => {
      const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
      if (bottom && displayCount < transactions.length) {
        loadMore();
      }
    };

    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    scrollArea?.addEventListener('scroll', handleScroll);
    return () => scrollArea?.removeEventListener('scroll', handleScroll);
  }, [displayCount, transactions.length]);

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center backdrop-blur-sm border-2 border-purple-500/30">
            <Coins className="w-12 h-12 text-purple-400" />
          </div>
        </motion.div>
        <h3 className="text-white text-xl font-bold mb-2">No transactions yet</h3>
        <p className="text-white/50 text-sm">Your transaction history will appear here</p>
      </motion.div>
    );
  }

  const displayedTransactions = transactions.slice(0, displayCount);

  return (
    <ScrollArea className="h-[600px] pr-2">
      <div className="space-y-3">
        {displayedTransactions.map((tx, index) => {
          const isReceive = tx.type === 'receive';
          const isSend = tx.type === 'send' || tx.type === 'airdrop';
          const txDate = new Date(tx.created_at);
          
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl hover:border-white/20 transition-all duration-300 overflow-hidden group">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'airdrop' 
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                          : isReceive
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                          : 'bg-gradient-to-br from-red-500 to-pink-500'
                      }`}
                    >
                      {tx.type === 'airdrop' ? (
                        <Zap className="w-6 h-6 text-white" />
                      ) : isReceive ? (
                        <ArrowDownLeft className="w-6 h-6 text-white" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h4 className={`font-bold text-sm ${
                            tx.type === 'airdrop' 
                              ? 'text-yellow-400'
                              : isReceive 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            {tx.type === 'airdrop' ? 'Airdrop Sent' : isReceive ? 'Token Received' : 'Token Sent'}
                          </h4>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            {formatTime(txDate)}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          tx.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400'
                            : tx.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tx.status === 'completed' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : tx.status === 'failed' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{tx.status}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className={`text-lg font-black mb-3 ${
                        isReceive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isReceive ? '+' : '-'}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.token_type}
                      </div>

                      {/* Recipients for airdrop */}
                      {tx.type === 'airdrop' && tx.recipients_count && (
                        <div className="flex items-center gap-1 text-xs text-white/50 mb-3">
                          <Users className="w-3 h-3" />
                          <span>{tx.recipients_count} recipients</span>
                        </div>
                      )}

                      {/* Transaction Hash */}
                      {tx.transaction_hash && (
                        <div className="bg-black/20 rounded-lg p-3 mb-3 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-white/40 font-medium">Transaction Hash</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyHash(tx.transaction_hash!)}
                              className="h-6 px-2 text-[10px] hover:bg-white/10"
                            >
                              {copiedHash === tx.transaction_hash ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                          <div className="space-y-0.5">
                            {formatHash(tx.transaction_hash).map((chunk, i) => (
                              <p key={i} className="text-[10px] font-mono text-white/60 leading-tight">
                                {chunk}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {tx.notes && (
                        <p className="text-xs text-white/50 mb-3 italic">"{tx.notes}"</p>
                      )}

                      {/* View on Explorer */}
                      {tx.transaction_hash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://bscscan.com/tx/${tx.transaction_hash}`, '_blank')}
                          className="h-8 text-xs gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50 group-hover:border-primary/30 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on BscScan
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {/* Load More Button */}
        {displayCount < transactions.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center pt-4"
          >
            <Button
              onClick={loadMore}
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              Load More ({transactions.length - displayCount} remaining)
            </Button>
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
};