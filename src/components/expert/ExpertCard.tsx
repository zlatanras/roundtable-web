'use client';

import { Expert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpertAvatar } from '@/components/discussion/ExpertAvatar';
import { cn } from '@/lib/utils';

interface ExpertCardProps {
  expert: Expert;
  isActive?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function ExpertCard({
  expert,
  isActive = false,
  isSelected = false,
  onClick,
  compact = false,
}: ExpertCardProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
          isSelected
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
          isActive && 'ring-2 ring-indigo-500'
        )}
        onClick={onClick}
      >
        <ExpertAvatar name={expert.name} color={expert.color} size="sm" isActive={isActive} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
            {expert.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {expert.role}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-indigo-500',
        isActive && 'ring-2 ring-offset-2'
      )}
      style={{ '--tw-ring-color': isActive ? expert.color : undefined } as React.CSSProperties}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <ExpertAvatar name={expert.name} color={expert.color} size="lg" isActive={isActive} />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{expert.name}</CardTitle>
            <p
              className="text-sm font-medium mt-0.5"
              style={{ color: expert.color }}
            >
              {expert.role}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {expert.personality}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {expert.expertise.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {expert.expertise.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{expert.expertise.length - 4}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
