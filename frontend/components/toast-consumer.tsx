'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export function ToastConsumer() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // In a real implementation, this would connect to RabbitMQ via WebSocket
    // For now, we'll simulate with polling or WebSocket connection
    // This is a placeholder - you'd implement actual RabbitMQ consumer via backend WebSocket

    // Example: Listen for actionable toasts
    const handleActionableToast = async (toastData: Record<string, unknown>) => {
      if (toastData.userId !== user.id) return;

      const actions = toastData.actions as Array<Record<string, unknown>> | undefined;
      const actionButtons = actions?.map((action: Record<string, unknown>) => (
        <Button
          key={String(action.action ?? '')}
          size="sm"
          onClick={async () => {
            if (action.action === 'request_extra_time') {
              // Handle request extra time
            } else if (action.action === 'approve_time') {
              const payload = action.payload as { fileId: string; additionalDays?: number };
              await api.post(`/files/${payload.fileId}/approve-time`, {
                additionalDays: payload.additionalDays,
              });
              toast.success('Time request approved');
            } else if (action.action === 'deny_time') {
              const payload = action.payload as { fileId: string };
              await api.post(`/files/${payload.fileId}/deny-time`);
              toast.error('Time request denied');
            }
          }}
        >
          {String(action.label ?? '')}
        </Button>
      ));

      toast.info(String(toastData.title ?? ''), {
        description: String(toastData.message ?? ''),
        action: actionButtons?.[0],
        duration: 10000,
      });
    };

    // This would be replaced with actual WebSocket/RabbitMQ connection
    // For now, it's a placeholder structure
  }, [user]);

  return null;
}

