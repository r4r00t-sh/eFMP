'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowRight,
  Download,
  Trash2,
  MoreHorizontal,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onForward?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  actions?: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
}

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onForward,
  onExport,
  onDelete,
  actions = [],
}: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={false}
          onCheckedChange={onSelectAll}
        />
        <span>Select items</span>
      </div>
    );
  }

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-slide-up">
        <Checkbox
          checked={selectedCount === totalCount}
          onCheckedChange={selectedCount === totalCount ? onDeselectAll : onSelectAll}
        />
        <Badge variant="secondary" className="font-semibold">
          {selectedCount} selected
        </Badge>
        
        <div className="flex items-center gap-2 ml-auto">
          {onForward && (
            <Button size="sm" variant="outline" onClick={onForward}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Forward
            </Button>
          )}
          
          {onExport && (
            <Button size="sm" variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.onClick}
                    className={action.variant === 'destructive' ? 'text-destructive' : ''}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {onDelete && (
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          
          <Button size="sm" variant="ghost" onClick={onDeselectAll}>
            Clear
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete {selectedCount} item{selectedCount > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
