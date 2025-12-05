import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Video, Clock, Signal, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface CallRecord {
  id: string;
  call_type: string;
  caller_id: string;
  callee_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  duration_seconds: number | null;
  quality_stats: {
    avgBitrate?: number;
    avgPacketLoss?: number;
    avgLatency?: number;
    quality?: string;
  } | null;
  caller?: {
    username: string;
    avatar_url: string | null;
  };
  callee?: {
    username: string;
    avatar_url: string | null;
  };
}

export default function CallHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCallHistory();
    }
  }, [user]);

  const fetchCallHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("video_calls")
      .select(`
        *,
        caller:profiles!video_calls_caller_id_fkey(username, avatar_url),
        callee:profiles!video_calls_callee_id_fkey(username, avatar_url)
      `)
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setCalls(data as unknown as CallRecord[]);
    }
    setLoading(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCallIcon = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    
    if (call.status === "missed" || call.status === "rejected") {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    }
    if (isOutgoing) {
      return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
    }
    return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
  };

  const getOtherParticipant = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    return isOutgoing ? call.callee : call.caller;
  };

  const getQualityColor = (quality: string | undefined) => {
    switch (quality) {
      case "Excellent": return "bg-green-500";
      case "Good": return "bg-blue-500";
      case "Fair": return "bg-yellow-500";
      case "Poor": return "bg-red-500";
      default: return "bg-muted";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="text-green-500 border-green-500">Completed</Badge>;
      case "missed":
        return <Badge variant="outline" className="text-destructive border-destructive">Missed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Declined</Badge>;
      case "ongoing":
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Ongoing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view call history</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Call History</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No calls yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your call history will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const participant = getOtherParticipant(call);
              const qualityStats = call.quality_stats;

              return (
                <Card key={call.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={participant?.avatar_url || ""} />
                        <AvatarFallback>
                          {participant?.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getCallIcon(call)}
                          <span className="font-medium truncate">
                            {participant?.username || "Unknown"}
                          </span>
                          {call.call_type === "video" ? (
                            <Video className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                          </span>
                          {call.duration_seconds && call.duration_seconds > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(call.duration_seconds)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(call.status)}
                        
                        {qualityStats?.quality && (
                          <div className="flex items-center gap-1.5">
                            <Signal className="h-3 w-3 text-muted-foreground" />
                            <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getQualityColor(qualityStats.quality)}`}>
                              {qualityStats.quality}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {qualityStats && call.status === "completed" && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Bitrate</p>
                            <p className="text-sm font-medium">
                              {qualityStats.avgBitrate 
                                ? `${(qualityStats.avgBitrate / 1000).toFixed(0)} kbps`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Packet Loss</p>
                            <p className="text-sm font-medium">
                              {qualityStats.avgPacketLoss !== undefined
                                ? `${qualityStats.avgPacketLoss.toFixed(1)}%`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Latency</p>
                            <p className="text-sm font-medium">
                              {qualityStats.avgLatency
                                ? `${qualityStats.avgLatency.toFixed(0)} ms`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
