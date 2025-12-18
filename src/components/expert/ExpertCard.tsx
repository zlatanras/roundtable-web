'use client';

import { Expert, AVAILABLE_MODELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpertAvatar } from '@/components/discussion/ExpertAvatar';
import { cn } from '@/lib/utils';

function getModelDisplayName(modelId: string | null | undefined): string {
  if (!modelId) return 'Default';
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return model?.name || modelId.split('/').pop() || 'Unknown';
}

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
          {expert.aiModel && (
            <Badge variant="outline" className="text-[10px] mt-1 px-1.5 py-0">
              {getModelDisplayName(expert.aiModel)}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:shadow-md group relative',
        isSelected && 'ring-2 ring-indigo-500',
        isActive && 'ring-2 ring-offset-2',
        onClick && 'hover:border-indigo-300 dark:hover:border-indigo-700'
      )}
      style={{ '--tw-ring-color': isActive ? expert.color : undefined } as React.CSSProperties}
      onClick={onClick}
    >
      {/* Edit overlay */}
      {onClick && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-indigo-600 text-white p-1.5 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
      )}
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
        {expert.aiModel && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Badge variant="outline" className="text-xs">
              AI: {getModelDisplayName(expert.aiModel)}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
