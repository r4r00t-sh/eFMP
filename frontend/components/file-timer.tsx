'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Battery, 
  BatteryLow, 
  BatteryMedium, 
  BatteryFull,
  BatteryWarning,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface FileTimerProps {
  timerPercentage: number | null;
  deskArrivalTime?: string | null;
  allottedTime?: number | null; // in seconds
  dueDate?: string | null;
  isRedListed?: boolean;
  isOnHold?: boolean;
  priorityCategory?: string;
  variant?: 'battery' | 'clock' | 'compact';
  showLabel?: boolean;
}

export function FileTimer({
  timerPercentage,
  deskArrivalTime,
  allottedTime,
  dueDate,
  isRedListed = false,
  isOnHold = false,
  priorityCategory = 'ROUTINE',
  variant = 'battery',
  showLabel = true,
}: FileTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [percentage, setPercentage] = useState(timerPercentage || 100);
  
  useEffect(() => {
    if (isOnHold) {
      const id = requestAnimationFrame(() => setTimeRemaining('On Hold'));
      return () => cancelAnimationFrame(id);
    }

    if (!deskArrivalTime || !allottedTime) {
      const id = requestAnimationFrame(() => setTimeRemaining('--:--:--'));
      return () => cancelAnimationFrame(id);
    }

    const calculateRemaining = () => {
      const arrival = new Date(deskArrivalTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - arrival) / 1000);
      const remaining = allottedTime - elapsed;
      
      if (remaining <= 0) {
        setPercentage(0);
        const overdue = Math.abs(remaining);
        const days = Math.floor(overdue / 86400);
        const hours = Math.floor((overdue % 86400) / 3600);
        if (days > 0) {
          setTimeRemaining(`-${days}d ${hours}h`);
        } else {
          const minutes = Math.floor((overdue % 3600) / 60);
          setTimeRemaining(`-${hours}h ${minutes}m`);
        }
        return;
      }

      const pct = Math.round((remaining / allottedTime) * 100);
      setPercentage(pct);
      
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        const seconds = remaining % 60;
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [deskArrivalTime, allottedTime, isOnHold]);

  // Determine visual state
  const getState = () => {
    if (isOnHold) return 'hold';
    if (isRedListed || percentage <= 0) return 'critical';
    if (percentage <= 10) return 'critical';
    if (percentage <= 50) return 'warning';
    return 'fresh';
  };

  const state = getState();

  const stateColors = {
    fresh: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      bgLight: 'bg-green-500/10',
      border: 'border-green-500/30',
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      bgLight: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    critical: {
      bg: 'bg-red-500',
      text: 'text-red-600',
      bgLight: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
    hold: {
      bg: 'bg-gray-400',
      text: 'text-gray-500',
      bgLight: 'bg-gray-500/10',
      border: 'border-gray-500/30',
    },
  };

  const colors = stateColors[state];

  // Battery Visual
  if (variant === 'battery') {
    return (
      <div className="flex items-center gap-3">
        <div className={cn(
          "relative w-16 h-8 rounded-md border-2 flex items-center overflow-hidden",
          colors.border,
          state === 'critical' && !isOnHold && 'animate-pulse'
        )}>
          {/* Battery nub */}
          <div className={cn("absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-3 rounded-r", colors.bg)} />
          
          {/* Battery fill */}
          <div 
            className={cn("h-full transition-all duration-500", colors.bg)}
            style={{ width: `${Math.max(percentage, 0)}%` }}
          />
          
          {/* Percentage text overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-xs font-bold", percentage > 50 ? 'text-white' : colors.text)}>
              {isOnHold ? '⏸' : `${Math.max(percentage, 0)}%`}
            </span>
          </div>
        </div>
        
        {showLabel && (
          <div className="flex flex-col">
            <span className={cn("text-sm font-semibold", colors.text)}>
              {timeRemaining}
            </span>
            <span className="text-xs text-muted-foreground">
              {state === 'critical' && !isOnHold ? 'OVERDUE' : 'remaining'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Clock Visual
  if (variant === 'clock') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border",
        colors.bgLight,
        colors.border,
        state === 'critical' && !isOnHold && 'animate-pulse'
      )}>
        {state === 'critical' && !isOnHold ? (
          <AlertTriangle className={cn("h-5 w-5", colors.text)} />
        ) : (
          <Clock className={cn("h-5 w-5", colors.text)} />
        )}
        <div className="flex flex-col">
          <span className={cn("text-lg font-mono font-bold", colors.text)}>
            {timeRemaining}
          </span>
          {showLabel && (
            <span className="text-xs text-muted-foreground">
              {state === 'critical' && !isOnHold ? 'OVERDUE' : 'Time Left'}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Compact Visual (for tables)
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 font-mono",
        colors.bgLight,
        colors.text,
        colors.border,
        "border",
        state === 'critical' && !isOnHold && 'animate-pulse'
      )}
    >
      {state === 'critical' && !isOnHold ? (
        <AlertTriangle className="h-3 w-3" />
      ) : state === 'hold' ? (
        <span>⏸</span>
      ) : (
        <Battery className="h-3 w-3" />
      )}
      {timeRemaining}
    </Badge>
  );
}

// Priority Category Badge
interface PriorityCategoryBadgeProps {
  category: string;
  showTime?: boolean;
}

export function PriorityCategoryBadge({ category, showTime = false }: PriorityCategoryBadgeProps) {
  const config: Record<string, { color: string; bg: string; label: string; time: string }> = {
    ROUTINE: { color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'Routine', time: '3 Days' },
    URGENT: { color: 'text-orange-600', bg: 'bg-orange-500/10', label: 'Urgent', time: '24 Hours' },
    IMMEDIATE: { color: 'text-red-600', bg: 'bg-red-500/10', label: 'Immediate', time: '4 Hours' },
    PROJECT: { color: 'text-green-600', bg: 'bg-green-500/10', label: 'Project', time: '7 Days' },
  };

  const { color, bg, label, time } = config[category] || config.ROUTINE;

  return (
    <Badge variant="outline" className={cn("gap-1.5", bg, color, "border-0")}>
      {category === 'IMMEDIATE' && <Zap className="h-3 w-3" />}
      {label}
      {showTime && <span className="opacity-70">({time})</span>}
    </Badge>
  );
}

