'use client';

import { useState, useEffect } from 'react';
import { Clock, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface RecentFile {
  id: string;
  fileNumber: string;
  subject: string;
  priority: string;
  status: string;
  lastAccessedAt: string;
}

export function RecentFiles() {
  const [files, setFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const fetchRecentFiles = async () => {
    try {
      const response = await api.get('/files/recent');
      setFiles(response.data.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error('Failed to fetch recent files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Files
          </CardTitle>
          <CardDescription>Your recently accessed files will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recent files</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Files
        </CardTitle>
        <CardDescription>Quick access to your recently viewed files</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file) => (
            <Link
              key={file.id}
              href={`/files/${file.id}`}
              className="block p-3 rounded-lg border hover:bg-muted/50 transition-all hover:shadow-sm group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm truncate">{file.fileNumber}</span>
                    <Badge variant={getPriorityColor(file.priority)} className="text-xs">
                      {file.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{file.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(file.lastAccessedAt), { addSuffix: true })}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </Link>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-3" asChild>
          <Link href="/files">View all files</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
