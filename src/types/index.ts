// Type definitions for AI Expert Roundtable

export type DiscussionStatus = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type MessageRole = 'EXPERT' | 'MODERATOR' | 'SYSTEM';
export type DebateStyle = 'agreeable' | 'challenging' | 'questioning' | 'building' | 'contrasting';

export interface Expert {
  id: string;
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  systemPrompt: string;
  color: string;
  avatar?: string | null;
  aiModel?: string | null; // Optional AI model override
  panelId: string;
}

export interface ExpertPanel {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isPublic: boolean;
  experts: Expert[];
  userId?: string | null;
}

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  round: number;
  debateStyle?: string | null;
  responseTo?: string | null;
  expertId?: string | null;
  expert?: Expert | null;
  discussionId: string;
  createdAt: Date;
}

export interface Discussion {
  id: string;
  title: string;
  topic: string;
  status: DiscussionStatus;
  totalRounds: number;
  currentRound: number;
  language: string;
  model: string;
  moderatorMode: boolean;
  messages: Message[];
  panelId: string;
  panel?: ExpertPanel;
  userId: string;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

// API Types
export interface CreateDiscussionRequest {
  topic: string;
  title?: string;
  panelId: string;
  model: string;
  totalRounds: number;
  moderatorMode: boolean;
  language: string;
}

export interface ModeratorMessageRequest {
  content: string;
}

export interface CreatePanelRequest {
  name: string;
  description?: string;
  experts: Omit<Expert, 'id' | 'panelId'>[];
}

export interface CreateExpertRequest {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  systemPrompt: string;
  color?: string;
  avatar?: string;
  aiModel?: string;
}

// SSE Event Types
export interface ExpertStartEvent {
  type: 'expert_start';
  expertId: string;
  expertName: string;
  expertColor: string;
  round: number;
  debateStyle: DebateStyle;
}

export interface TokenEvent {
  type: 'token';
  content: string;
}

export interface ExpertCompleteEvent {
  type: 'expert_complete';
  messageId: string;
  expertId: string;
  fullContent: string;
}

export interface RoundCompleteEvent {
  type: 'round_complete';
  round: number;
  consensusScore?: number;
}

export interface DiscussionCompleteEvent {
  type: 'discussion_complete';
  discussionId: string;
}

export interface DiscussionSummary {
  keyTakeaways: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'mixed' | 'negative';
  sentimentExplanation: string;
  consensusLevel: number;
  consensusExplanation: string;
  nextSteps: string;
}

export interface DiscussionSummaryEvent {
  type: 'discussion_summary';
  summary: DiscussionSummary;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export interface ModeratorPromptEvent {
  type: 'moderator_prompt';
  message: string;
}

export type SSEEvent =
  | ExpertStartEvent
  | TokenEvent
  | ExpertCompleteEvent
  | RoundCompleteEvent
  | DiscussionCompleteEvent
  | DiscussionSummaryEvent
  | ErrorEvent
  | ModeratorPromptEvent;

// Model definitions
export interface LLMModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'openai';
}

export const AVAILABLE_MODELS: LLMModel[] = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'openrouter' },
  { id: 'allenai/olmo-3.1-32b-think:free', name: 'OLMo 3.1 32B Think (Free)', provider: 'openrouter' },
  { id: 'openai/gpt-5.2', name: 'OpenAI GPT-5.2', provider: 'openrouter' },
  { id: 'deepseek/deepseek-v3.2-speciale', name: 'DeepSeek V3.2 Speciale', provider: 'openrouter' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'openrouter' },
  { id: 'moonshotai/kimi-k2-thinking', name: 'Kimi K2 Thinking', provider: 'openrouter' },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'openrouter' },
];

// Default Expert Panel (NORDticker experts)
export const DEFAULT_EXPERTS: Omit<Expert, 'id' | 'panelId'>[] = [
  {
    name: 'Sarah',
    role: 'Business Developer',
    personality: 'Strategic, data-driven, focuses on market opportunities and monetization',
    expertise: ['business strategy', 'market analysis', 'monetization', 'competitive analysis'],
    systemPrompt: `You are Sarah, an experienced Business Developer. You focus on:
- Market opportunities and competitive positioning
- Revenue streams and monetization strategies
- User acquisition and retention
- Business model optimization
- ROI and KPI analysis

Keep responses concise, strategic, and business-focused. Always think about scalability and profitability.`,
    color: '#22c55e',
    aiModel: 'anthropic/claude-sonnet-4.5',
  },
  {
    name: 'Marcus',
    role: 'WordPress Developer',
    personality: 'Technical, practical, solution-oriented',
    expertise: ['WordPress', 'PHP', 'database optimization', 'performance', 'plugins'],
    systemPrompt: `You are Marcus, a seasoned WordPress Developer. You focus on:
- Technical WordPress implementation
- Database structure and optimization
- Plugin recommendations and custom development
- Performance and scalability
- Content management workflows

Provide practical, implementable technical solutions. Consider maintenance and scalability.`,
    color: '#3b82f6',
    aiModel: 'openai/gpt-5.2',
  },
  {
    name: 'Lisa',
    role: 'SEO Expert',
    personality: 'Analytical, detail-oriented, obsessed with rankings and traffic',
    expertise: ['SEO', 'keyword research', 'technical SEO', 'content optimization', 'local SEO'],
    systemPrompt: `You are Lisa, an SEO Expert specializing in local and content-driven sites. You focus on:
- Keyword strategy and search intent
- Technical SEO implementation
- Local SEO for regional content
- Content structure for rankings
- Core Web Vitals and user experience

Always think about search visibility and user intent. Provide actionable SEO strategies.`,
    color: '#a855f7',
    aiModel: 'google/gemini-3-flash-preview',
  },
  {
    name: 'Tom',
    role: 'Content Marketing Strategist',
    personality: 'Creative, audience-focused, storytelling-oriented',
    expertise: ['content strategy', 'editorial planning', 'audience engagement', 'content automation'],
    systemPrompt: `You are Tom, a Content Marketing Strategist. You focus on:
- Content strategy and editorial calendars
- Audience engagement and community building
- Content automation and AI integration
- Brand voice and storytelling
- Content distribution strategies

Think about sustainable content creation and audience value. Balance automation with human touch.`,
    color: '#f97316',
    aiModel: 'deepseek/deepseek-v3.2-speciale',
  },
  {
    name: 'Nina',
    role: 'Social Media Expert',
    personality: 'Trend-aware, community-focused, engagement-driven',
    expertise: ['social media strategy', 'community management', 'content distribution', 'influencer marketing'],
    systemPrompt: `You are Nina, a Social Media Expert for local/regional businesses. You focus on:
- Platform-specific strategies
- Community building and engagement
- Content amplification and distribution
- Local influencer partnerships
- Social media automation tools

Think about building authentic local communities and driving traffic back to the main platform.`,
    color: '#ec4899',
    aiModel: 'x-ai/grok-4.1-fast',
  },
];
