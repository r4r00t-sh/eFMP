'use client';

import { Check, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface TimelineStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  user?: string;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[15px] top-8 h-full w-0.5',
                  step.status === 'completed' ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
            
            {/* Status icon */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                  step.status === 'completed' && 'border-primary bg-primary text-primary-foreground',
                  step.status === 'current' && 'border-primary bg-background text-primary animate-pulse',
                  step.status === 'pending' && 'border-muted bg-background text-muted-foreground'
                )}
              >
                {step.status === 'completed' && <Check className="h-4 w-4" />}
                {step.status === 'current' && <Clock className="h-4 w-4" />}
                {step.status === 'pending' && <Circle className="h-4 w-4" />}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4
                    className={cn(
                      'font-medium',
                      step.status === 'completed' && 'text-foreground',
                      step.status === 'current' && 'text-primary',
                      step.status === 'pending' && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </h4>
                  {step.user && (
                    <p className="text-sm text-muted-foreground mt-1">{step.user}</p>
                  )}
                </div>
                {step.timestamp && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(step.timestamp), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
