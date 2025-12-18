/**
 * API Routes for Discussions
 * POST - Create a new discussion
 * GET - List discussions
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateDiscussionRequest, DEFAULT_EXPERTS } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for demo (replace with Prisma in production)
const discussions = new Map<string, any>();
const panels = new Map<string, any>();

// Initialize default panel
const defaultPanelId = 'default-nordticker';
panels.set(defaultPanelId, {
  id: defaultPanelId,
  name: 'NORDticker Experts',
  description: 'Expert panel for digital marketing and web development discussions',
  isDefault: true,
  isPublic: true,
  experts: DEFAULT_EXPERTS.map((e, i) => ({ ...e, id: `expert-${i}`, panelId: defaultPanelId })),
});

export async function POST(request: NextRequest) {
  try {
    const body: CreateDiscussionRequest = await request.json();

    // Validate required fields
    if (!body.topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const panelId = body.panelId || defaultPanelId;
    const panel = panels.get(panelId);

    if (!panel) {
      return NextResponse.json(
        { error: 'Expert panel not found' },
        { status: 404 }
      );
    }

    const discussion = {
      id: uuidv4(),
      title: body.title || `Discussion: ${body.topic.slice(0, 50)}...`,
      topic: body.topic,
      status: 'PENDING',
      totalRounds: body.totalRounds || 4,
      currentRound: 0,
      language: body.language || 'en',
      model: body.model || 'anthropic/claude-sonnet-4.5',
      moderatorMode: body.moderatorMode || false,
      panelId,
      panel,
      messages: [],
      userId: 'demo-user', // Replace with auth
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    discussions.set(discussion.id, discussion);

    return NextResponse.json(discussion, { status: 201 });
  } catch (error) {
    console.error('Failed to create discussion:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let allDiscussions = Array.from(discussions.values());

    // Filter by status if provided
    if (status) {
      allDiscussions = allDiscussions.filter((d) => d.status === status);
    }

    // Sort by createdAt descending
    allDiscussions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const paginated = allDiscussions.slice(offset, offset + limit);

    return NextResponse.json({
      discussions: paginated,
      total: allDiscussions.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to list discussions:', error);
    return NextResponse.json(
      { error: 'Failed to list discussions' },
      { status: 500 }
    );
  }
}

// Export for use in other routes
export { discussions, panels, defaultPanelId };
