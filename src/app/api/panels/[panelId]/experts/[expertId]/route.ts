/**
 * API Routes for Expert Updates
 * GET - Get an expert
 * PATCH - Update an expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { expertPanelRepository } from '@/repositories';
import { UpdateExpertSchema, validateRequest } from '@/lib/validation';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; expertId: string }> }
) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'general');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const { panelId, expertId } = await params;

    const panel = await expertPanelRepository.findByIdWithExperts(panelId);
    if (!panel) {
      return NextResponse.json(
        { error: 'Panel not found' },
        { status: 404 }
      );
    }

    const expert = panel.experts.find((e) => e.id === expertId);
    if (!expert) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(expert);
  } catch (error) {
    console.error('Failed to get expert:', error);
    return NextResponse.json(
      { error: 'Failed to get expert' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; expertId: string }> }
) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'panelOperations');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const { panelId, expertId } = await params;
    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(UpdateExpertSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    try {
      const updatedExpert = await expertPanelRepository.updateExpert(
        panelId,
        expertId,
        validation.data
      );

      return NextResponse.json(updatedExpert, {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to update expert:', error);
    return NextResponse.json(
      { error: 'Failed to update expert' },
      { status: 500 }
    );
  }
}
