/**
 * API Routes for individual Discussion
 * GET - Get discussion by ID
 * DELETE - Delete discussion
 */

import { NextRequest, NextResponse } from 'next/server';

// Import shared storage
import { discussions } from '../route';

export async function GET(
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

    return NextResponse.json(discussion);
  } catch (error) {
    console.error('Failed to get discussion:', error);
    return NextResponse.json(
      { error: 'Failed to get discussion' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!discussions.has(id)) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    discussions.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete discussion:', error);
    return NextResponse.json(
      { error: 'Failed to delete discussion' },
      { status: 500 }
    );
  }
}
