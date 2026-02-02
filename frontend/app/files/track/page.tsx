'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  AlertTriangle,
  Search,
  MapPin,
  TrendingUp,
  Filter,
  ArrowUpDown,
  Route,
  ChevronRight,
  Building2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

function TrackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<unknown[]>([]);
  const [allFiles, setAllFiles] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [searchQuery, statusFilter, priorityFilter, allFiles]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/files');
      let fetchedFiles = response.data?.data || response.data || [];
      if (!Array.isArray(fetchedFiles)) {
        fetchedFiles = [];
      }
      setAllFiles(fetchedFiles);
      setFiles(fetchedFiles);
    } catch (error: unknown) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = [...allFiles];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((file) => file.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((file) => file.priority === priorityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (file) =>
          file.fileNumber?.toLowerCase().includes(query) ||
          file.subject?.toLowerCase().includes(query)
      );
    }

    setFiles(filtered);
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
      PENDING: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', icon: Clock, label: 'Pending' },
      IN_PROGRESS: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: TrendingUp, label: 'In Progress' },
      APPROVED: { color: 'text-green-600', bgColor: 'bg-green-500/10', icon: CheckCircle2, label: 'Approved' },
      REJECTED: { color: 'text-red-600', bgColor: 'bg-red-500/10', icon: XCircle, label: 'Rejected' },
      ON_HOLD: { color: 'text-gray-600', bgColor: 'bg-gray-500/10', icon: Pause, label: 'On Hold' },
      RECALLED: { color: 'text-purple-600', bgColor: 'bg-purple-500/10', icon: AlertTriangle, label: 'Recalled' },
    };
    return config[status] || config.PENDING;
  };

  const getPriorityConfig = (priority: string) => {
    const config: Record<string, { color: string; bgColor: string; label: string }> = {
      LOW: { color: 'text-slate-600', bgColor: 'bg-slate-500', label: 'Low' },
      NORMAL: { color: 'text-blue-600', bgColor: 'bg-blue-500', label: 'Normal' },
      HIGH: { color: 'text-orange-600', bgColor: 'bg-orange-500', label: 'High' },
      URGENT: { color: 'text-red-600', bgColor: 'bg-red-500', label: 'Urgent' },
    };
    return config[priority] || config.NORMAL;
  };

  const stats = {
    total: allFiles.length,
    pending: allFiles.filter((f) => f.status === 'PENDING').length,
    inProgress: allFiles.filter((f) => f.status === 'IN_PROGRESS').length,
    completed: allFiles.filter((f) => f.status === 'APPROVED').length,
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Route className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Track Files</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Select a file to view its complete journey and routing history
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md", statusFilter === 'all' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md", statusFilter === 'PENDING' && 'ring-2 ring-amber-500')}
          onClick={() => setStatusFilter('PENDING')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md", statusFilter === 'IN_PROGRESS' && 'ring-2 ring-blue-500')}
          onClick={() => setStatusFilter('IN_PROGRESS')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md", statusFilter === 'APPROVED' && 'ring-2 ring-green-500')}
          onClick={() => setStatusFilter('APPROVED')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by file number or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-10">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      <Card>
        <CardContent className="p-0">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No files found</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No files available to track'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px] pl-6">File Number</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[150px]">Current Location</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px]">Priority</TableHead>
                  <TableHead className="w-[60px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => {
                  const statusConfig = getStatusConfig(file.status);
                  const priorityConfig = getPriorityConfig(file.priority);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <TableRow 
                      key={file.id} 
                      className="cursor-pointer group h-16"
                      onClick={() => router.push(`/files/track/${file.id}`)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          {file.isRedListed && (
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                          )}
                          <code className="text-sm font-mono font-medium">{file.fileNumber}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium truncate max-w-[300px] group-hover:text-primary transition-colors">
                          {file.subject}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{file.currentDivision?.name || file.department?.code || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn("gap-1 text-xs", statusConfig.color, statusConfig.bgColor, "border-0")}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full", priorityConfig.bgColor)} />
                          <span className={cn("text-sm", priorityConfig.color)}>
                            {priorityConfig.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6">
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      {files.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {files.length} of {allFiles.length} files • Click on a file to view its journey
        </p>
      )}
    </div>
  );
}

export default function FileTrackingPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-6 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
