'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDiscussionStore } from '@/stores/discussion';

export function ModeratorInput() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { discussionId, setShowModeratorInput, addMessage, currentRound } = useDiscussionStore();

  const handleSubmit = async () => {
    if (!content.trim() || !discussionId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/discussions/${discussionId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (response.ok) {
        const message = await response.json();
        addMessage({
          ...message,
          role: 'MODERATOR',
          round: currentRound,
          createdAt: new Date(message.createdAt),
        });
        setContent('');
        setShowModeratorInput(false);
      }
    } catch (error) {
      console.error('Failed to add moderator message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setContent('');
    setShowModeratorInput(false);
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-indigo-50 dark:bg-indigo-950/30">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
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

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              🎙️ Moderator Mode
            </p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
              Add a comment or question to guide the discussion, or skip to continue.
            </p>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your comment or question..."
            className="min-h-[80px] bg-white dark:bg-slate-900"
            disabled={isSubmitting}
          />

          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
