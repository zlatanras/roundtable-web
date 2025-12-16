# AI Expert Roundtable - Web Version Plan

## Table of Contents
1. [Repository Overview](#repository-overview)
2. [Technology Stack for Web Version](#technology-stack-for-web-version)
3. [Architecture Design](#architecture-design)
4. [Feature Mapping (CLI → Web)](#feature-mapping-cli--web)
5. [Implementation Phases](#implementation-phases)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [UI/UX Design](#uiux-design)
9. [Claude Code Build Instructions](#claude-code-build-instructions)
10. [Deployment Strategy](#deployment-strategy)

---

## Repository Overview

### What This Application Does

The **AI Expert Roundtable** is a sophisticated multi-agent discussion orchestration system that simulates realistic expert panel discussions using AI. Key capabilities:

1. **Multi-Agent Debates**: Orchestrates 5+ AI experts with distinct personalities, expertise areas, and debate styles
2. **Dynamic Discussions**: Experts respond to each other, challenge ideas, build on suggestions, and reach consensus
3. **Multiple LLM Support**: Works with 10+ models (GPT-4, Claude, Llama, Gemini, etc.) via OpenRouter/OpenAI
4. **Moderator Mode**: Human user can interject and guide the discussion in real-time
5. **Beautiful Output**: Generates HTML reports and JSON exports of discussions
6. **Configurable Expert Panels**: YAML-based configuration for custom expert teams
7. **Internationalization**: Supports German and English

### Current Architecture (Python CLI)

```
┌─────────────────────────────────────────────────────────────┐
│                     roundtable.py (CLI)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Models     │  │   Services   │  │    Formatters    │   │
│  │ - Expert     │  │ - LLMClient  │  │ - HTMLFormatter  │   │
│  │ - Message    │  │ - Discussion │  │ - JSONFormatter  │   │
│  │              │  │   Engine     │  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │   Config     │  │            External APIs             │ │
│  │ - YAML Load  │  │ - OpenRouter / OpenAI LLM APIs      │ │
│  │ - i18n       │  │                                      │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Data Models

**Expert**:
- `name`: Expert identifier
- `role`: Professional title (e.g., "Business Developer")
- `personality`: Character description
- `expertise`: List of skill areas
- `system_prompt`: LLM instruction

**Message**:
- `speaker`: Expert name or "Moderator"
- `content`: Message text
- `timestamp`: ISO timestamp
- `response_to`: Optional reference to previous speaker

---

## Technology Stack for Web Version

### Recommended Stack: Next.js 14+ (App Router)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14+ (App Router) | Server components, streaming, API routes, excellent DX |
| **Language** | TypeScript | Type safety, better IDE support, maintainability |
| **Styling** | Tailwind CSS | Already used in HTML output, consistent design system |
| **UI Components** | shadcn/ui | High-quality, accessible, customizable components |
| **State Management** | Zustand | Lightweight, simple, great for real-time updates |
| **Real-time** | Server-Sent Events (SSE) | Stream AI responses as they generate |
| **Database** | PostgreSQL + Prisma | Reliable, scalable, excellent ORM |
| **Authentication** | NextAuth.js (Auth.js) | Flexible, supports multiple providers |
| **LLM Integration** | Vercel AI SDK | Streaming, multiple providers, edge-compatible |
| **Deployment** | Vercel | Optimized for Next.js, easy deployment |

### Why Next.js?

1. **Server Components**: Heavy lifting on server, smaller client bundles
2. **Streaming UI**: Perfect for real-time AI responses
3. **API Routes**: Built-in backend for LLM proxy calls
4. **Edge Runtime**: Fast, global distribution
5. **Built-in Optimizations**: Image, font, script optimization
6. **Great DX**: Hot reload, TypeScript support, excellent tooling

### Alternative Stacks Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Remix** | Great data loading | Smaller ecosystem |
| **SvelteKit** | Very fast, simple | Smaller community |
| **Nuxt (Vue)** | Good DX | Less React ecosystem |
| **Astro** | Great for static | Less suited for apps |

**Verdict**: Next.js is the best choice due to its excellent streaming support (critical for AI), large ecosystem, and deployment simplicity.

---

## Architecture Design

### Web Application Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │
│  │   Pages/Routes  │ │   Components    │ │    State (Zustand)  │   │
│  │ - /             │ │ - ExpertCard    │ │ - discussionStore   │   │
│  │ - /discussion   │ │ - MessageBubble │ │ - expertStore       │   │
│  │ - /history      │ │ - ChatPanel     │ │ - settingsStore     │   │
│  │ - /experts      │ │ - SettingsModal │ │                     │   │
│  │ - /settings     │ │ - ModeratorInput│ │                     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│                         API LAYER (Next.js API Routes)              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │
│  │ /api/discussion │ │ /api/experts    │ │  /api/settings      │   │
│  │ - POST start    │ │ - GET list      │ │  - GET/PUT config   │   │
│  │ - GET stream    │ │ - POST create   │ │                     │   │
│  │ - POST moderate │ │ - PUT update    │ │                     │   │
│  │ - POST stop     │ │ - DELETE remove │ │                     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│                         SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │
│  │ DiscussionService│ │   LLMService    │ │   ExportService     │   │
│  │ - orchestrate() │ │ - chat()        │ │ - toHTML()          │   │
│  │ - addMessage()  │ │ - stream()      │ │ - toJSON()          │   │
│  │ - getHistory()  │ │ - providers[]   │ │ - toPDF()           │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │
│  │ Prisma ORM      │ │   PostgreSQL    │ │   Redis (optional)  │   │
│  │ - Discussion    │ │   Database      │ │   Session Cache     │   │
│  │ - Expert        │ │                 │ │                     │   │
│  │ - Message       │ │                 │ │                     │   │
│  │ - User          │ │                 │ │                     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│                         EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │
│  │    OpenRouter   │ │     OpenAI      │ │   Auth Provider     │   │
│  │    LLM API      │ │     LLM API     │ │   (Google, GitHub)  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Real-time Streaming Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Next.js Server │────▶│   LLM Provider   │
│              │     │                 │     │                  │
│  - Zustand   │◀────│  - SSE Stream   │◀────│  - OpenRouter    │
│  - React     │     │  - AI SDK       │     │  - OpenAI        │
│              │     │                 │     │                  │
└──────────────┘     └─────────────────┘     └──────────────────┘
        │                    │
        │    WebSocket       │
        │    (optional)      │
        ▼                    │
┌──────────────┐             │
│  Real-time   │◀────────────┘
│  Updates     │   Broadcast
└──────────────┘   state changes
```

---

## Feature Mapping (CLI → Web)

| CLI Feature | Web Equivalent | Implementation |
|-------------|----------------|----------------|
| Model Selection | Dropdown/Radio in UI | Settings panel with model cards |
| Output Format | Export buttons | Download as HTML/JSON/PDF |
| Discussion Depth | Slider (3-5 rounds) | Range input with preview |
| Moderator Mode | Chat input during discussion | Real-time input field |
| Expert Panel Selection | Visual panel picker | Card-based selection UI |
| Topic Input | Rich text input | Textarea with formatting |
| Progress Display | Real-time streaming | Animated message bubbles |
| Final Report | Interactive view | Full-screen report with sharing |

### New Web-Exclusive Features

1. **Discussion History**: Save and revisit past discussions
2. **Expert Builder**: Visual tool to create custom experts
3. **Panel Templates**: Pre-built expert panels for different domains
4. **Collaboration**: Share discussions with team members
5. **API Key Management**: Securely store and manage LLM API keys
6. **Usage Analytics**: Track API usage and costs
7. **Export Options**: PDF, Markdown, share links
8. **Mobile App**: Responsive design, PWA support

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
**Goal**: Set up project foundation

```
Tasks:
├── Initialize Next.js 14 project with TypeScript
├── Configure Tailwind CSS + shadcn/ui
├── Set up Prisma with PostgreSQL
├── Create database schema (Discussion, Expert, Message, User)
├── Configure environment variables
├── Set up authentication (NextAuth.js)
├── Create basic layout and navigation
└── Set up Vercel AI SDK
```

**Deliverables**:
- Bootable Next.js app with auth
- Database connected and migrations running
- Basic UI shell

### Phase 2: Expert Management (Week 2)
**Goal**: Port expert system to web

```
Tasks:
├── Create Expert model and API routes
├── Build ExpertCard component
├── Build ExpertList page
├── Build ExpertEditor component (create/edit)
├── Import default experts from YAML
├── Create expert panel management
└── Add expert validation
```

**Deliverables**:
- Full expert CRUD
- Panel selection UI
- Import existing YAML configs

### Phase 3: LLM Integration (Week 3)
**Goal**: Connect AI providers

```
Tasks:
├── Create LLM service abstraction
├── Implement OpenRouter provider
├── Implement OpenAI provider
├── Add streaming support with AI SDK
├── Create model selection UI
├── Build API key management
├── Add retry logic and error handling
└── Rate limiting and usage tracking
```

**Deliverables**:
- Working LLM calls
- Streaming responses
- Multi-provider support

### Phase 4: Discussion Engine (Week 4)
**Goal**: Core discussion orchestration

```
Tasks:
├── Port DiscussionEngine to TypeScript
├── Create discussion API routes
├── Implement round-based discussion logic
├── Add debate style rotation
├── Create message streaming endpoint
├── Build discussion state management
├── Add moderator intervention support
└── Implement discussion stopping
```

**Deliverables**:
- Full discussion orchestration
- Real-time message streaming
- Moderator mode working

### Phase 5: Discussion UI (Week 5)
**Goal**: Beautiful chat interface

```
Tasks:
├── Build ChatPanel component
├── Build MessageBubble component (with expert colors)
├── Build ExpertAvatars sidebar
├── Build ModeratorInput component
├── Add message animations
├── Build round indicators
├── Add typing indicators
├── Build discussion controls (start/stop/pause)
└── Mobile-responsive design
```

**Deliverables**:
- Full chat UI
- Real-time updates
- Responsive design

### Phase 6: Export & History (Week 6)
**Goal**: Output and persistence

```
Tasks:
├── Build HTML export (port existing formatter)
├── Build JSON export
├── Add PDF export
├── Create discussion history page
├── Build discussion detail view
├── Add search and filtering
├── Create share functionality
└── Add discussion templates
```

**Deliverables**:
- Multiple export formats
- Full history with search
- Sharing capabilities

### Phase 7: Polish & Deploy (Week 7)
**Goal**: Production readiness

```
Tasks:
├── Performance optimization
├── SEO meta tags
├── Error boundaries
├── Loading states
├── Accessibility audit
├── Security review
├── Documentation
├── Vercel deployment
└── Custom domain setup
```

**Deliverables**:
- Production-ready app
- Live on custom domain
- Full documentation

---

## Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  image         String?
  apiKeys       ApiKey[]
  discussions   Discussion[]
  expertPanels  ExpertPanel[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model ApiKey {
  id        String   @id @default(cuid())
  provider  String   // "openrouter" | "openai"
  key       String   // encrypted
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, provider])
}

model ExpertPanel {
  id          String    @id @default(cuid())
  name        String
  description String?
  isDefault   Boolean   @default(false)
  isPublic    Boolean   @default(false)
  experts     Expert[]
  discussions Discussion[]
  userId      String?
  user        User?     @relation(fields: [userId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Expert {
  id           String      @id @default(cuid())
  name         String
  role         String
  personality  String
  expertise    String[]    // Array of expertise areas
  systemPrompt String      @db.Text
  color        String      @default("#6366f1") // For UI
  avatar       String?     // Optional avatar URL
  panelId      String
  panel        ExpertPanel @relation(fields: [panelId], references: [id], onDelete: Cascade)
  messages     Message[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Discussion {
  id             String      @id @default(cuid())
  title          String
  topic          String      @db.Text
  status         DiscussionStatus @default(PENDING)
  totalRounds    Int         @default(4)
  currentRound   Int         @default(0)
  language       String      @default("en")
  model          String      // e.g., "openai/gpt-4o"
  moderatorMode  Boolean     @default(false)
  messages       Message[]
  panelId        String
  panel          ExpertPanel @relation(fields: [panelId], references: [id])
  userId         String
  user           User        @relation(fields: [userId], references: [id])
  metadata       Json?       // Additional settings
  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

model Message {
  id           String     @id @default(cuid())
  content      String     @db.Text
  role         MessageRole // EXPERT | MODERATOR | SYSTEM
  round        Int
  debateStyle  String?    // agreeable, challenging, etc.
  responseTo   String?    // Reference to previous speaker
  expertId     String?
  expert       Expert?    @relation(fields: [expertId], references: [id])
  discussionId String
  discussion   Discussion @relation(fields: [discussionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())
}

enum DiscussionStatus {
  PENDING
  IN_PROGRESS
  PAUSED
  COMPLETED
  CANCELLED
}

enum MessageRole {
  EXPERT
  MODERATOR
  SYSTEM
}
```

---

## API Endpoints

### Discussion Endpoints

```typescript
// POST /api/discussions
// Create a new discussion
{
  topic: string;
  panelId: string;
  model: string;
  totalRounds: number;
  moderatorMode: boolean;
  language: "en" | "de";
}

// GET /api/discussions
// List user's discussions with pagination
Query: { page?: number; limit?: number; status?: DiscussionStatus }

// GET /api/discussions/[id]
// Get discussion with messages

// POST /api/discussions/[id]/start
// Start the discussion, returns SSE stream

// POST /api/discussions/[id]/moderate
// Add moderator message
{ content: string; }

// POST /api/discussions/[id]/stop
// Stop discussion early

// GET /api/discussions/[id]/export
// Export discussion
Query: { format: "html" | "json" | "pdf" }
```

### Expert Endpoints

```typescript
// GET /api/panels
// List expert panels

// POST /api/panels
// Create expert panel
{ name: string; description?: string; experts: Expert[]; }

// GET /api/panels/[id]
// Get panel with experts

// PUT /api/panels/[id]
// Update panel

// DELETE /api/panels/[id]
// Delete panel

// POST /api/panels/[id]/experts
// Add expert to panel

// PUT /api/panels/[id]/experts/[expertId]
// Update expert

// DELETE /api/panels/[id]/experts/[expertId]
// Remove expert
```

### Settings Endpoints

```typescript
// GET /api/settings
// Get user settings

// PUT /api/settings
// Update settings
{ defaultModel?: string; defaultLanguage?: string; }

// POST /api/settings/api-keys
// Add/update API key
{ provider: string; key: string; }

// DELETE /api/settings/api-keys/[provider]
// Remove API key
```

### Streaming Endpoint (SSE)

```typescript
// GET /api/discussions/[id]/stream
// Server-Sent Events stream for real-time updates
// Events:
// - expert_start: { expertId, expertName, round }
// - token: { content } // Streaming tokens
// - expert_complete: { expertId, messageId, fullContent }
// - round_complete: { round }
// - discussion_complete: { discussionId }
// - error: { message }
```

---

## UI/UX Design

### Page Structure

```
/                     # Landing page
/auth/signin          # Sign in
/dashboard            # User dashboard (discussions list)
/discussion/new       # Create new discussion
/discussion/[id]      # Active discussion view
/discussion/[id]/report  # Final report view
/experts              # Expert panel management
/experts/[panelId]    # Edit panel
/settings             # User settings
```

### Key Components

```
components/
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── discussion/
│   ├── DiscussionSetup.tsx      # Topic, settings
│   ├── ChatPanel.tsx            # Main chat view
│   ├── MessageBubble.tsx        # Individual message
│   ├── ExpertIndicator.tsx      # Who's speaking
│   ├── ModeratorInput.tsx       # User input
│   ├── RoundIndicator.tsx       # Current round
│   ├── DiscussionControls.tsx   # Start/Stop/Pause
│   └── TypingIndicator.tsx      # Expert is thinking
├── expert/
│   ├── ExpertCard.tsx           # Expert display
│   ├── ExpertEditor.tsx         # Create/Edit expert
│   ├── ExpertAvatar.tsx         # Colored avatar
│   └── PanelSelector.tsx        # Choose panel
├── export/
│   ├── HTMLReport.tsx           # Full report view
│   ├── ExportMenu.tsx           # Download options
│   └── ShareDialog.tsx          # Share functionality
└── common/
    ├── ModelSelector.tsx        # Choose LLM model
    ├── LanguageSwitch.tsx       # EN/DE toggle
    └── LoadingState.tsx         # Skeletons/spinners
```

### Design System

**Colors** (matching existing HTML output):
- Primary: Indigo (#6366f1)
- Expert Colors:
  - Sarah (Business): Green (#22c55e)
  - Marcus (Tech): Blue (#3b82f6)
  - Lisa (SEO): Purple (#a855f7)
  - Tom (Content): Orange (#f97316)
  - Nina (Social): Pink (#ec4899)
- Background: Slate (#0f172a dark, #f8fafc light)
- Surface: White/Dark cards

**Typography**:
- Headers: Inter (bold)
- Body: Inter (regular)
- Code: JetBrains Mono

**Components**:
- Use shadcn/ui for consistency
- Tailwind for custom styling
- Framer Motion for animations

---

## Claude Code Build Instructions

### Prerequisites

Before starting, ensure:
1. Node.js 18+ installed
2. PostgreSQL database available
3. OpenRouter or OpenAI API key
4. Git for version control

### Step-by-Step Build Instructions

#### 1. Initialize Project

```bash
# Create Next.js project
npx create-next-app@latest roundtable-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd roundtable-web

# Install core dependencies
npm install @prisma/client zustand @tanstack/react-query
npm install ai openai

# Install UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea select dialog dropdown-menu avatar badge skeleton toast

# Install additional utilities
npm install date-fns zod react-hook-form @hookform/resolvers
npm install lucide-react

# Install dev dependencies
npm install -D prisma @types/node
```

#### 2. Set Up Database

```bash
# Initialize Prisma
npx prisma init

# Copy the schema from this document to prisma/schema.prisma
# Then run migrations
npx prisma migrate dev --name init
npx prisma generate
```

#### 3. Create Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── signin/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── discussion/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── experts/
│   │   │   ├── page.tsx
│   │   │   └── [panelId]/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── discussions/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── start/route.ts
│   │   │       ├── moderate/route.ts
│   │   │       └── stream/route.ts
│   │   ├── panels/
│   │   │   └── route.ts
│   │   └── settings/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # shadcn components
│   ├── layout/
│   ├── discussion/
│   ├── expert/
│   └── common/
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # Auth config
│   └── utils.ts         # Utilities
├── services/
│   ├── discussion.ts    # Discussion orchestration
│   ├── llm.ts           # LLM integration
│   └── export.ts        # Export functionality
├── stores/
│   ├── discussion.ts    # Zustand store
│   └── settings.ts
└── types/
    └── index.ts         # TypeScript types
```

#### 4. Environment Variables

```env
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/roundtable"

# Auth (NextAuth)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# LLM Providers
OPENROUTER_API_KEY="your-openrouter-key"
OPENAI_API_KEY="your-openai-key"

# Optional: Analytics
VERCEL_ANALYTICS_ID="your-analytics-id"
```

#### 5. Key Implementation Files

**lib/prisma.ts**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**services/llm.ts**
```typescript
import OpenAI from 'openai'

export const MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'openrouter' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter' },
] as const

export async function* streamChat(
  model: string,
  messages: { role: string; content: string }[],
  apiKey: string
) {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  const stream = await client.chat.completions.create({
    model,
    messages: messages as any,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) yield content
  }
}
```

**services/discussion.ts**
```typescript
import { prisma } from '@/lib/prisma'
import { streamChat } from './llm'

const DEBATE_STYLES = [
  'agreeable',
  'challenging',
  'questioning',
  'building',
  'contrasting',
] as const

export async function* runDiscussionRound(
  discussionId: string,
  round: number,
  apiKey: string
) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: {
      panel: { include: { experts: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })

  if (!discussion) throw new Error('Discussion not found')

  const experts = discussion.panel.experts
  const shuffledExperts = [...experts].sort(() => Math.random() - 0.5)

  for (const expert of shuffledExperts) {
    const debateStyle = DEBATE_STYLES[Math.floor(Math.random() * DEBATE_STYLES.length)]

    const messages = buildPrompt(expert, discussion, round, debateStyle)

    yield { type: 'expert_start', expert: expert.name, round }

    let fullContent = ''
    for await (const token of streamChat(discussion.model, messages, apiKey)) {
      fullContent += token
      yield { type: 'token', content: token }
    }

    const message = await prisma.message.create({
      data: {
        content: fullContent,
        role: 'EXPERT',
        round,
        debateStyle,
        expertId: expert.id,
        discussionId,
      },
    })

    yield { type: 'expert_complete', messageId: message.id, content: fullContent }
  }

  yield { type: 'round_complete', round }
}
```

**stores/discussion.ts**
```typescript
import { create } from 'zustand'

interface Message {
  id: string
  content: string
  expertName: string
  expertColor: string
  round: number
  isStreaming?: boolean
}

interface DiscussionStore {
  messages: Message[]
  currentRound: number
  isRunning: boolean
  streamingMessage: string
  addMessage: (message: Message) => void
  appendToStreaming: (content: string) => void
  setRunning: (running: boolean) => void
  reset: () => void
}

export const useDiscussionStore = create<DiscussionStore>((set) => ({
  messages: [],
  currentRound: 0,
  isRunning: false,
  streamingMessage: '',

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToStreaming: (content) =>
    set((state) => ({ streamingMessage: state.streamingMessage + content })),

  setRunning: (running) => set({ isRunning: running }),

  reset: () => set({ messages: [], currentRound: 0, isRunning: false, streamingMessage: '' }),
}))
```

**API Route: api/discussions/[id]/stream/route.ts**
```typescript
import { runDiscussionRound } from '@/services/discussion'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: params.id },
  })

  if (!discussion) {
    return new Response('Not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let round = 1; round <= discussion.totalRounds; round++) {
          for await (const event of runDiscussionRound(
            params.id,
            round,
            process.env.OPENROUTER_API_KEY!
          )) {
            const data = `data: ${JSON.stringify(event)}\n\n`
            controller.enqueue(encoder.encode(data))
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`))
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: String(error) })}\n\n`)
        )
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

#### 6. Import Existing Expert Data

Create a seed script to import from YAML:

```typescript
// prisma/seed.ts
import { prisma } from '../src/lib/prisma'
import yaml from 'js-yaml'
import fs from 'fs'

async function main() {
  // Read existing experts.yaml
  const expertsYaml = fs.readFileSync('../config/experts.yaml', 'utf8')
  const panels = yaml.load(expertsYaml) as Record<string, any[]>

  for (const [panelName, experts] of Object.entries(panels)) {
    const panel = await prisma.expertPanel.create({
      data: {
        name: panelName,
        isDefault: panelName === 'nordticker_experts',
        isPublic: true,
      },
    })

    const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899']

    for (let i = 0; i < experts.length; i++) {
      const expert = experts[i]
      await prisma.expert.create({
        data: {
          name: expert.name,
          role: expert.role,
          personality: expert.personality,
          expertise: expert.expertise,
          systemPrompt: expert.system_prompt,
          color: colors[i % colors.length],
          panelId: panel.id,
        },
      })
    }
  }
}

main()
```

#### 7. Run and Test

```bash
# Start development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Seed database with existing experts
npx prisma db seed

# Open browser
open http://localhost:3000
```

### Testing Strategy

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Create test files following pattern:
# __tests__/services/discussion.test.ts
# __tests__/components/ChatPanel.test.tsx
```

### Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - DATABASE_URL (use Vercel Postgres or external)
# - NEXTAUTH_SECRET
# - OPENROUTER_API_KEY
```

---

## Deployment Strategy

### Recommended: Vercel + Vercel Postgres

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add Vercel Postgres** (one-click setup)
4. **Configure Environment Variables**
5. **Deploy**

### Alternative: Self-hosted

- Docker Compose with PostgreSQL
- Deploy to Railway, Render, or DigitalOcean
- Use managed PostgreSQL (Supabase, Neon)

### Cost Estimates

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | 100GB bandwidth | $20/mo |
| Vercel Postgres | 256MB | $20/mo |
| OpenRouter | Pay-as-you-go | ~$0.01-0.10/discussion |

---

## Summary

This plan transforms the Python CLI-based AI Expert Roundtable into a modern, real-time web application with:

- **Beautiful UI**: Chat interface with streaming responses
- **Real-time**: SSE for live expert discussions
- **Persistent**: Database storage for history
- **Flexible**: Custom expert panels and models
- **Shareable**: Export and collaboration features
- **Production-ready**: Auth, error handling, deployment

The implementation follows a phased approach, allowing for iterative development and testing. The core architecture leverages Next.js 14's powerful features like Server Components and streaming, combined with a robust PostgreSQL backend.

**Estimated Timeline**: 6-8 weeks for full implementation
**Recommended Team Size**: 1-2 developers

---

*Document created: December 2024*
*Version: 1.0*
