'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  History,
  Upload,
  Download,
  RotateCcw,
  Clock,
  FileText,
  CheckCircle,
  MoreVertical,
  RefreshCw,
  Eye,
  ArrowLeftRight,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface Version {
  id: string;
  versionNumber: number;
  filename: string;
  size: number;
  mimeType: string;
  uploadedById: string;
  changeDescription: string;
  isLatest: boolean;
  checksum: string;
  createdAt: string;
  downloadUrl: string;
}

interface ComparisonResult {
  version1: { versionNumber: number; filename: string; size: number };
  version2: { versionNumber: number; filename: string; size: number };
  differences: { filenameChanged: boolean; sizeChange: number; mimeTypeChanged: boolean };
}

interface FileVersionsProps {
  attachmentId: string;
  attachmentName: string;
  canEdit: boolean;
  onVersionChange?: () => void;
}

export function FileVersions({ attachmentId, attachmentName, canEdit, onVersionChange }: FileVersionsProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeDescription, setChangeDescription] = useState('');
  const [compareVersions, setCompareVersions] = useState<{ v1: string; v2: string } | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVersions();
  }, [attachmentId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/documents/attachments/${attachmentId}/versions`);
      setVersions(response.data);
    } catch (error: unknown) {
      // If no versions found, it's just the original file
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadNewVersion = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (changeDescription) {
        formData.append('changeDescription', changeDescription);
      }

      await api.post(`/documents/attachments/${attachmentId}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('New version uploaded successfully');
      setShowUploadDialog(false);
      setSelectedFile(null);
      setChangeDescription('');
      fetchVersions();
      onVersionChange?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Failed to upload new version', {
        description: err.response?.data?.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const restoreVersion = async (versionId: string, versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore to version ${versionNumber}?`)) return;

    try {
      await api.post(`/documents/versions/${versionId}/restore`);
      toast.success(`Restored to version ${versionNumber}`);
      fetchVersions();
      onVersionChange?.();
    } catch (error: unknown) {
      toast.error('Failed to restore version');
    }
  };

  const downloadVersion = async (versionId: string, filename: string) => {
    try {
      const response = await api.get(`/documents/versions/${versionId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: unknown) {
      toast.error('Failed to download version');
    }
  };

  const compareVersionsHandler = async () => {
    if (!compareVersions) return;

    try {
      const response = await api.get('/documents/versions/compare', {
        params: { v1: compareVersions.v1, v2: compareVersions.v2 },
      });
      setComparisonResult(response.data);
      setShowCompareDialog(true);
    } catch (error: unknown) {
      toast.error('Failed to compare versions');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
        Loading versions...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h4 className="font-medium">Version History</h4>
          <Badge variant="outline">{versions.length || 1} version(s)</Badge>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            New Version
          </Button>
        )}
      </div>

      {/* Version List */}
      <div className="space-y-2">
        {versions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground rounded-lg bg-muted/30">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">This is the original version</p>
            <p className="text-xs">Upload a new version to start tracking changes</p>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className={cn(
                "p-3 rounded-lg border flex items-center justify-between gap-4",
                version.isLatest && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold",
                  version.isLatest ? "bg-primary/10 text-primary" : "bg-muted"
                )}>
                  v{version.versionNumber}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{version.filename}</p>
                    {version.isLatest && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatBytes(version.size)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}</span>
                  </div>
                  {version.changeDescription && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {'\u0022'}{version.changeDescription}{'\u0022'}
                    </p>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => downloadVersion(version.id, version.filename)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  {!version.isLatest && canEdit && (
                    <DropdownMenuItem onClick={() => restoreVersion(version.id, version.versionNumber)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore This Version
                    </DropdownMenuItem>
                  )}
                  {index < versions.length - 1 && (
                    <DropdownMenuItem onClick={() => {
                      setCompareVersions({ v1: versions[index + 1].id, v2: version.id });
                      compareVersionsHandler();
                    }}>
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Compare with Previous
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Upload a new version of {'\u0022'}{attachmentName}{'\u0022'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select File</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  selectedFile ? "border-primary bg-primary/5" : "hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{selectedFile.name}</span>
                    <Badge variant="outline">{formatBytes(selectedFile.size)}</Badge>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to select or drag and drop
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Change Description (Optional)</Label>
              <Input
                placeholder="What changed in this version?"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={uploadNewVersion} disabled={!selectedFile || uploading}>
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version Comparison</DialogTitle>
          </DialogHeader>

          {comparisonResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Version {comparisonResult.version1.versionNumber}</p>
                  <p className="font-medium truncate">{comparisonResult.version1.filename}</p>
                  <p className="text-sm text-muted-foreground">{formatBytes(comparisonResult.version1.size)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Version {comparisonResult.version2.versionNumber}</p>
                  <p className="font-medium truncate">{comparisonResult.version2.filename}</p>
                  <p className="text-sm text-muted-foreground">{formatBytes(comparisonResult.version2.size)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Changes</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filename Changed</span>
                    <span>{comparisonResult.differences.filenameChanged ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size Change</span>
                    <span className={cn(
                      comparisonResult.differences.sizeChange > 0 && 'text-green-600',
                      comparisonResult.differences.sizeChange < 0 && 'text-red-600',
                    )}>
                      {comparisonResult.differences.sizeChange > 0 ? '+' : ''}
                      {formatBytes(Math.abs(comparisonResult.differences.sizeChange))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type Changed</span>
                    <span>{comparisonResult.differences.mimeTypeChanged ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowCompareDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

