'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  QrCode,
  Download,
  Printer,
  RefreshCw,
  MapPin,
  Clock,
  User,
  History,
  ScanLine,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface QRCodeData {
  id: string;
  qrCodeData: string;
  scanCount: number;
  lastScannedAt: string | null;
}

interface ScanLog {
  id: string;
  scannedByName: string;
  location: string;
  department: string;
  division: string;
  remarks: string;
  createdAt: string;
}

interface FileQRCodeProps {
  fileId: string;
  fileNumber: string;
}

export function FileQRCode({ fileId, fileNumber }: FileQRCodeProps) {
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  const generateQRCode = async () => {
    setGenerating(true);
    try {
      const response = await api.post(`/documents/files/${fileId}/qrcode`);
      setQrCode(response.data.qrCode);
      
      // Fetch the QR image
      const imageResponse = await api.get(`/documents/qr/${response.data.qrCode.id}/image`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([imageResponse.data]));
      setQrImageUrl(url);
      
      toast.success('QR code generated successfully');
    } catch (error: unknown) {
      toast.error('Failed to generate QR code', {
        description: error.response?.data?.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const fetchScanHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/documents/files/${fileId}/scan-history`);
      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
        
        // Fetch the QR image
        const imageResponse = await api.get(`/documents/qr/${response.data.qrCode.id}/image`, {
          responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([imageResponse.data]));
        setQrImageUrl(url);
      }
      setScans(response.data.scans || []);
    } catch (error: unknown) {
      // QR code doesn't exist yet
      setQrCode(null);
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanHistory();
  }, [fileId]);

  const downloadQRCode = () => {
    if (!qrImageUrl) return;
    
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `QR-${fileNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code downloaded');
  };

  const printQRCode = () => {
    if (!qrImageUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${fileNumber}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            img {
              width: 300px;
              height: 300px;
            }
            h2 {
              margin-top: 20px;
              font-size: 18px;
            }
            p {
              color: #666;
              font-size: 14px;
            }
            @media print {
              body { height: auto; }
            }
          </style>
        </head>
        <body>
          <img src="${qrImageUrl}" alt="QR Code" />
          <h2>${fileNumber}</h2>
          <p>Scan to track file</p>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-muted-foreground" />
          <h4 className="font-medium">Physical File Tracking</h4>
        </div>
        {qrCode && (
          <Badge variant="outline" className="gap-1">
            <ScanLine className="h-3 w-3" />
            {qrCode.scanCount} scan(s)
          </Badge>
        )}
      </div>

      {qrCode && qrImageUrl ? (
        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-white border">
            <img 
              src={qrImageUrl} 
              alt="QR Code" 
              className="w-48 h-48"
            />
            <p className="mt-2 font-mono text-sm text-muted-foreground">{fileNumber}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadQRCode}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={printQRCode}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { fetchScanHistory(); setShowHistoryDialog(true); }}
            >
              <History className="h-4 w-4 mr-2" />
              Scan History
            </Button>
          </div>

          {/* Last Scan Info */}
          {qrCode.lastScannedAt && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last scanned {formatDistanceToNow(new Date(qrCode.lastScannedAt), { addSuffix: true })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-lg border-2 border-dashed text-center">
          <QrCode className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-4">
            Generate a QR code to track physical file movement
          </p>
          <Button onClick={generateQRCode} disabled={generating}>
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </>
            )}
          </Button>
        </div>
      )}

      {/* Scan History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan History</DialogTitle>
            <DialogDescription>
              Physical tracking history for file {fileNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-auto">
            {scans.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No scans recorded yet</p>
                <p className="text-sm">
                  Scan the QR code to log physical file location
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scanned By</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {scan.scannedByName || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {scan.location || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {scan.department || '-'}
                        {scan.division && ` / ${scan.division}`}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(scan.createdAt), 'MMM d, yyyy')}</p>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(scan.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

