'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Clock,
  User,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  RotateCcw,
  Pause,
  AlertTriangle,
  Send,
  Eye,
  TrendingUp,
  ArrowRight,
  Route,
  ChevronRight,
  Play,
  Circle,
  Mail,
  Tag,
  Hash,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface FileTracking {
  id: string;
  fileNumber: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  isRedListed: boolean;
  createdAt: string;
  dueDate?: string;
  department: { id: string; name: string; code: string };
  currentDivision?: { id: string; name: string };
  createdBy: { id: string; name: string };
  assignedTo?: { id: string; name: string };
  routingHistory: {
    id: string;
    action: string;
    remarks?: string;
    createdAt: string;
    fromUserId?: string;
    toUserId?: string;
    toDivisionId?: string;
  }[];
}

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Pending' },
  IN_PROGRESS: { icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'In Progress' },
  APPROVED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Approved' },
  REJECTED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Rejected' },
  RETURNED: { icon: RotateCcw, color: 'text-orange-600', bgColor: 'bg-orange-500/10', label: 'Returned' },
  ON_HOLD: { icon: Pause, color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'On Hold' },
  RECALLED: { icon: AlertTriangle, color: 'text-purple-600', bgColor: 'bg-purple-500/10', label: 'Recalled' },
};

const actionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; borderColor: string; label: string }> = {
  CREATED: { icon: FileText, color: 'text-emerald-600', bgColor: 'bg-emerald-500', borderColor: 'border-emerald-500', label: 'Created' },
  FORWARDED: { icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-500', borderColor: 'border-blue-500', label: 'Forwarded' },
  APPROVED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500', borderColor: 'border-green-500', label: 'Approved' },
  REJECTED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500', borderColor: 'border-red-500', label: 'Rejected' },
  RETURNED_TO_HOST: { icon: RotateCcw, color: 'text-orange-600', bgColor: 'bg-orange-500', borderColor: 'border-orange-500', label: 'Returned' },
  RETURNED_TO_PREVIOUS: { icon: RotateCcw, color: 'text-orange-600', bgColor: 'bg-orange-500', borderColor: 'border-orange-500', label: 'Returned' },
  ON_HOLD: { icon: Pause, color: 'text-gray-600', bgColor: 'bg-gray-500', borderColor: 'border-gray-500', label: 'On Hold' },
  RELEASED_FROM_HOLD: { icon: Play, color: 'text-blue-600', bgColor: 'bg-blue-500', borderColor: 'border-blue-500', label: 'Released' },
  RECALLED: { icon: AlertTriangle, color: 'text-purple-600', bgColor: 'bg-purple-500', borderColor: 'border-purple-500', label: 'Recalled' },
  DISPATCHED: { icon: Send, color: 'text-green-600', bgColor: 'bg-green-500', borderColor: 'border-green-500', label: 'Dispatched' },
  CLOSED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500', borderColor: 'border-green-500', label: 'Closed' },
  OPINION_REQUESTED: { icon: Mail, color: 'text-indigo-600', bgColor: 'bg-indigo-500', borderColor: 'border-indigo-500', label: 'Opinion Requested' },
  CONSULTATION_SENT: { icon: Mail, color: 'text-indigo-600', bgColor: 'bg-indigo-500', borderColor: 'border-indigo-500', label: 'Opinion Requested' },
  OPINION_PROVIDED: { icon: CheckCircle, color: 'text-indigo-600', bgColor: 'bg-indigo-500', borderColor: 'border-indigo-500', label: 'Opinion Provided' },
  CONSULTATION_RETURNED: { icon: RotateCcw, color: 'text-indigo-600', bgColor: 'bg-indigo-500', borderColor: 'border-indigo-500', label: 'Opinion Returned' },
};

const priorityConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  LOW: { color: 'text-slate-600', bgColor: 'bg-slate-500', label: 'Low' },
  NORMAL: { color: 'text-blue-600', bgColor: 'bg-blue-500', label: 'Normal' },
  HIGH: { color: 'text-orange-600', bgColor: 'bg-orange-500', label: 'High' },
  URGENT: { color: 'text-red-600', bgColor: 'bg-red-500', label: 'Urgent' },
};

export default function FileTraceroutePage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<FileTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fileId = params.id as string;

  useEffect(() => {
    fetchFile();
  }, [fileId]);

  // Auto-scroll to the end (current location) when loaded
  useEffect(() => {
    if (file && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          left: scrollRef.current.scrollWidth,
          behavior: 'smooth',
        });
      }, 300);
    }
  }, [file]);

  const fetchFile = async () => {
    try {
      const response = await api.get(`/files/${fileId}`);
      setFile(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Failed to load file', {
        description: err.response?.data?.message || 'File not found',
      });
      router.push('/files/track');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!file) return null;

  const config = statusConfig[file.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const priority = priorityConfig[file.priority] || priorityConfig.NORMAL;

  // Build graph structure for flowchart with branches
  const buildFlowchartGraph = () => {
    // Build complete timeline including creation
    const timeline = [
      {
        id: 'creation',
        action: 'CREATED',
        remarks: `Created by ${file.createdBy.name}`,
        createdAt: file.createdAt,
        isCreation: true,
        fromUserId: null,
        toUserId: file.createdBy.id,
      },
      ...file.routingHistory.map(entry => ({ 
        ...entry, 
        isCreation: false,
        fromUserId: entry.fromUserId || null,
        toUserId: entry.toUserId || null,
      })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const nodes: Array<{
      id: string;
      action: string;
      remarks?: string;
      createdAt: string;
      isCreation: boolean;
      row: number;
      x: number;
      isBranch: boolean;
      isMerge: boolean;
      branchId?: string;
      parentId?: string;
      nextMainX?: number; // X position where branch merges back
    }> = [];

    let currentRow = 0;
    let currentX = 0;
    const activeBranches = new Map<string, { startX: number; row: number }>();

    timeline.forEach((entry, index) => {
      const isOpinionRequest = entry.action === 'OPINION_REQUESTED' || entry.action === 'CONSULTATION_SENT';
      const isOpinionReturn = entry.action === 'OPINION_PROVIDED' || entry.action === 'CONSULTATION_RETURNED';
      const isReturn = entry.action === 'RETURNED_TO_HOST' || entry.action === 'RETURNED_TO_PREVIOUS';

      if (isOpinionRequest) {
        // Add main flow node
        nodes.push({
          id: entry.id,
          action: entry.action,
          remarks: entry.remarks,
          createdAt: entry.createdAt,
          isCreation: entry.isCreation || false,
          row: currentRow,
          x: currentX,
          isBranch: false,
          isMerge: false,
        });
        
        // Start branch
        const branchId = `branch-${currentX}`;
        const branchRow = currentRow + 1;
        activeBranches.set(branchId, { startX: currentX, row: branchRow });
        
        // Add branch start node (on branch row, same X)
        nodes.push({
          id: `${entry.id}-branch-start`,
          action: 'OPINION_REQUESTED',
          remarks: entry.remarks || 'Opinion requested',
          createdAt: entry.createdAt,
          isCreation: false,
          row: branchRow,
          x: currentX,
          isBranch: true,
          isMerge: false,
          branchId,
          parentId: entry.id,
        });
        
        currentX++;
      } else if (isOpinionReturn) {
        // Find active branch
        const branchEntry = Array.from(activeBranches.entries()).pop();
        if (branchEntry) {
          const [branchId, branchInfo] = branchEntry;
          
          // Add opinion provided node on branch row
          nodes.push({
            id: entry.id,
            action: entry.action,
            remarks: entry.remarks || 'Opinion provided',
            createdAt: entry.createdAt,
            isCreation: false,
            row: branchInfo.row,
            x: currentX,
            isBranch: true,
            isMerge: false,
            branchId,
            nextMainX: currentX + 1,
          });
          
          // Add merge node back to main flow
          nodes.push({
            id: `${entry.id}-merge`,
            action: 'OPINION_PROVIDED',
            remarks: 'Opinion returned to main flow',
            createdAt: entry.createdAt,
            isCreation: false,
            row: 0,
            x: currentX + 1,
            isBranch: false,
            isMerge: true,
            branchId,
          });
          
          activeBranches.delete(branchId);
          currentX += 2;
          currentRow = 0;
        } else {
          // No active branch, treat as regular node
          nodes.push({
            id: entry.id,
            action: entry.action,
            remarks: entry.remarks,
            createdAt: entry.createdAt,
            isCreation: entry.isCreation || false,
            row: currentRow,
            x: currentX,
            isBranch: false,
            isMerge: false,
          });
          currentX++;
        }
      } else {
        // Regular node on main flow
        nodes.push({
          id: entry.id,
          action: entry.action,
          remarks: entry.remarks,
          createdAt: entry.createdAt,
          isCreation: entry.isCreation || false,
          row: currentRow,
          x: currentX,
          isBranch: false,
          isMerge: isReturn,
        });
        currentX++;
        
        if (isReturn && currentRow > 0) {
          currentRow = 0;
        }
      }
    });

    return nodes.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.row - b.row;
    });
  };

  const flowchartNodes = buildFlowchartGraph();
  const maxRow = Math.max(...flowchartNodes.map(n => n.row), 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Back Button - Fixed at top */}
      <div className="px-6 py-4 border-b bg-background">
        <Button variant="ghost" className="-ml-2" onClick={() => router.push('/files/track')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Track Files
        </Button>
      </div>

      {/* Split Layout: 80% Left (Flowchart) | 20% Right (Details) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - 80% - Flowchart */}
        <div className="flex-[0.8] flex flex-col border-r bg-muted/20">
          <div className="p-6 border-b bg-background">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                  <Route className="h-6 w-6 text-primary" />
                  File Journey Flowchart
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Visual representation of file movement
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-semibold px-3 py-1.5 bg-muted rounded-md">
                  {file.fileNumber}
                </code>
                {file.isRedListed && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Red Listed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Flowchart Container - Scrollable */}
          <ScrollArea className="flex-1">
            <div 
              ref={scrollRef}
              className="p-8 min-h-full relative"
              style={{ paddingTop: '32px' }}
            >
              {/* Flowchart with Branches */}
              <div className="relative" style={{ minHeight: `${(maxRow + 1) * 240}px` }}>
                {/* Render nodes grouped by row */}
                {Array.from({ length: maxRow + 1 }).map((_, rowIndex) => {
                  const rowNodes = flowchartNodes.filter(n => n.row === rowIndex).sort((a, b) => a.x - b.x);
                  
                  return (
                    <div 
                      key={rowIndex}
                      className="relative flex items-start"
                      style={{ 
                        marginTop: rowIndex > 0 ? '140px' : '20px',
                        minHeight: '240px',
                        paddingTop: rowIndex === 0 ? '20px' : '0',
                      }}
                    >
                      {/* Horizontal flow for this row */}
                      <div className="flex items-center min-w-max gap-4 relative z-10">
                        {rowNodes.map((node, nodeIndex) => {
                          const isLast = node.id === flowchartNodes[flowchartNodes.length - 1]?.id;
                          const actionCfg = actionConfig[node.action] || actionConfig.FORWARDED;
                          const ActionIcon = actionCfg.icon;
                          const nextNode = rowNodes[nodeIndex + 1];
                          const hasNextInRow = !!nextNode;
                          
                          // Find parent node for branch visualization
                          const parentNode = node.parentId ? flowchartNodes.find(n => n.id === node.parentId) : null;
                          const branchStartNode = node.branchId ? flowchartNodes.find(n => n.branchId === node.branchId && n.isBranch && !n.isMerge) : null;

                          return (
                            <div key={node.id} className="flex items-center relative">
                              {/* Vertical connector down (branch start) */}
                              {node.isBranch && !node.isMerge && parentNode && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-32 bg-indigo-500/40 -z-10"
                                  style={{ height: '140px' }}
                                />
                              )}
                              
                              {/* Vertical connector up (merge) */}
                              {node.isMerge && branchStartNode && (
                                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-0.5 h-32 bg-indigo-500/40 -z-10"
                                  style={{ height: '140px' }}
                                />
                              )}

                              {/* Node */}
                              <div className="flex flex-col items-center relative">
                                {/* "Current" label for last node - positioned to avoid overlap */}
                                {isLast && (
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                                    <Badge variant="default" className={cn(
                                      "whitespace-nowrap text-xs animate-bounce",
                                      actionCfg.bgColor,
                                      "text-white"
                                    )}>
                                      <MapPin className="h-3 w-3 mr-1" />
                                      Current
                                    </Badge>
                                  </div>
                                )}

                                {/* Node Circle with Icon - Contained animation */}
                                <div className={cn(
                                  "relative flex items-center justify-center",
                                  isLast && "animate-pulse"
                                )} style={{ padding: '10px' }}>
                                  {/* Outer glow ring for current location - contained */}
                                  {isLast && (
                                    <>
                                      <div className={cn(
                                        "absolute rounded-full",
                                        actionCfg.bgColor,
                                        "animate-ping opacity-30"
                                      )} style={{ 
                                        width: '56px', 
                                        height: '56px', 
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                                      }} />
                                      <div className={cn(
                                        "absolute rounded-full",
                                        actionCfg.bgColor,
                                        "opacity-20"
                                      )} style={{ 
                                        width: '68px', 
                                        height: '68px',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                      }} />
                                    </>
                                  )}
                                  
                                  {/* Main node circle */}
                                  <div className={cn(
                                    "relative h-12 w-12 rounded-full flex items-center justify-center border-2 bg-background shadow-lg z-10",
                                    isLast ? `${actionCfg.borderColor} ring-4 ring-offset-2 ring-offset-background` : 'border-muted-foreground/30',
                                    node.isBranch && 'ring-2 ring-indigo-500/50 border-indigo-500/50',
                                    node.isMerge && 'ring-2 ring-indigo-500/50 border-indigo-500/50',
                                  )}>
                                    <div className={cn(
                                      "h-8 w-8 rounded-full flex items-center justify-center",
                                      actionCfg.bgColor,
                                      node.isBranch && 'bg-indigo-500',
                                      node.isMerge && 'bg-indigo-500',
                                    )}>
                                      <ActionIcon className="h-4 w-4 text-white" />
                                    </div>
                                  </div>
                                </div>

                                {/* Step Number */}
                                <div className={cn(
                                  "mt-2 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                  isLast ? actionCfg.bgColor + ' text-white' : 'bg-muted text-muted-foreground',
                                  node.isBranch && 'bg-indigo-500 text-white',
                                  node.isMerge && 'bg-indigo-500 text-white',
                                )}>
                                  {node.x + 1}
                                </div>

                                {/* Node Label Card - Compact */}
                                <div className={cn(
                                  "mt-2 p-2 rounded-lg border bg-card text-card-foreground shadow-sm w-32",
                                  isLast && 'ring-2 ' + actionCfg.borderColor.replace('border-', 'ring-'),
                                  node.isBranch && 'border-indigo-500/50 bg-indigo-500/5',
                                  node.isMerge && 'border-indigo-500/50 bg-indigo-500/5',
                                )}>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "mb-1 text-[10px] w-full justify-center py-0.5",
                                      actionCfg.color,
                                      isLast ? actionCfg.bgColor + '/20' : 'bg-muted/50',
                                      node.isBranch && 'bg-indigo-500/20 border-indigo-500/50 text-indigo-600',
                                      node.isMerge && 'bg-indigo-500/20 border-indigo-500/50 text-indigo-600',
                                    )}
                                  >
                                    {actionCfg.label}
                                  </Badge>
                                  
                                  <p className="text-[10px] text-muted-foreground text-center line-clamp-2 min-h-[2rem] leading-tight">
                                    {node.remarks || (node.isCreation ? `By ${file.createdBy.name}` : 'No remarks')}
                                  </p>
                                  
                                  <div className="mt-1 pt-1 border-t">
                                    <p className="text-[9px] text-muted-foreground text-center">
                                      {format(new Date(node.createdAt), 'MMM d, h:mm a')}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Horizontal Arrow Connector */}
                              {hasNextInRow && (
                                <div className="flex items-center mx-3 -mt-16 relative">
                                  {/* Dashed line */}
                                  <div className="w-16 h-0.5 relative">
                                    <div className="absolute inset-0 border-t-2 border-dashed border-muted-foreground/40" />
                                  </div>
                                  {/* Arrow head */}
                                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 -ml-1" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Draw horizontal connectors for branches (connecting branch rows) */}
                {flowchartNodes.filter(n => n.isBranch && !n.isMerge).map((branchNode) => {
                  const parentNode = flowchartNodes.find(n => n.id === branchNode.parentId);
                  const mergeNode = flowchartNodes.find(n => n.branchId === branchNode.branchId && n.isMerge);
                  
                  if (parentNode && mergeNode) {
                    // Calculate positions (approximate based on node count and spacing)
                    const nodeWidth = 200; // Approximate width per node
                    const startX = parentNode.x * nodeWidth;
                    const branchX = branchNode.x * nodeWidth;
                    const mergeX = mergeNode.x * nodeWidth;
                    const mainY = parentNode.row * 240;
                    const branchY = branchNode.row * 240;
                    
                    return (
                      <svg
                        key={`branch-connector-${branchNode.id}`}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                        style={{ minHeight: `${(maxRow + 1) * 240}px` }}
                      >
                        {/* Down from parent */}
                        <line
                          x1={startX + 48}
                          y1={mainY + 24}
                          x2={startX + 48}
                          y2={mainY + 80}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="text-indigo-500/40"
                        />
                        {/* Horizontal to branch */}
                        <line
                          x1={startX + 48}
                          y1={mainY + 80}
                          x2={branchX + 48}
                          y2={mainY + 80}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="text-indigo-500/40"
                        />
                        {/* Down to branch row */}
                        <line
                          x1={branchX + 48}
                          y1={mainY + 80}
                          x2={branchX + 48}
                          y2={branchY + 24}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="text-indigo-500/40"
                        />
                        {/* Arrow down */}
                        <polygon
                          points={`${branchX + 48},${branchY + 20} ${branchX + 44},${branchY + 24} ${branchX + 52},${branchY + 24}`}
                          fill="currentColor"
                          className="text-indigo-500/40"
                        />
                      </svg>
                    );
                  }
                  return null;
                })}

                {/* Draw connectors from branch back to main (merge) */}
                {flowchartNodes.filter(n => n.isMerge && n.row === 0).map((mergeNode) => {
                  const branchNodes = flowchartNodes.filter(n => n.branchId === mergeNode.branchId && n.isBranch && !n.isMerge);
                  const lastBranchNode = branchNodes[branchNodes.length - 1];
                  
                  if (lastBranchNode) {
                    const nodeWidth = 200;
                    const branchX = lastBranchNode.x * nodeWidth;
                    const mergeX = mergeNode.x * nodeWidth;
                    const branchY = lastBranchNode.row * 240;
                    const mainY = mergeNode.row * 240;
                    
                    return (
                      <svg
                        key={`merge-connector-${mergeNode.id}`}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                        style={{ minHeight: `${(maxRow + 1) * 240}px` }}
                      >
                        {/* Up from branch */}
                        <line
                          x1={branchX + 48}
                          y1={branchY + 24}
                          x2={branchX + 48}
                          y2={branchY - 80}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="text-indigo-500/40"
                        />
                        {/* Horizontal to merge */}
                        <line
                          x1={branchX + 48}
                          y1={branchY - 80}
                          x2={mergeX + 48}
                          y2={branchY - 80}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="text-indigo-500/40"
                        />
                        {/* Up to main row */}
                        <line
                          x1={mergeX + 48}
                          y1={branchY - 80}
                          x2={mergeX + 48}
                          y2={mainY + 24}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="text-indigo-500/40"
                        />
                        {/* Arrow up */}
                        <polygon
                          points={`${mergeX + 48},${mainY + 28} ${mergeX + 44},${mainY + 24} ${mergeX + 52},${mainY + 24}`}
                          fill="currentColor"
                          className="text-indigo-500/40"
                        />
                      </svg>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </ScrollArea>

          {/* Legend - Fixed at bottom */}
          <div className="border-t px-6 py-3 bg-background">
            <div className="flex items-center justify-center gap-4 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Created</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Forwarded</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Approved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">Returned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Rejected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
                <span className="text-muted-foreground">On Hold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full animate-ping bg-primary" />
                <span className="text-muted-foreground">Current</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - 20% - Document Details */}
        <div className="flex-[0.2] flex flex-col bg-background overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Document Details
            </h2>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* File Subject */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Subject</label>
                <p className="text-sm font-medium leading-relaxed">{file.subject}</p>
              </div>

              <Separator />

              {/* Status & Priority */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Status</label>
                  <Badge className={`${config.bgColor} ${config.color} border-0 gap-1.5 py-1.5 px-3`}>
                    <StatusIcon className="h-4 w-4" />
                    {config.label}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Priority</label>
                  <Badge variant="outline" className={`gap-1.5 ${priority.color}`}>
                    <span className={`h-2 w-2 rounded-full ${priority.bgColor}`} />
                    {priority.label}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Department */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Department
                </label>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{file.department.code}</p>
                  <p className="text-xs text-muted-foreground">{file.department.name}</p>
                </div>
              </div>

              <Separator />

              {/* Current Location */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Current Location
                </label>
                <p className="text-sm font-medium">
                  {file.currentDivision?.name || (
                    <span className="text-muted-foreground italic">Not assigned</span>
                  )}
                </p>
              </div>

              <Separator />

              {/* Assigned To */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Assigned To
                </label>
                <p className="text-sm font-medium">
                  {file.assignedTo?.name || (
                    <span className="text-muted-foreground italic">Unassigned</span>
                  )}
                </p>
              </div>

              <Separator />

              {/* Created By */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Created By
                </label>
                <p className="text-sm font-medium">{file.createdBy.name}</p>
              </div>

              <Separator />

              {/* Created Date */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Created Date
                </label>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {format(new Date(file.createdAt), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(file.createdAt), 'h:mm a')} • {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Due Date */}
              {file.dueDate && (
                <>
                  <Separator />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Due Date
                    </label>
                    <div className={cn(
                      "p-3 rounded-lg border",
                      new Date(file.dueDate) < new Date() 
                        ? 'border-red-500/50 bg-red-500/5' 
                        : 'border-amber-500/50 bg-amber-500/5'
                    )}>
                      <p className={cn(
                        "text-sm font-medium",
                        new Date(file.dueDate) < new Date() 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-amber-600 dark:text-amber-400'
                      )}>
                        {format(new Date(file.dueDate), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        new Date(file.dueDate) < new Date() 
                          ? 'text-red-600/80 dark:text-red-400/80' 
                          : 'text-amber-600/80 dark:text-amber-400/80'
                      )}>
                        {new Date(file.dueDate) < new Date() ? 'Overdue' : 'Due ' + formatDistanceToNow(new Date(file.dueDate), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Description */}
              {file.description && (
                <>
                  <Separator />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Description</label>
                    <div className="text-sm text-muted-foreground prose prose-sm max-w-none" 
                      dangerouslySetInnerHTML={{ __html: file.description }} 
                    />
                  </div>
                </>
              )}

              {/* Action Button */}
              <Separator />
              <Button 
                className="w-full" 
                onClick={() => router.push(`/files/${file.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Full File Details
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
