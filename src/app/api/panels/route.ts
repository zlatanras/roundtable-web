/**
 * API Routes for Expert Panels
 * GET - List all panels
 * POST - Create a new panel
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { panels, defaultPanelId } from '../discussions/route';
import { CreatePanelRequest } from '@/types';

export async function GET() {
  try {
    const allPanels = Array.from(panels.values());

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
    const body: CreatePanelRequest = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Panel name is required' },
        { status: 400 }
      );
    }

    if (!body.experts || body.experts.length === 0) {
      return NextResponse.json(
        { error: 'At least one expert is required' },
        { status: 400 }
      );
    }

    const panelId = uuidv4();

    const panel = {
      id: panelId,
      name: body.name,
      description: body.description || null,
      isDefault: false,
      isPublic: false,
      experts: body.experts.map((e, i) => ({
        ...e,
        id: `${panelId}-expert-${i}`,
        panelId,
        color: e.color || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      })),
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    panels.set(panelId, panel);

    return NextResponse.json(panel, { status: 201 });
  } catch (error) {
    console.error('Failed to create panel:', error);
    return NextResponse.json(
      { error: 'Failed to create panel' },
      { status: 500 }
    );
  }
}
