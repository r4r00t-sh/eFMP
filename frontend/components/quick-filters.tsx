'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface Filter {
  id: string;
  label: string;
  value: string;
  count?: number;
}

interface QuickFiltersProps {
  filters: Filter[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  className?: string;
}

export function QuickFilters({
  filters,
  activeFilter,
  onFilterChange,
  className,
}: QuickFiltersProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        
        return (
          <Badge
            key={filter.id}
            variant={isActive ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer px-4 py-2 text-sm font-medium transition-all hover:scale-105',
              isActive && 'shadow-sm'
            )}
            onClick={() => onFilterChange(filter.id)}
          >
            {isActive && <Check className="h-3 w-3 mr-1" />}
            {filter.label}
            {filter.count !== undefined && (
              <span className={cn(
                'ml-2 px-1.5 py-0.5 rounded-full text-xs',
                isActive ? 'bg-primary-foreground/20' : 'bg-muted'
              )}>
                {filter.count}
              </span>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
