'use client';

import { cn } from '@/lib/utils';
import { ExpertAvatar } from './ExpertAvatar';
import { Badge } from '@/components/ui/badge';
import { Message, Expert } from '@/types';
import { formatDate } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  expert?: Expert | null;
  isStreaming?: boolean;
  streamingContent?: string;
}

export function MessageBubble({
  message,
  expert,
  isStreaming = false,
  streamingContent,
}: MessageBubbleProps) {
  const isModerator = message.role === 'MODERATOR';
  const content = isStreaming ? streamingContent : message.content;
  const color = expert?.color || (isModerator ? '#6366f1' : '#64748b');

  const debateStyleLabels: Record<string, string> = {
    agreeable: 'Building',
    challenging: 'Challenging',
    questioning: 'Questioning',
    building: 'Expanding',
    contrasting: 'Contrasting',
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-all',
        isModerator
          ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
        isStreaming && 'animate-pulse'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isModerator ? (
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        ) : (
          <ExpertAvatar
            name={expert?.name || 'Unknown'}
            color={color}
            isActive={isStreaming}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {isModerator ? 'Moderator' : expert?.name || 'Unknown'}
          </span>
          {expert?.role && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {expert.role}
            </span>
          )}
          {message.debateStyle && (
            <Badge variant="secondary" className="text-xs">
              {debateStyleLabels[message.debateStyle] || message.debateStyle}
            </Badge>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
            Round {message.round}
          </span>
        </div>

        {/* Message content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </p>
        </div>

        {/* Timestamp */}
        {!isStreaming && message.createdAt && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            {formatDate(message.createdAt)}
          </p>
        )}
      </div>

      {/* Expert color indicator */}
      {!isModerator && (
        <div
          className="w-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
