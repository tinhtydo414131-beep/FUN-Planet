import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Users, Gamepad2, Flag, Calendar, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExportConfig {
  type: 'users' | 'games' | 'reports' | 'transactions';
  dateRange: 'all' | '7d' | '30d' | '90d';
}

const EXPORT_TYPES = [
  { value: 'users', label: 'Người dùng', icon: Users, description: 'Danh sách tất cả người dùng' },
  { value: 'games', label: 'Games', icon: Gamepad2, description: 'Games do người dùng tải lên' },
  { value: 'reports', label: 'Báo cáo vi phạm', icon: Flag, description: 'Reports cần xử lý' },
  { value: 'transactions', label: 'Giao dịch', icon: FileText, description: 'Lịch sử giao dịch CAMLY' }
];

const DATE_RANGES = [
  { value: 'all', label: 'Tất cả' },
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: '90d', label: '90 ngày qua' }
];

export function AdminCSVExport() {
  const [config, setConfig] = useState<ExportConfig>({
    type: 'users',
    dateRange: 'all'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<{ type: string; date: string; count: number }[]>([]);

  const getDateFilter = (range: string) => {
    if (range === 'all') return null;
    const days = parseInt(range);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      toast.error("Không có dữ liệu để xuất!");
      return 0;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle special characters and commas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return data.length;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const dateFilter = getDateFilter(config.dateRange);
      let data: Record<string, unknown>[] = [];
      let filename = '';

      switch (config.type) {
        case 'users': {
          let query = supabase
            .from('profiles')
            .select('id, username, email, wallet_balance, total_plays, total_friends, created_at');
          
          if (dateFilter) {
            query = query.gte('created_at', dateFilter);
          }

          const { data: users, error } = await query.order('created_at', { ascending: false });
          
          if (error) throw error;
          data = (users || []).map(u => ({
            ID: u.id,
            Username: u.username,
            Email: u.email,
            'Wallet Balance': u.wallet_balance || 0,
            'Total Plays': u.total_plays || 0,
            'Total Friends': u.total_friends || 0,
            'Created At': new Date(u.created_at || '').toLocaleDateString('vi-VN')
          }));
          filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }

        case 'games': {
          let query = supabase
            .from('uploaded_games')
            .select('id, title, description, status, play_count, created_at, user_id');
          
          if (dateFilter) {
            query = query.gte('created_at', dateFilter);
          }

          const { data: games, error } = await query.order('created_at', { ascending: false });
          
          if (error) throw error;
          data = (games || []).map(g => ({
            ID: g.id,
            Title: g.title,
            Description: g.description || '',
            Status: g.status,
            'Play Count': g.play_count || 0,
            'User ID': g.user_id,
            'Created At': new Date(g.created_at || '').toLocaleDateString('vi-VN')
          }));
          filename = `games_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }

        case 'reports': {
          let query = supabase
            .from('comment_reports')
            .select('id, reason, details, status, created_at, reporter_id, comment_id');
          
          if (dateFilter) {
            query = query.gte('created_at', dateFilter);
          }

          const { data: reports, error } = await query.order('created_at', { ascending: false });
          
          if (error) throw error;
          data = (reports || []).map(r => ({
            ID: r.id,
            Reason: r.reason,
            Details: r.details || '',
            Status: r.status,
            'Reporter ID': r.reporter_id,
            'Comment ID': r.comment_id,
            'Created At': new Date(r.created_at || '').toLocaleDateString('vi-VN')
          }));
          filename = `reports_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }

        case 'transactions': {
          let query = supabase
            .from('camly_coin_transactions')
            .select('id, user_id, amount, transaction_type, description, created_at');
          
          if (dateFilter) {
            query = query.gte('created_at', dateFilter);
          }

          const { data: txs, error } = await query.order('created_at', { ascending: false }).limit(1000);
          
          if (error) throw error;
          data = (txs || []).map(t => ({
            ID: t.id,
            'User ID': t.user_id,
            Amount: t.amount,
            Type: t.transaction_type,
            Description: t.description || '',
            'Created At': new Date(t.created_at || '').toLocaleDateString('vi-VN')
          }));
          filename = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }
      }

      const count = exportToCSV(data, filename);
      
      if (count > 0) {
        setExportHistory(prev => [
          { type: config.type, date: new Date().toLocaleString('vi-VN'), count },
          ...prev.slice(0, 4)
        ]);
        toast.success(`✅ Đã xuất ${count} bản ghi!`);
      }

    } catch (error) {
      console.error('Export error:', error);
      toast.error("Lỗi xuất dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedType = EXPORT_TYPES.find(t => t.value === config.type);

  return (
    <Card className="border-2 border-blue-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-500" />
          Xuất báo cáo CSV
        </CardTitle>
        <CardDescription>
          Xuất dữ liệu moderation để phân tích
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Export type selection */}
        <div className="space-y-2">
          <Label>Loại dữ liệu</Label>
          <Select value={config.type} onValueChange={(v) => setConfig({ ...config, type: v as ExportConfig['type'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPORT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedType && (
            <p className="text-xs text-muted-foreground">{selectedType.description}</p>
          )}
        </div>

        {/* Date range selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Khoảng thời gian
          </Label>
          <Select value={config.dateRange} onValueChange={(v) => setConfig({ ...config, dateRange: v as ExportConfig['dateRange'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang xuất...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Xuất CSV
            </>
          )}
        </Button>

        {/* Export history */}
        {exportHistory.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-semibold text-muted-foreground">Lịch sử xuất gần đây:</p>
            <div className="space-y-2">
              {exportHistory.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm capitalize">{item.type}</span>
                  <Badge variant="outline" className="text-xs">{item.count} rows</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{item.date}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}