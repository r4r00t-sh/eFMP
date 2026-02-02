'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  email?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function UserAvatar({
  name,
  email,
  imageUrl,
  size = 'md',
  className,
  showOnlineStatus = false,
  isOnline = false,
}: UserAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback className={cn('text-white font-semibold', getAvatarColor(name))}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showOnlineStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
}
