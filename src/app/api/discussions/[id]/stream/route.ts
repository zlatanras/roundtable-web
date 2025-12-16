/**
 * Streaming API for Discussion
 * GET - Start/continue discussion with SSE stream
 */

import { NextRequest } from 'next/server';
import { discussions } from '../../route';
import { DiscussionEngine } from '@/services/discussion-engine';
import { LLMClient } from '@/services/llm-client';
import { SSEEvent } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        // Initialize LLM client
        const llmClient = new LLMClient({
          model: discussion.model,
          provider: 'openrouter',
        });

        // Initialize discussion engine
        const engine = new DiscussionEngine(llmClient, {
          topic: discussion.topic,
          experts: discussion.panel.experts,
          language: discussion.language,
          moderatorMode: discussion.moderatorMode,
          totalRounds: discussion.totalRounds,
          model: discussion.model,
        });

        // Update discussion status
        discussion.status = 'IN_PROGRESS';
        discussion.startedAt = new Date().toISOString();

        // Run the discussion
        for await (const event of engine.runDiscussion()) {
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
              role: 'EXPERT',
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

        // Mark as completed
        discussion.status = 'COMPLETED';
        discussion.completedAt = new Date().toISOString();

      } catch (error) {
        console.error('Discussion stream error:', error);
        sendEvent({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        discussion.status = 'PAUSED';
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
