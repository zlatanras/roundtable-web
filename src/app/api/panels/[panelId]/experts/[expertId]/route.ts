/**
 * API Routes for Expert Updates
 * PATCH - Update an expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { panels } from '../../../../discussions/route';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; expertId: string }> }
) {
  try {
    const { panelId, expertId } = await params;
    const body = await request.json();

    const panel = panels.get(panelId);
    if (!panel) {
      return NextResponse.json(
        { error: 'Panel not found' },
        { status: 404 }
      );
    }

    const expertIndex = panel.experts.findIndex((e: { id: string }) => e.id === expertId);
    if (expertIndex === -1) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 }
      );
    }

    // Update expert with provided fields
    const updatedExpert = {
      ...panel.experts[expertIndex],
      ...body,
      id: expertId, // Preserve the ID
      panelId, // Preserve the panel ID
    };

    panel.experts[expertIndex] = updatedExpert;
    panel.updatedAt = new Date().toISOString();

    return NextResponse.json(updatedExpert);
  } catch (error) {
    console.error('Failed to update expert:', error);
    return NextResponse.json(
      { error: 'Failed to update expert' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; expertId: string }> }
) {
  try {
    const { panelId, expertId } = await params;

    const panel = panels.get(panelId);
    if (!panel) {
      return NextResponse.json(
        { error: 'Panel not found' },
        { status: 404 }
      );
    }

    const expert = panel.experts.find((e: { id: string }) => e.id === expertId);
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
