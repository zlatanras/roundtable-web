/**
 * Moderator API for Discussion
 * POST - Add moderator message
 */

import { NextRequest, NextResponse } from 'next/server';
import { discussions } from '@/repositories';
import { v4 as uuidv4 } from 'uuid';
import { ModeratorMessageSchema, validateRequest } from '@/lib/validation';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'moderatorMessage');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const { id } = await params;
    const discussion = discussions.get(id);

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    if (!discussion.moderatorMode) {
      return NextResponse.json(
        { error: 'Moderator mode is not enabled for this discussion' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input with Zod (includes sanitization)
    const validation = validateRequest(ModeratorMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const message = {
      id: uuidv4(),
      content: validation.data.content,
      role: 'MODERATOR' as const,
      round: discussion.currentRound,
      createdAt: new Date().toISOString(),
    };

    discussion.messages.push(message);

    return NextResponse.json(message, {
      status: 201,
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (error) {
    console.error('Failed to add moderator message:', error);
    return NextResponse.json(
      { error: 'Failed to add moderator message' },
      { status: 500 }
    );
  }
}
