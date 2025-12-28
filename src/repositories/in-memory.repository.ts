/**
 * In-Memory Repository Implementation
 * For development and demo purposes
 */

import { v4 as uuidv4 } from 'uuid';
import { Discussion, ExpertPanel, Expert, Message } from '@/types';
import { DEFAULT_EXPERTS } from '@/types';
import { CreateDiscussionInput, CreatePanelInput, UpdateExpertInput } from '@/lib/validation';
import {
  DiscussionRepository,
  ExpertPanelRepository,
  PaginatedResult,
  DiscussionFilters,
} from './types';

// In-memory storage
const discussions = new Map<string, Discussion & { panel: ExpertPanel }>();
const panels = new Map<string, ExpertPanel & { experts: Expert[] }>();

// Initialize default panel
const DEFAULT_PANEL_ID = 'default-nordticker';

function initializeDefaultPanel() {
  if (!panels.has(DEFAULT_PANEL_ID)) {
    const experts: Expert[] = DEFAULT_EXPERTS.map((e, i) => ({
      ...e,
      id: `expert-${i}`,
      panelId: DEFAULT_PANEL_ID,
    }));

    panels.set(DEFAULT_PANEL_ID, {
      id: DEFAULT_PANEL_ID,
      name: 'NORDticker Experts',
      description: 'Expert panel for digital marketing and web development discussions',
      isDefault: true,
      isPublic: true,
      experts,
      userId: null,
    });
  }
}

// Initialize on module load
initializeDefaultPanel();

export class InMemoryDiscussionRepository implements DiscussionRepository {
  async findById(id: string): Promise<Discussion | null> {
    const discussion = discussions.get(id);
    if (!discussion) return null;

    // Return without panel for basic lookup
    const { panel, ...rest } = discussion;
    return rest as Discussion;
  }

  async findByIdWithPanel(id: string): Promise<(Discussion & { panel: ExpertPanel }) | null> {
    return discussions.get(id) || null;
  }

  async create(
    data: CreateDiscussionInput & { userId: string; panelId: string }
  ): Promise<Discussion> {
    const panel = panels.get(data.panelId);
    if (!panel) {
      throw new Error('Panel not found');
    }

    const now = new Date();
    const discussion: Discussion & { panel: ExpertPanel } = {
      id: uuidv4(),
      title: data.title || `Discussion: ${data.topic.slice(0, 50)}...`,
      topic: data.topic,
      status: 'PENDING',
      totalRounds: data.totalRounds,
      currentRound: 0,
      language: data.language,
      model: data.model || 'anthropic/claude-sonnet-4.5',
      moderatorMode: data.moderatorMode,
      messages: [],
      panelId: data.panelId,
      panel,
      userId: data.userId,
      createdAt: now,
    };

    discussions.set(discussion.id, discussion);
    return discussion;
  }

  async update(id: string, data: Partial<Discussion>): Promise<Discussion> {
    const discussion = discussions.get(id);
    if (!discussion) {
      throw new Error('Discussion not found');
    }

    Object.assign(discussion, data);
    return discussion;
  }

  async list(
    filters: DiscussionFilters,
    limit: number,
    offset: number
  ): Promise<PaginatedResult<Discussion>> {
    let allDiscussions = Array.from(discussions.values());

    // Apply filters
    if (filters.status) {
      allDiscussions = allDiscussions.filter((d) => d.status === filters.status);
    }
    if (filters.userId) {
      allDiscussions = allDiscussions.filter((d) => d.userId === filters.userId);
    }
    if (filters.panelId) {
      allDiscussions = allDiscussions.filter((d) => d.panelId === filters.panelId);
    }

    // Sort by createdAt descending
    allDiscussions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const paginated = allDiscussions.slice(offset, offset + limit);

    return {
      data: paginated,
      total: allDiscussions.length,
      limit,
      offset,
    };
  }

  async addMessage(
    discussionId: string,
    message: Omit<Message, 'id' | 'createdAt' | 'discussionId'>
  ): Promise<Message> {
    const discussion = discussions.get(discussionId);
    if (!discussion) {
      throw new Error('Discussion not found');
    }

    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      discussionId,
      createdAt: new Date(),
    };

    discussion.messages.push(newMessage);
    return newMessage;
  }
}

export class InMemoryExpertPanelRepository implements ExpertPanelRepository {
  async findById(id: string): Promise<ExpertPanel | null> {
    const panel = panels.get(id);
    if (!panel) return null;

    const { experts, ...rest } = panel;
    return rest as ExpertPanel;
  }

  async findByIdWithExperts(id: string): Promise<(ExpertPanel & { experts: Expert[] }) | null> {
    return panels.get(id) || null;
  }

  async findDefault(): Promise<ExpertPanel | null> {
    initializeDefaultPanel();
    return panels.get(DEFAULT_PANEL_ID) || null;
  }

  async create(data: CreatePanelInput & { userId?: string }): Promise<ExpertPanel> {
    const panelId = uuidv4();

    const experts: Expert[] = data.experts.map((e, i) => ({
      ...e,
      id: `${panelId}-expert-${i}`,
      panelId,
      avatar: e.avatar || null,
      aiModel: e.aiModel || null,
    }));

    const panel: ExpertPanel & { experts: Expert[] } = {
      id: panelId,
      name: data.name,
      description: data.description || null,
      isDefault: false,
      isPublic: false,
      experts,
      userId: data.userId || null,
    };

    panels.set(panelId, panel);
    return panel;
  }

  async list(userId?: string): Promise<ExpertPanel[]> {
    initializeDefaultPanel();

    let allPanels = Array.from(panels.values());

    // Show public panels and user's own panels
    if (userId) {
      allPanels = allPanels.filter((p) => p.isPublic || p.userId === userId);
    } else {
      allPanels = allPanels.filter((p) => p.isPublic);
    }

    return allPanels;
  }

  async updateExpert(panelId: string, expertId: string, data: UpdateExpertInput): Promise<Expert> {
    const panel = panels.get(panelId);
    if (!panel) {
      throw new Error('Panel not found');
    }

    const expert = panel.experts.find((e) => e.id === expertId);
    if (!expert) {
      throw new Error('Expert not found');
    }

    // Update expert fields
    if (data.name !== undefined) expert.name = data.name;
    if (data.role !== undefined) expert.role = data.role;
    if (data.personality !== undefined) expert.personality = data.personality;
    if (data.expertise !== undefined) expert.expertise = data.expertise;
    if (data.systemPrompt !== undefined) expert.systemPrompt = data.systemPrompt;
    if (data.color !== undefined) expert.color = data.color;
    if (data.avatar !== undefined) expert.avatar = data.avatar;
    if (data.aiModel !== undefined) expert.aiModel = data.aiModel;

    return expert;
  }
}

// Export singleton instances
export const discussionRepository = new InMemoryDiscussionRepository();
export const expertPanelRepository = new InMemoryExpertPanelRepository();

// Export the raw stores for stream route (temporary, until we refactor)
export { discussions, panels, DEFAULT_PANEL_ID };
