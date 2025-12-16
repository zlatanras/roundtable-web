/**
 * Moderator API for Discussion
 * POST - Add moderator message
 */

import { NextRequest, NextResponse } from 'next/server';
import { discussions } from '../../route';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const message = {
      id: uuidv4(),
      content,
      role: 'MODERATOR',
      round: discussion.currentRound,
      createdAt: new Date().toISOString(),
    };

    discussion.messages.push(message);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Failed to add moderator message:', error);
    return NextResponse.json(
      { error: 'Failed to add moderator message' },
      { status: 500 }
    );
  }
}
