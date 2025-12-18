'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useDiscussionStore } from '@/stores/discussion';
import { ChatPanel } from '@/components/discussion/ChatPanel';
import { ExpertCard } from '@/components/expert/ExpertCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Discussion, SSEEvent } from '@/types';
import { truncate } from '@/lib/utils';
import { exportDiscussion } from '@/lib/export';

export default function DiscussionPage() {
  const params = useParams();
  const discussionId = params.id as string;

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const {
    setDiscussion: setStoreDiscussion,
    handleSSEEvent,
    status,
    streamingExpert,
    experts,
    messages,
    summary,
    reset,
  } = useDiscussionStore();

  // Export discussion
  const handleExport = useCallback((format: 'markdown' | 'text') => {
    if (!discussion) return;

    exportDiscussion({
      title: discussion.title,
      topic: discussion.topic,
      experts,
      messages,
      summary,
      language: discussion.language,
      createdAt: discussion.createdAt?.toString() || new Date().toISOString(),
    }, format);

    setShowExportMenu(false);
  }, [discussion, experts, messages, summary]);

  // Fetch discussion data
  useEffect(() => {
    async function fetchDiscussion() {
      try {
        const response = await fetch(`/api/discussions/${discussionId}`);
        if (!response.ok) {
          throw new Error('Discussion not found');
        }
        const data = await response.json();
        setDiscussion(data);

        // Initialize store
        setStoreDiscussion({
          discussionId: data.id,
          topic: data.topic,
          status: data.status,
          currentRound: data.currentRound,
          totalRounds: data.totalRounds,
          model: data.model,
          language: data.language,
          moderatorMode: data.moderatorMode,
          experts: data.panel?.experts || [],
          messages: data.messages?.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          })) || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load discussion');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiscussion();

    return () => {
      reset();
    };
  }, [discussionId, setStoreDiscussion, reset]);

  // Start discussion stream
  const startDiscussion = useCallback(async () => {
    if (!discussion) return;

    setStoreDiscussion({ status: 'IN_PROGRESS', isConnected: true });

    try {
      const response = await fetch(`/api/discussions/${discussionId}/stream`);
      if (!response.ok) {
        throw new Error('Failed to start discussion');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: SSEEvent = JSON.parse(line.slice(6));
              handleSSEEvent(event);
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run discussion');
      setStoreDiscussion({ status: 'PAUSED', isConnected: false });
    }
  }, [discussion, discussionId, handleSSEEvent, setStoreDiscussion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <svg
              className="w-12 h-12 mx-auto text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || 'Discussion not found'}
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar - Expert Panel */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col">
        {/* Discussion Info */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
            {discussion.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
            {truncate(discussion.topic, 120)}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge
              variant={
                status === 'COMPLETED'
                  ? 'success'
                  : status === 'IN_PROGRESS'
                  ? 'warning'
                  : 'secondary'
              }
            >
              {status}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {discussion.model.split('/').pop()}
            </span>
          </div>
        </div>

        {/* Expert List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            Expert Panel
          </h3>
          <div className="space-y-2">
            {experts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                compact
                isActive={streamingExpert?.id === expert.id}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          {status === 'PENDING' && (
            <Button className="w-full" onClick={startDiscussion}>
              Start Discussion
            </Button>
          )}
          {status === 'IN_PROGRESS' && (
            <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
              <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" />
              Discussion in progress...
            </div>
          )}
          {status === 'COMPLETED' && (
            <div className="relative">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    onClick={() => handleExport('markdown')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Markdown (.md)
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    onClick={() => handleExport('text')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Text (.txt)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatPanel className="flex-1" />
      </div>
    </div>
  );
}
