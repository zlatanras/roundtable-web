/**
 * API Routes for Discussions
 * POST - Create a new discussion
 * GET - List discussions
 */

import { NextRequest, NextResponse } from 'next/server';
import { discussionRepository, expertPanelRepository, DEFAULT_PANEL_ID } from '@/repositories';
import {
  CreateDiscussionSchema,
  PaginationSchema,
  validateRequest,
} from '@/lib/validation';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'createDiscussion');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const body = await request.json();

    // Validate input with Zod (includes sanitization)
    const validation = validateRequest(CreateDiscussionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get or validate panel
    const panelId = data.panelId || DEFAULT_PANEL_ID;
    const panel = await expertPanelRepository.findByIdWithExperts(panelId);

    if (!panel) {
      return NextResponse.json(
        { error: 'Expert panel not found' },
        { status: 404 }
      );
    }

    // Create discussion
    const discussion = await discussionRepository.create({
      ...data,
      panelId,
      userId: 'demo-user', // TODO: Replace with auth
    });

    return NextResponse.json(
      { ...discussion, panel },
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
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
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'general');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const { searchParams } = new URL(request.url);

    // Validate pagination params
    const validation = validateRequest(PaginationSchema, {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      status: searchParams.get('status'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const { limit, offset, status } = validation.data;

    const result = await discussionRepository.list(
      { status },
      limit,
      offset
    );

    return NextResponse.json({
      discussions: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error('Failed to list discussions:', error);
    return NextResponse.json(
      { error: 'Failed to list discussions' },
      { status: 500 }
    );
  }
}
