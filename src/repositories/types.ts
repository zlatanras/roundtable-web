/**
 * Repository Types and Interfaces
 */

import { Discussion, ExpertPanel, Expert, Message } from '@/types';
import { CreateDiscussionInput, CreatePanelInput, UpdateExpertInput } from '@/lib/validation';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface DiscussionFilters {
  status?: string;
  userId?: string;
  panelId?: string;
}

export interface DiscussionRepository {
  findById(id: string): Promise<Discussion | null>;
  findByIdWithPanel(id: string): Promise<(Discussion & { panel: ExpertPanel }) | null>;
  create(data: CreateDiscussionInput & { userId: string; panelId: string }): Promise<Discussion>;
  update(id: string, data: Partial<Discussion>): Promise<Discussion>;
  list(filters: DiscussionFilters, limit: number, offset: number): Promise<PaginatedResult<Discussion>>;
  addMessage(discussionId: string, message: Omit<Message, 'id' | 'createdAt' | 'discussionId'>): Promise<Message>;
}

export interface ExpertPanelRepository {
  findById(id: string): Promise<ExpertPanel | null>;
  findByIdWithExperts(id: string): Promise<(ExpertPanel & { experts: Expert[] }) | null>;
  findDefault(): Promise<ExpertPanel | null>;
  create(data: CreatePanelInput & { userId?: string }): Promise<ExpertPanel>;
  list(userId?: string): Promise<ExpertPanel[]>;
  updateExpert(panelId: string, expertId: string, data: UpdateExpertInput): Promise<Expert>;
}
