'use client';

import { useEffect, useRef } from 'react';
import { useDiscussionStore } from '@/stores/discussion';
import { MessageBubble } from './MessageBubble';
import { RoundIndicator } from './RoundIndicator';
import { TypingIndicator } from './TypingIndicator';
import { ModeratorInput } from './ModeratorInput';
import { DiscussionSummaryCard } from './DiscussionSummaryCard';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const {
    messages,
    streamingContent,
    streamingExpert,
    currentRound,
    totalRounds,
    experts,
    consensusScore,
    summary,
    status,
    moderatorMode,
    showModeratorInput,
  } = useDiscussionStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Group messages by round
  const messagesByRound = messages.reduce((acc, msg) => {
    const round = msg.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(msg);
    return acc;
  }, {} as Record<number, typeof messages>);

  const rounds = Object.keys(messagesByRound).map(Number).sort((a, b) => a - b);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col h-full bg-slate-50 dark:bg-slate-950',
        className
      )}
    >
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {rounds.map((round) => (
          <div key={round} className="space-y-4">
            {/* Round header */}
            <RoundIndicator
              round={round}
              totalRounds={totalRounds}
              consensusScore={round === currentRound ? consensusScore : undefined}
            />

            {/* Messages in this round */}
            <div className="space-y-3">
              {messagesByRound[round].map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  expert={
                    message.expert ||
                    experts.find((e) => e.id === message.expertId)
                  }
                />
              ))}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingExpert && (
          <div className="space-y-4">
            {/* Show round indicator if this is a new round */}
            {currentRound > 0 && !rounds.includes(currentRound) && (
              <RoundIndicator round={currentRound} totalRounds={totalRounds} />
            )}

            <MessageBubble
              message={{
                id: 'streaming',
                content: streamingContent,
                role: 'EXPERT',
                round: currentRound,
                debateStyle: streamingExpert.debateStyle,
                expertId: streamingExpert.id,
                discussionId: '',
                createdAt: new Date(),
              }}
              expert={experts.find((e) => e.id === streamingExpert.id) || {
                id: streamingExpert.id,
                name: streamingExpert.name,
                role: '',
                personality: '',
                expertise: [],
                systemPrompt: '',
                color: streamingExpert.color,
                panelId: '',
              }}
              isStreaming
              streamingContent={streamingContent}
            />
          </div>
        )}

        {/* Typing indicator */}
        {status === 'IN_PROGRESS' && !streamingExpert && messages.length > 0 && (
          <TypingIndicator />
        )}

        {/* Empty state */}
        {messages.length === 0 && !streamingExpert && status === 'PENDING' && (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
              <p className="text-sm">Start the discussion to see expert responses</p>
            </div>
          </div>
        )}

        {/* Discussion Summary */}
        {status === 'COMPLETED' && summary && (
          <div className="py-4">
            <DiscussionSummaryCard summary={summary} />
          </div>
        )}

        {/* Completed state (without summary fallback) */}
        {status === 'COMPLETED' && !summary && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Discussion Complete
            </div>
            {consensusScore > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Final consensus score: {Math.round(consensusScore * 100)}%
              </p>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Moderator input */}
      {moderatorMode && showModeratorInput && status === 'IN_PROGRESS' && (
        <ModeratorInput />
      )}
    </div>
  );
}
