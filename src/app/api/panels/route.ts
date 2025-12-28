/**
 * API Routes for Expert Panels
 * GET - List all panels
 * POST - Create a new panel
 */

import { NextRequest, NextResponse } from 'next/server';
import { expertPanelRepository } from '@/repositories';
import { CreatePanelSchema, validateRequest } from '@/lib/validation';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'general');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const allPanels = await expertPanelRepository.list();

    return NextResponse.json({
      panels: allPanels,
      total: allPanels.length,
    });
  } catch (error) {
    console.error('Failed to list panels:', error);
    return NextResponse.json(
      { error: 'Failed to list panels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'panelOperations');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(CreatePanelSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const panel = await expertPanelRepository.create({
      ...validation.data,
      userId: 'demo-user', // TODO: Replace with auth
    });

    return NextResponse.json(panel, {
      status: 201,
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (error) {
    console.error('Failed to create panel:', error);
    return NextResponse.json(
      { error: 'Failed to create panel' },
      { status: 500 }
    );
  }
}
