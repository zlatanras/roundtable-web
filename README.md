# AI Expert Roundtable - Web Version

A real-time multi-agent discussion platform where AI experts with distinct personalities debate topics and build consensus.

## Features

- **Multi-Expert Panels** - 5+ AI experts (Business, Tech, SEO, Content, Social Media) with unique personalities
- **Real-time Streaming** - Watch expert responses stream live via Server-Sent Events
- **Moderator Mode** - Interject comments and questions to guide the discussion
- **Smart Debate Styles** - Agreeable, challenging, questioning, building, contrasting
- **Consensus Detection** - Automatically detects when experts reach agreement
- **Multiple LLM Support** - GPT-4o, Claude, Llama, Gemini, Mistral via OpenRouter

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: PostgreSQL with Prisma ORM
- **LLM Integration**: OpenRouter API

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (we recommend [Neon](https://neon.tech) - free tier)
- OpenRouter API key ([get one here](https://openrouter.ai/keys))

### 1. Clone and Install

```bash
git clone https://github.com/zlatanras/roundtable-web.git
cd roundtable-web
npm install
```

### 2. Set Up Database (Neon)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from Dashboard → Connection Details

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database (from Neon dashboard)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# LLM Provider (required)
OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxx"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database

```bash
npx prisma migrate dev --name init
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Start a Discussion** - Click "Start New Discussion" and enter your topic
2. **Select Expert Panel** - Choose the NORDticker experts (default) or create custom panels
3. **Configure Settings** - Pick AI model, language, discussion depth, and moderator mode
4. **Watch the Discussion** - Experts will debate in real-time with streaming responses
5. **Moderate (Optional)** - If enabled, add comments after each expert speaks

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── discussions/   # Discussion CRUD + streaming
│   │   └── panels/        # Expert panel management
│   ├── discussion/        # Discussion pages
│   └── experts/           # Expert panel pages
├── components/
│   ├── discussion/        # ChatPanel, MessageBubble, etc.
│   ├── expert/            # ExpertCard
│   ├── layout/            # Header
│   └── ui/                # Reusable UI components
├── services/
│   ├── discussion-engine.ts  # Core orchestration logic
│   └── llm-client.ts         # OpenRouter/OpenAI client
├── stores/                # Zustand state management
└── types/                 # TypeScript definitions
```

## Expert Panel

The default panel includes 5 experts:

| Expert | Role | Focus |
|--------|------|-------|
| Sarah | Business Developer | Market strategy, monetization, ROI |
| Marcus | WordPress Developer | Technical implementation, performance |
| Lisa | SEO Expert | Rankings, keywords, search visibility |
| Tom | Content Strategist | Editorial planning, audience engagement |
| Nina | Social Media Expert | Community building, content distribution |

## Discussion Flow

1. **Round 1**: Initial assessments - each expert gives their take
2. **Rounds 2-3**: Cross-examination - experts challenge and build on ideas
3. **Final Round**: Consensus building - top 3 actionable recommendations

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for LLM access |
| `OPENAI_API_KEY` | No | Direct OpenAI API key (alternative) |
| `NEXT_PUBLIC_APP_URL` | No | App URL for CORS headers |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Works with any platform supporting Next.js:
- Railway
- Render
- DigitalOcean App Platform
- Self-hosted with `npm run build && npm start`

## Database Storage Estimates

| Usage | Discussions | Storage |
|-------|-------------|---------|
| Personal | ~10,000 | ~500 MB |
| Small team | ~5,000 | ~250 MB |
| Heavy use | ~2,500 | ~125 MB |

Neon's free tier (500 MB) is sufficient for most use cases.

## License

MIT

## Credits

Based on the original [AI Expert Roundtable](https://github.com/zlatanras/roundtable) Python CLI.
