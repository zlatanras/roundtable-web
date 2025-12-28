/**
 * Prisma Repository Implementation
 * Production-ready database access layer
 */

import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { Discussion, ExpertPanel, Expert, Message } from '@/types';
import { DEFAULT_EXPERTS } from '@/types';
import { CreateDiscussionInput, CreatePanelInput, UpdateExpertInput } from '@/lib/validation';
import {
  DiscussionRepository,
  ExpertPanelRepository,
  PaginatedResult,
  DiscussionFilters,
} from './types';

export class PrismaDiscussionRepository implements DiscussionRepository {
  async findById(id: string): Promise<Discussion | null> {
    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: { messages: true },
    });

    if (!discussion) return null;

    return {
      ...discussion,
      messages: discussion.messages.map((m) => ({
        ...m,
        debateStyle: m.debateStyle || null,
        responseTo: m.responseTo || null,
        expert: null,
      })),
    };
  }

  async findByIdWithPanel(id: string): Promise<(Discussion & { panel: ExpertPanel }) | null> {
    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: {
        messages: {
          include: { expert: true },
          orderBy: { createdAt: 'asc' },
        },
        panel: {
          include: { experts: true },
        },
      },
    });

    if (!discussion) return null;

    return {
      ...discussion,
      messages: discussion.messages.map((m) => ({
        ...m,
        debateStyle: m.debateStyle || null,
        responseTo: m.responseTo || null,
        expert: m.expert
          ? {
              ...m.expert,
              avatar: m.expert.avatar || null,
              aiModel: m.expert.aiModel || null,
            }
          : null,
      })),
      panel: {
        ...discussion.panel,
        description: discussion.panel.description || null,
        userId: discussion.panel.userId || null,
        experts: discussion.panel.experts.map((e) => ({
          ...e,
          avatar: e.avatar || null,
          aiModel: e.aiModel || null,
        })),
      },
    };
  }

  async create(
    data: CreateDiscussionInput & { userId: string; panelId: string }
  ): Promise<Discussion> {
    const discussion = await prisma.discussion.create({
      data: {
        title: data.title || `Discussion: ${data.topic.slice(0, 50)}...`,
        topic: data.topic,
        status: 'PENDING',
        totalRounds: data.totalRounds,
        currentRound: 0,
        language: data.language,
        model: data.model || 'anthropic/claude-sonnet-4.5',
        moderatorMode: data.moderatorMode,
        panelId: data.panelId,
        userId: data.userId,
      },
      include: { messages: true },
    });

    return {
      ...discussion,
      messages: [],
    };
  }

  async update(id: string, data: Partial<Discussion>): Promise<Discussion> {
    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.currentRound !== undefined) updateData.currentRound = data.currentRound;
    if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;

    const discussion = await prisma.discussion.update({
      where: { id },
      data: updateData,
      include: { messages: true },
    });

    return {
      ...discussion,
      messages: discussion.messages.map((m) => ({
        ...m,
        debateStyle: m.debateStyle || null,
        responseTo: m.responseTo || null,
        expert: null,
      })),
    };
  }

  async list(
    filters: DiscussionFilters,
    limit: number,
    offset: number
  ): Promise<PaginatedResult<Discussion>> {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;
    if (filters.panelId) where.panelId = filters.panelId;

    const [discussions, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          panel: { select: { name: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.discussion.count({ where }),
    ]);

    return {
      data: discussions.map((d) => ({
        ...d,
        messages: [],
        panel: undefined,
      })),
      total,
      limit,
      offset,
    };
  }

  async addMessage(
    discussionId: string,
    message: Omit<Message, 'id' | 'createdAt' | 'discussionId'>
  ): Promise<Message> {
    const created = await prisma.message.create({
      data: {
        content: message.content,
        role: message.role,
        round: message.round,
        debateStyle: message.debateStyle || null,
        responseTo: message.responseTo || null,
        expertId: message.expertId || null,
        discussionId,
      },
      include: { expert: true },
    });

    return {
      ...created,
      debateStyle: created.debateStyle || null,
      responseTo: created.responseTo || null,
      expert: created.expert
        ? {
            ...created.expert,
            avatar: created.expert.avatar || null,
            aiModel: created.expert.aiModel || null,
          }
        : null,
    };
  }
}

export class PrismaExpertPanelRepository implements ExpertPanelRepository {
  async findById(id: string): Promise<ExpertPanel | null> {
    const panel = await prisma.expertPanel.findUnique({
      where: { id },
    });

    if (!panel) return null;

    return {
      ...panel,
      description: panel.description || null,
      userId: panel.userId || null,
      experts: [],
    };
  }

  async findByIdWithExperts(id: string): Promise<(ExpertPanel & { experts: Expert[] }) | null> {
    const panel = await prisma.expertPanel.findUnique({
      where: { id },
      include: { experts: true },
    });

    if (!panel) return null;

    return {
      ...panel,
      description: panel.description || null,
      userId: panel.userId || null,
      experts: panel.experts.map((e) => ({
        ...e,
        avatar: e.avatar || null,
        aiModel: e.aiModel || null,
      })),
    };
  }

  async findDefault(): Promise<ExpertPanel | null> {
    let panel = await prisma.expertPanel.findFirst({
      where: { isDefault: true },
      include: { experts: true },
    });

    // Create default panel if it doesn't exist
    if (!panel) {
      panel = await prisma.expertPanel.create({
        data: {
          name: 'NORDticker Experts',
          description: 'Expert panel for digital marketing and web development discussions',
          isDefault: true,
          isPublic: true,
          experts: {
            create: DEFAULT_EXPERTS.map((e) => ({
              name: e.name,
              role: e.role,
              personality: e.personality,
              expertise: e.expertise,
              systemPrompt: e.systemPrompt,
              color: e.color,
              aiModel: e.aiModel || null,
            })),
          },
        },
        include: { experts: true },
      });
    }

    return {
      ...panel,
      description: panel.description || null,
      userId: panel.userId || null,
      experts: panel.experts.map((e) => ({
        ...e,
        avatar: e.avatar || null,
        aiModel: e.aiModel || null,
      })),
    };
  }

  async create(data: CreatePanelInput & { userId?: string }): Promise<ExpertPanel> {
    const panel = await prisma.expertPanel.create({
      data: {
        name: data.name,
        description: data.description || null,
        isDefault: false,
        isPublic: false,
        userId: data.userId || null,
        experts: {
          create: data.experts.map((e) => ({
            name: e.name,
            role: e.role,
            personality: e.personality,
            expertise: e.expertise,
            systemPrompt: e.systemPrompt,
            color: e.color || '#6366f1',
            avatar: e.avatar || null,
            aiModel: e.aiModel || null,
          })),
        },
      },
      include: { experts: true },
    });

    return {
      ...panel,
      description: panel.description || null,
      userId: panel.userId || null,
      experts: panel.experts.map((e) => ({
        ...e,
        avatar: e.avatar || null,
        aiModel: e.aiModel || null,
      })),
    };
  }

  async list(userId?: string): Promise<ExpertPanel[]> {
    const panels = await prisma.expertPanel.findMany({
      where: {
        OR: [{ isPublic: true }, ...(userId ? [{ userId }] : [])],
      },
      include: { experts: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return panels.map((p) => ({
      ...p,
      description: p.description || null,
      userId: p.userId || null,
      experts: p.experts.map((e) => ({
        ...e,
        avatar: e.avatar || null,
        aiModel: e.aiModel || null,
      })),
    }));
  }

  async updateExpert(panelId: string, expertId: string, data: UpdateExpertInput): Promise<Expert> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.personality !== undefined) updateData.personality = data.personality;
    if (data.expertise !== undefined) updateData.expertise = data.expertise;
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.aiModel !== undefined) updateData.aiModel = data.aiModel;

    const expert = await prisma.expert.update({
      where: {
        id: expertId,
        panelId: panelId,
      },
      data: updateData,
    });

    return {
      ...expert,
      avatar: expert.avatar || null,
      aiModel: expert.aiModel || null,
    };
  }
}

// Export singleton instances
export const prismaDiscussionRepository = new PrismaDiscussionRepository();
export const prismaExpertPanelRepository = new PrismaExpertPanelRepository();
