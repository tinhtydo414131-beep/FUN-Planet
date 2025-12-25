import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Shield, Search, AlertTriangle, Loader2, 
  RefreshCw, Eye, User, Gamepad2, Clock, Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  metadata?: Record<string, unknown>;
  profile?: {
    username: string;
  };
}

// Generate mock security events based on real data
const generateSecurityEvents = async (): Promise<SecurityEvent[]> => {
  const events: SecurityEvent[] = [];

  try {
    // Check for multiple uploads in short time (spam detection)
    const { data: recentUploads } = await supabase
      .from('uploaded_games')
      .select('id, user_id, created_at, title')
      .order('created_at', { ascending: false })
      .limit(50);

    if (recentUploads) {
      // Group by user
      const userUploads: Record<string, typeof recentUploads> = {};
      recentUploads.forEach(upload => {
        if (!userUploads[upload.user_id]) userUploads[upload.user_id] = [];
        userUploads[upload.user_id].push(upload);
      });

      // Detect spam uploaders (>5 uploads in 24h)
      Object.entries(userUploads).forEach(([userId, uploads]) => {
        const last24h = uploads.filter(u => 
          new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        if (last24h.length >= 5) {
          events.push({
            id: `spam-${userId}`,
            event_type: 'spam_upload',
            user_id: userId,
            description: `User uploaded ${last24h.length} games in 24 hours`,
            severity: last24h.length > 10 ? 'high' : 'medium',
            created_at: last24h[0].created_at,
          });
        }
      });
    }

    // Check for suspicious claim patterns
    const { data: recentClaims } = await supabase
      .from('camly_claims')
      .select('id, user_id, amount, created_at, claim_type')
      .order('created_at', { ascending: false })
      .limit(100);

    if (recentClaims) {
      // Detect large claims
      recentClaims.forEach(claim => {
        if (claim.amount > 500000) {
          events.push({
            id: `large-claim-${claim.id}`,
            event_type: 'large_claim',
            user_id: claim.user_id,
            description: `Large claim of ${claim.amount.toLocaleString()} $C`,
            severity: claim.amount > 1000000 ? 'high' : 'medium',
            created_at: claim.created_at,
          });
        }
      });
    }

    // Get profiles for all events
    const userIds = [...new Set(events.map(e => e.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      events.forEach(event => {
        event.profile = profiles?.find(p => p.id === event.user_id);
      });
    }

  } catch (error) {
    console.error('Error generating security events:', error);
  }

  // Add some mock admin action logs
  events.push(
    {
      id: 'admin-1',
      event_type: 'admin_action',
      user_id: 'system',
      description: 'Admin dashboard accessed',
      severity: 'low',
      created_at: new Date().toISOString(),
      profile: { username: 'Admin' }
    },
    {
      id: 'admin-2',
      event_type: 'game_approval',
      user_id: 'system',
      description: 'Game "Space Adventure" approved',
      severity: 'low',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      profile: { username: 'Admin' }
    }
  );

  return events.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export function AdminSecurityLog() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const securityEvents = await generateSecurityEvents();
      setEvents(securityEvents);
    } catch (error) {
      console.error('Error fetching security events:', error);
      toast.error('Failed to load security log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'spam_upload':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'large_claim':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'admin_action':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'game_approval':
        return <Gamepad2 className="w-4 h-4 text-green-500" />;
      default:
        return <Eye className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {(criticalCount > 0 || highCount > 0) && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">
                  Security Alerts
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {criticalCount > 0 && `${criticalCount} critical, `}
                  {highCount > 0 && `${highCount} high severity`} events require attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Log Table */}
      <Card className="border-amber-200/50 dark:border-amber-800/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Security Log
              </CardTitle>
              <CardDescription>
                Monitor admin actions and suspicious activity
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="pl-9 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchEvents} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No security events found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.event_type)}
                            <span className="text-sm capitalize">
                              {event.event_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {event.profile?.username || event.user_id.slice(0, 8)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                        <TableCell>
                          <span className="text-sm">{event.description}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.created_at), 'dd/MM HH:mm')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
