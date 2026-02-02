'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/api';
import { 
  Loader2, 
  Send, 
  Building2, 
  User, 
  ArrowRight, 
  FileText,
  CheckCircle2,
  Circle,
  MessageSquare,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Division {
  id: string;
  name: string;
  code?: string;
}

interface UserOption {
  id: string;
  name: string;
  username: string;
  role?: string;
}

interface ForwardFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileNumber: string;
  departmentId: string;
  onSuccess?: () => void;
}

export function ForwardFileModal({
  open,
  onOpenChange,
  fileId,
  fileNumber,
  departmentId,
  onSuccess,
}: ForwardFileModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [divisionId, setDivisionId] = useState('');
  const [userId, setUserId] = useState('');
  const [remarks, setRemarks] = useState('');

  const selectedDivision = divisions.find(d => d.id === divisionId);
  const selectedUser = users.find(u => u.id === userId);

  // Steps for visual progress
  const steps = [
    { id: 1, label: 'Division', completed: !!divisionId },
    { id: 2, label: 'Recipient', completed: !!userId },
    { id: 3, label: 'Remarks', completed: true }, // Always "complete" as it's optional
  ];

  useEffect(() => {
    if (open && departmentId) {
      fetchDivisions();
    }
    // Reset form when modal opens
    if (open) {
      setDivisionId('');
      setUserId('');
      setRemarks('');
      setUsers([]);
    }
  }, [open, departmentId]);

  useEffect(() => {
    if (divisionId) {
      fetchUsers();
    } else {
      setUsers([]);
      setUserId('');
    }
  }, [divisionId]);

  const fetchDivisions = async () => {
    setLoadingDivisions(true);
    try {
      const response = await api.get(`/departments/${departmentId}/divisions`);
      setDivisions(response.data);
    } catch (error) {
      toast.error('Failed to load divisions');
    } finally {
      setLoadingDivisions(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get(
        `/departments/${departmentId}/divisions/${divisionId}/users`
      );
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!divisionId) {
      toast.error('Please select a division');
      return;
    }
    if (!userId) {
      toast.error('Please select a recipient');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/files/${fileId}/forward`, {
        toDivisionId: divisionId,
        toUserId: userId,
        remarks,
      });

      toast.success('File forwarded successfully', {
        description: `Sent to ${selectedUser?.name} in ${selectedDivision?.name}`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Failed to forward file', {
        description: err.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg">Forward File</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="h-3.5 w-3.5 opacity-80" />
                  <span className="text-sm font-mono opacity-90">{fileNumber}</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    step.completed 
                      ? "bg-white text-blue-600" 
                      : "bg-white/20 text-white"
                  )}>
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1.5 opacity-80">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-12 mx-2 rounded-full transition-all",
                    step.completed ? "bg-white" : "bg-white/30"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {/* Division Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Select Division
              <Badge variant="secondary" className="ml-auto text-xs">Required</Badge>
            </Label>
            <Select
              value={divisionId}
              onValueChange={(value) => {
                setDivisionId(value);
                setUserId(''); // Reset user when division changes
              }}
              disabled={loading || loadingDivisions}
            >
              <SelectTrigger className="h-11">
                {loadingDivisions ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading divisions...
                  </div>
                ) : (
                  <SelectValue placeholder="Choose a division to forward to" />
                )}
              </SelectTrigger>
              <SelectContent>
                {divisions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No divisions available
                  </div>
                ) : (
                  divisions.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-600 text-xs font-medium">
                          {division.code || division.name.charAt(0)}
                        </div>
                        {division.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Select Recipient
              <Badge variant="secondary" className="ml-auto text-xs">Required</Badge>
            </Label>
            <Select
              value={userId}
              onValueChange={setUserId}
              disabled={loading || !divisionId || loadingUsers}
            >
              <SelectTrigger className={cn("h-11", !divisionId && "opacity-60")}>
                {loadingUsers ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading users...
                  </div>
                ) : !divisionId ? (
                  <span className="text-muted-foreground">Select a division first</span>
                ) : (
                  <SelectValue placeholder="Choose who will receive this file" />
                )}
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No users in this division
                  </div>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-medium">
                          {getInitials(user.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Remarks
              <Badge variant="outline" className="ml-auto text-xs">Optional</Badge>
            </Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add instructions, context, or notes for the recipient..."
              rows={3}
              disabled={loading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              These remarks will be visible in the file history.
            </p>
          </div>

          {/* Summary Card - Shows when both division and user are selected */}
          {selectedDivision && selectedUser && (
            <>
              <Separator />
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">FORWARDING SUMMARY</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-medium">
                    {getInitials(selectedUser.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedDivision.name}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-4 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !divisionId || !userId}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Forward File
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
