'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: string;
  filename?: string;
  selectedIds?: string[];
}

export function ExportDialog({
  open,
  onOpenChange,
  endpoint,
  filename = 'export',
  selectedIds = [],
}: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        format,
        includeAttachments: includeAttachments.toString(),
      });
      
      if (selectedIds.length > 0) {
        params.append('ids', selectedIds.join(','));
      }

      const response = await api.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'excel' ? 'xlsx' : format;
      link.setAttribute('download', `${filename}-${Date.now()}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export completed successfully');
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Export failed', {
        description: err.response?.data?.message || 'Failed to export data',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'excel' | 'csv' | 'pdf')}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="excel" id="excel" />
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <Label htmlFor="excel" className="cursor-pointer font-medium">
                    Excel (.xlsx)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Best for data analysis and spreadsheets
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="csv" id="csv" />
                <Table className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <Label htmlFor="csv" className="cursor-pointer font-medium">
                    CSV (.csv)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Universal format, compatible with all tools
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="pdf" id="pdf" />
                <FileText className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <Label htmlFor="pdf" className="cursor-pointer font-medium">
                    PDF (.pdf)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Print-ready format with formatting
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="attachments"
              checked={includeAttachments}
              onCheckedChange={(checked) => setIncludeAttachments(checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="attachments" className="cursor-pointer font-medium">
                Include attachments
              </Label>
              <p className="text-xs text-muted-foreground">
                Export will include all file attachments (may take longer)
              </p>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium">
                Exporting {selectedIds.length} selected item{selectedIds.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
