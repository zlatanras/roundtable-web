'use client';

import { cn } from '@/lib/utils';

interface ExpertAvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
  className?: string;
}

export function ExpertAvatar({
  name,
  color,
  size = 'md',
  isActive = false,
  className,
}: ExpertAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white transition-all',
        sizeClasses[size],
        isActive && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900',
        className
      )}
      style={{
        backgroundColor: color,
        boxShadow: isActive ? `0 0 12px ${color}60` : undefined,
        ringColor: isActive ? color : undefined,
      }}
    >
      {initials}
    </div>
  );
}
