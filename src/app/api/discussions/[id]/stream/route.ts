/**
 * Streaming API for Discussion
 * GET - Start/continue discussion with SSE stream
 */

import { NextRequest } from 'next/server';
import { discussions, panels } from '@/repositories';
import { DiscussionEngine } from '@/services/discussion-engine';
import { LLMClient } from '@/services/llm-client';
import { SSEEvent } from '@/types';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Rate limiting for expensive streaming operations
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, 'startStream');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  const discussion = discussions.get(id);

  if (!discussion) {
    return new Response(
      JSON.stringify({ error: 'Discussion not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check API key
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OpenRouter API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create AbortController for cleanup on disconnect
  const abortController = new AbortController();
  let isAborted = false;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEEvent) => {
        if (isAborted) return;
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // Controller might be closed
        }
      };

      // Handle client disconnect
      const cleanup = () => {
        isAborted = true;
        abortController.abort();
        if (discussion.status === 'IN_PROGRESS') {
          discussion.status = 'PAUSED';
        }
      };

      // Listen for abort signal from request
      request.signal.addEventListener('abort', cleanup);

      try {
        // Initialize LLM client
        const llmClient = new LLMClient({
          model: discussion.model,
          provider: 'openrouter',
        });

        // Fetch the latest panel data (so updated aiModels are used)
        const latestPanel = panels.get(discussion.panelId) || discussion.panel;

        // Initialize discussion engine
        const engine = new DiscussionEngine(llmClient, {
          topic: discussion.topic,
          experts: latestPanel.experts,
          language: discussion.language,
          moderatorMode: discussion.moderatorMode,
          totalRounds: discussion.totalRounds,
          model: discussion.model,
        });

        // Update discussion status
        discussion.status = 'IN_PROGRESS';
        discussion.startedAt = new Date().toISOString();

        // Run the discussion with abort checking
        for await (const event of engine.runDiscussion()) {
          // Check if client disconnected
          if (isAborted || abortController.signal.aborted) {
            console.log(`Discussion ${id} aborted - client disconnected`);
            break;
          }

          // Add discussionId to relevant events
          if (event.type === 'discussion_complete') {
            event.discussionId = id;
          }

          sendEvent(event);

          // Store messages
          if (event.type === 'expert_complete') {
            const expertMessage = {
              id: event.messageId,
              content: event.fullContent,
              role: 'EXPERT' as const,
              round: engine.getState().currentRound,
              expertId: event.expertId,
              createdAt: new Date().toISOString(),
            };
            discussion.messages.push(expertMessage);
            discussion.currentRound = engine.getState().currentRound;
          }

          // Update consensus score
          if (event.type === 'round_complete' && event.consensusScore) {
            discussion.consensusScore = event.consensusScore;
          }
        }

        // Mark as completed only if not aborted
        if (!isAborted) {
          discussion.status = 'COMPLETED';
          discussion.completedAt = new Date().toISOString();
        }
      } catch (error) {
        console.error('Discussion stream error:', error);
        if (!isAborted) {
          sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
          });
          discussion.status = 'PAUSED';
        }
      } finally {
        request.signal.removeEventListener('abort', cleanup);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },

    cancel() {
      // Called when the stream is cancelled
      isAborted = true;
      abortController.abort();
      if (discussion.status === 'IN_PROGRESS') {
        discussion.status = 'PAUSED';
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  });
}
