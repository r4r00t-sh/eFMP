'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="rounded-full bg-muted p-6 mb-6 animate-fade-in">
          <Icon className="h-12 w-12 text-muted-foreground animate-pulse-slow" />
        </div>
        <h3 className="text-lg font-semibold mb-2 animate-slide-up">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
