'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ChatFabProps = {
  onClick: () => void;
};

export function ChatFab({ onClick }: ChatFabProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="default"
            className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20 transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl"
            onClick={onClick}
            aria-label="Open chat"
          >
            <MessageCircle className="h-7 w-7" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Chat</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
