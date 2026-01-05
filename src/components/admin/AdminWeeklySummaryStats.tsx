import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  Users,
  Gamepad2,
  Gem,
  Trophy,
  Download,
} from "lucide-react";
import { format } from "date-fns";

interface WeeklySummaryLog {
  id: string;
  user_id: string;
  week_start: string;
  games_played: number;
  camly_earned: number;
  new_achievements: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface SummaryStats {
  totalSummaries: number;
  totalGamesPlayed: number;
  totalCamlyDistributed: number;
  totalAchievements: number;
  uniqueUsers: number;
}

export function AdminWeeklySummaryStats() {
  const [logs, setLogs] = useState<WeeklySummaryLog[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalSummaries: 0,
    totalGamesPlayed: 0,
    totalCamlyDistributed: 0,
    totalAchievements: 0,
    uniqueUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAvailableWeeks();
  }, []);

  useEffect(() => {
    loadSummaryLogs();
  }, [selectedWeek]);

  const loadAvailableWeeks = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_summary_logs")
        .select("week_start")
        .order("week_start", { ascending: false });

      if (error) throw error;

      const uniqueWeeks = [...new Set((data || []).map((w) => w.week_start))];
      setAvailableWeeks(uniqueWeeks);
    } catch (error) {
      console.error("Load available weeks error:", error);
    }
  };

  const loadSummaryLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("weekly_summary_logs")
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (selectedWeek !== "all") {
        query = query.eq("week_start", selectedWeek);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as WeeklySummaryLog[];
      setLogs(typedData);

      // Calculate stats
      const uniqueUserIds = new Set(typedData.map((l) => l.user_id));
      setStats({
        totalSummaries: typedData.length,
        totalGamesPlayed: typedData.reduce((sum, l) => sum + (l.games_played || 0), 0),
        totalCamlyDistributed: typedData.reduce((sum, l) => sum + (l.camly_earned || 0), 0),
        totalAchievements: typedData.reduce((sum, l) => sum + (l.new_achievements || 0), 0),
        uniqueUsers: uniqueUserIds.size,
      });
    } catch (error) {
      console.error("Load summary logs error:", error);
      toast.error("Failed to load weekly summary logs");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      const headers = ["Username", "Week Start", "Games Played", "CAMLY Earned", "New Achievements", "Sent At"];
      const rows = logs.map((log) => [
        log.profiles?.username || "Unknown",
        format(new Date(log.week_start), "yyyy-MM-dd"),
        log.games_played.toString(),
        log.camly_earned.toString(),
        log.new_achievements.toString(),
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm"),
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `weekly-summaries-${selectedWeek === "all" ? "all" : selectedWeek}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${logs.length} records to CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter & Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filter by week:</span>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📅 All Weeks</SelectItem>
              {availableWeeks.map((week) => (
                <SelectItem key={week} value={week}>
                  {format(new Date(week), "MMM d, yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedWeek !== "all" && (
            <Badge variant="secondary">
              Showing: {format(new Date(selectedWeek), "MMM d, yyyy")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={exporting || logs.length === 0}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadSummaryLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Summaries</p>
                <p className="text-xl font-bold">{stats.totalSummaries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-xl font-bold">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Games Played</p>
                <p className="text-xl font-bold">{stats.totalGamesPlayed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">CAMLY Earned</p>
                <p className="text-xl font-bold">{stats.totalCamlyDistributed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-xl font-bold">{stats.totalAchievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Summary History
            {logs.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {logs.length} records
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No weekly summaries found</p>
              <p className="text-sm">
                {selectedWeek !== "all" 
                  ? "Try selecting a different week or 'All Weeks'" 
                  : "Summaries will appear here after the first send"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Week Start</TableHead>
                  <TableHead className="text-center">Games</TableHead>
                  <TableHead className="text-center">CAMLY</TableHead>
                  <TableHead className="text-center">Achievements</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {log.profiles?.username?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{log.profiles?.username || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {format(new Date(log.week_start), "MMM d, yyyy")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-500/20 text-green-600">
                        🎮 {log.games_played}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-yellow-500/20 text-yellow-600">
                        💎 {log.camly_earned.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-purple-500/20 text-purple-600">
                        🏆 {log.new_achievements}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
