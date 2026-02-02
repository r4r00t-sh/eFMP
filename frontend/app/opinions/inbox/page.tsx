'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  Eye,
  Building2,
  User,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface OpinionRequest {
  id: string;
  status: string;
  requestReason: string;
  createdAt: string;
  file: {
    id: string;
    fileNumber: string;
    subject: string;
    priority: string;
    department: { name: string; code: string };
    createdBy: { name: string };
  };
  requestedBy: { name: string };
  requestedFromDepartment: { name: string; code: string };
}

export default function OpinionInboxPage() {
  const router = useRouter();
  const [opinions, setOpinions] = useState<OpinionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpinions();
  }, []);

  const fetchOpinions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/opinions/pending');
      setOpinions(response.data);
    } catch (error: any) {
      toast.error('Failed to load opinion requests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Opinion Inbox
          </h1>
          <p className="text-muted-foreground mt-1">
            Files requiring your department's opinion
          </p>
        </div>
        <Button variant="outline" onClick={fetchOpinions}>
          Refresh
        </Button>
      </div>

      {opinions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No opinion requests</h3>
            <p className="text-muted-foreground">
              You don't have any pending opinion requests at the moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opinions.map((opinion) => (
                  <TableRow key={opinion.id} className="cursor-pointer" onClick={() => router.push(`/opinions/${opinion.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <code className="text-sm font-mono font-medium">{opinion.file.fileNumber}</code>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {opinion.file.subject}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{opinion.requestedBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{opinion.requestedFromDepartment.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {opinion.requestReason || 'No reason provided'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          opinion.status === 'pending' && 'bg-amber-500/10 text-amber-600',
                          opinion.status === 'responded' && 'bg-green-500/10 text-green-600',
                          opinion.status === 'returned' && 'bg-slate-500/10 text-slate-600',
                        )}
                      >
                        {opinion.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(opinion.createdAt), 'MMM d, yyyy')}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(opinion.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/opinions/${opinion.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

