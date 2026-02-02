'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  Save,
  Play,
  Eye,
  Settings,
  GitBranch,
  Circle,
  Square,
  Diamond,
  Hexagon,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false);
  const [showAddEdgeDialog, setShowAddEdgeDialog] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);

  const [nodeForm, setNodeForm] = useState({
    nodeId: '',
    nodeType: 'task',
    label: '',
    description: '',
    assigneeType: 'role',
    assigneeValue: '',
    timeLimit: 86400,
    availableActions: [] as string[],
  });

  const [edgeForm, setEdgeForm] = useState({
    sourceNodeId: '',
    targetNodeId: '',
    label: '',
    condition: null as any,
  });

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/workflows/${workflowId}`);
      setWorkflow(response.data);
    } catch (error: any) {
      toast.error('Failed to load workflow');
      router.push('/admin/workflows');
    } finally {
      setLoading(false);
    }
  };

  const validateWorkflow = async () => {
    try {
      const response = await api.get(`/workflows/${workflowId}/validate`);
      setValidation(response.data);
      if (response.data.valid) {
        toast.success('Workflow is valid');
      } else {
        toast.error('Workflow has errors', {
          description: response.data.errors.join(', '),
        });
      }
    } catch (error) {
      toast.error('Failed to validate workflow');
    }
  };

  const publishWorkflow = async () => {
    if (!confirm('Publish this workflow? It will become active.')) return;

    try {
      await api.post(`/workflows/${workflowId}/publish`);
      toast.success('Workflow published successfully');
      fetchWorkflow();
    } catch (error: any) {
      toast.error('Failed to publish workflow', {
        description: error.response?.data?.message,
      });
    }
  };

  const addNode = async () => {
    try {
      await api.post(`/workflows/${workflowId}/nodes`, nodeForm);
      toast.success('Node added successfully');
      setShowAddNodeDialog(false);
      fetchWorkflow();
      resetNodeForm();
    } catch (error: any) {
      toast.error('Failed to add node');
    }
  };

  const addEdge = async () => {
    try {
      await api.post(`/workflows/${workflowId}/edges`, edgeForm);
      toast.success('Connection added successfully');
      setShowAddEdgeDialog(false);
      fetchWorkflow();
      resetEdgeForm();
    } catch (error: any) {
      toast.error('Failed to add connection');
    }
  };

  const deleteNode = async (nodeId: string) => {
    if (!confirm('Delete this node?')) return;

    try {
      await api.delete(`/workflows/nodes/${nodeId}`);
      toast.success('Node deleted');
      fetchWorkflow();
    } catch (error: any) {
      toast.error('Failed to delete node');
    }
  };

  const deleteEdge = async (edgeId: string) => {
    if (!confirm('Delete this connection?')) return;

    try {
      await api.delete(`/workflows/edges/${edgeId}`);
      toast.success('Connection deleted');
      fetchWorkflow();
    } catch (error: any) {
      toast.error('Failed to delete connection');
    }
  };

  const resetNodeForm = () => {
    setNodeForm({
      nodeId: '',
      nodeType: 'task',
      label: '',
      description: '',
      assigneeType: 'role',
      assigneeValue: '',
      timeLimit: 86400,
      availableActions: [],
    });
  };

  const resetEdgeForm = () => {
    setEdgeForm({
      sourceNodeId: '',
      targetNodeId: '',
      label: '',
      condition: null,
    });
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'start': return Circle;
      case 'task': return Square;
      case 'decision': return Diamond;
      case 'end': return Hexagon;
      default: return Circle;
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

  if (!workflow) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" className="mb-4 -ml-2" onClick={() => router.push('/admin/workflows')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workflows
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{workflow.name}</h1>
            {workflow.isActive ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                <Edit className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {workflow.description || 'No description'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={validateWorkflow}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Validate
          </Button>
          {workflow.isDraft && (
            <Button onClick={publishWorkflow}>
              <Play className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <Card className={cn(
          validation.valid ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {validation.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  validation.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                )}>
                  {validation.valid ? 'Workflow is valid' : 'Workflow has errors'}
                </p>
                {validation.errors?.length > 0 && (
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside">
                    {validation.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
                {validation.warnings?.length > 0 && (
                  <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 list-disc list-inside">
                    {validation.warnings.map((warn: string, i: number) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="nodes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="nodes">Nodes ({workflow.nodes?.length || 0})</TabsTrigger>
          <TabsTrigger value="edges">Connections ({workflow.edges?.length || 0})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Nodes Tab */}
        <TabsContent value="nodes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddNodeDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Node
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflow.nodes?.map((node: any) => {
              const NodeIcon = getNodeIcon(node.nodeType);
              return (
                <Card key={node.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          node.nodeType === 'start' && 'bg-emerald-500/10',
                          node.nodeType === 'task' && 'bg-blue-500/10',
                          node.nodeType === 'decision' && 'bg-amber-500/10',
                          node.nodeType === 'end' && 'bg-slate-500/10',
                        )}>
                          <NodeIcon className={cn(
                            "h-5 w-5",
                            node.nodeType === 'start' && 'text-emerald-600',
                            node.nodeType === 'task' && 'text-blue-600',
                            node.nodeType === 'decision' && 'text-amber-600',
                            node.nodeType === 'end' && 'text-slate-600',
                          )} />
                        </div>
                        <div>
                          <p className="font-medium">{node.label}</p>
                          <Badge variant="outline" className="text-xs capitalize mt-1">
                            {node.nodeType}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteNode(node.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {node.description && (
                      <p className="text-xs text-muted-foreground mb-2">{node.description}</p>
                    )}

                    {node.assigneeType && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Assignee: </span>
                        <span className="font-medium capitalize">{node.assigneeType}</span>
                        {node.assigneeValue && ` (${node.assigneeValue})`}
                      </div>
                    )}

                    {node.timeLimit && (
                      <div className="text-xs mt-1">
                        <span className="text-muted-foreground">Time Limit: </span>
                        <span className="font-medium">{Math.floor(node.timeLimit / 3600)}h</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Edges Tab */}
        <TabsContent value="edges" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddEdgeDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {workflow.edges?.map((edge: any) => {
                  const sourceNode = workflow.nodes.find((n: any) => n.id === edge.sourceNodeId);
                  const targetNode = workflow.nodes.find((n: any) => n.id === edge.targetNodeId);
                  
                  return (
                    <div key={edge.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{sourceNode?.label || 'Unknown'}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline">{targetNode?.label || 'Unknown'}</Badge>
                        </div>
                        {edge.label && (
                          <span className="text-sm text-muted-foreground">
                            "{edge.label}"
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEdge(edge.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {(!workflow.edges || workflow.edges.length === 0) && (
                  <div className="p-12 text-center text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No connections yet</p>
                    <p className="text-sm">Add connections to link nodes together</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Workflow Name</Label>
                <Input value={workflow.name} disabled />
              </div>
              <div>
                <Label>Workflow Code</Label>
                <Input value={workflow.code} disabled />
              </div>
              <div>
                <Label>Version</Label>
                <Input value={`v${workflow.version}`} disabled />
              </div>
              <div>
                <Label>Created By</Label>
                <Input value={workflow.createdBy?.name} disabled />
              </div>
              {workflow.publishedBy && (
                <div>
                  <Label>Published By</Label>
                  <Input value={workflow.publishedBy.name} disabled />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Node Dialog */}
      <Dialog open={showAddNodeDialog} onOpenChange={setShowAddNodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Node</DialogTitle>
            <DialogDescription>Add a new step to the workflow</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Node ID *</Label>
                <Input
                  placeholder="e.g., approval_step"
                  value={nodeForm.nodeId}
                  onChange={(e) => setNodeForm({ ...nodeForm, nodeId: e.target.value })}
                />
              </div>
              <div>
                <Label>Node Type *</Label>
                <Select
                  value={nodeForm.nodeType}
                  onValueChange={(v) => setNodeForm({ ...nodeForm, nodeType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="end">End</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Label *</Label>
              <Input
                placeholder="e.g., Approval Authority"
                value={nodeForm.label}
                onChange={(e) => setNodeForm({ ...nodeForm, label: e.target.value })}
              />
            </div>

            {nodeForm.nodeType === 'task' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assignee Type</Label>
                    <Select
                      value={nodeForm.assigneeType}
                      onValueChange={(v) => setNodeForm({ ...nodeForm, assigneeType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="role">Role</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="dynamic">Dynamic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assignee Value</Label>
                    <Input
                      placeholder="e.g., APPROVAL_AUTHORITY"
                      value={nodeForm.assigneeValue}
                      onChange={(e) => setNodeForm({ ...nodeForm, assigneeValue: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Time Limit (hours)</Label>
                  <Input
                    type="number"
                    value={Math.floor(nodeForm.timeLimit / 3600)}
                    onChange={(e) => setNodeForm({ ...nodeForm, timeLimit: parseInt(e.target.value) * 3600 })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNodeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addNode}>Add Node</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Edge Dialog */}
      <Dialog open={showAddEdgeDialog} onOpenChange={setShowAddEdgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Connection</DialogTitle>
            <DialogDescription>Connect two nodes in the workflow</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>From Node *</Label>
              <Select
                value={edgeForm.sourceNodeId}
                onValueChange={(v) => setEdgeForm({ ...edgeForm, sourceNodeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source node" />
                </SelectTrigger>
                <SelectContent>
                  {workflow.nodes?.map((node: any) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>To Node *</Label>
              <Select
                value={edgeForm.targetNodeId}
                onValueChange={(v) => setEdgeForm({ ...edgeForm, targetNodeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target node" />
                </SelectTrigger>
                <SelectContent>
                  {workflow.nodes?.map((node: any) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Label (Optional)</Label>
              <Input
                placeholder="e.g., Approved, Rejected"
                value={edgeForm.label}
                onChange={(e) => setEdgeForm({ ...edgeForm, label: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEdgeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addEdge}>Add Connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
