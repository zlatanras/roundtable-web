/**
 * Zod Validation Schemas for API Inputs
 */

import { z } from 'zod';

// Sanitize input to prevent prompt injection
function sanitizeForPrompt(text: string): string {
  return text
    .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, '')
    .replace(/system\s*:/gi, '')
    .replace(/\[INST\]/gi, '')
    .replace(/<\|.*?\|>/g, '')
    .trim();
}

// Custom Zod transform for sanitization
const sanitizedString = (maxLength: number = 10000) =>
  z.string().max(maxLength).transform(sanitizeForPrompt);

// Discussion creation schema
export const CreateDiscussionSchema = z.object({
  topic: sanitizedString(5000).refine((val) => val.length >= 10, {
    message: 'Topic must be at least 10 characters',
  }),
  title: z.string().max(200).optional(),
  panelId: z.string().optional(),
  model: z.string().regex(/^[a-z0-9-]+\/[a-z0-9.-]+$/i, {
    message: 'Invalid model format. Expected: provider/model-name',
  }).optional(),
  totalRounds: z.number().int().min(1).max(10).default(4),
  moderatorMode: z.boolean().default(false),
  language: z.enum(['en', 'de']).default('en'),
});

export type CreateDiscussionInput = z.infer<typeof CreateDiscussionSchema>;

// Moderator message schema
export const ModeratorMessageSchema = z.object({
  content: sanitizedString(2000).refine((val) => val.length >= 1, {
    message: 'Message cannot be empty',
  }),
});

export type ModeratorMessageInput = z.infer<typeof ModeratorMessageSchema>;

// Expert panel creation schema
export const CreatePanelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  experts: z.array(
    z.object({
      name: z.string().min(1).max(50),
      role: z.string().min(1).max(100),
      personality: z.string().max(500),
      expertise: z.array(z.string().max(50)).min(1).max(10),
      systemPrompt: sanitizedString(2000),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      avatar: z.string().url().optional(),
      aiModel: z.string().regex(/^[a-z0-9-]+\/[a-z0-9.-]+$/i).optional(),
    })
  ).min(2).max(10),
});

export type CreatePanelInput = z.infer<typeof CreatePanelSchema>;

// Expert update schema
export const UpdateExpertSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.string().min(1).max(100).optional(),
  personality: z.string().max(500).optional(),
  expertise: z.array(z.string().max(50)).min(1).max(10).optional(),
  systemPrompt: sanitizedString(2000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  avatar: z.string().url().nullable().optional(),
  aiModel: z.string().regex(/^[a-z0-9-]+\/[a-z0-9.-]+$/i).nullable().optional(),
});

export type UpdateExpertInput = z.infer<typeof UpdateExpertSchema>;

// Pagination schema
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// Helper to validate and return result or error response
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.core.$ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: 'Validation failed',
    details: result.error.issues,
  };
}
