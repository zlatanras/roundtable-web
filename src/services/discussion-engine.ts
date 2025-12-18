/**
 * Discussion Engine - Orchestrates multi-turn AI expert discussions
 *
 * This is the core service that manages the roundtable discussions,
 * including expert turn management, debate styles, and consensus building.
 */

import { LLMClient } from './llm-client';
import { Expert, Message, DebateStyle, SSEEvent } from '@/types';
import { shuffleArray, randomChoice } from '@/lib/utils';

// Debate styles with their instructions
const DEBATE_STYLES: DebateStyle[] = [
  'agreeable',
  'challenging',
  'questioning',
  'building',
  'contrasting',
];

const STYLE_INSTRUCTIONS: Record<DebateStyle, string> = {
  agreeable: 'Build on what others have said and add your expertise. Show agreement where appropriate.',
  challenging: 'Challenge assumptions or point out potential issues with what\'s been discussed. Be constructive but critical.',
  questioning: 'Ask probing questions about the ideas presented. What details are missing? What concerns do you have?',
  building: 'Take the ideas further. How can we expand or improve on what\'s been suggested?',
  contrasting: 'Offer a different perspective or alternative approach. What would you do differently?',
};

// Provocative follow-up questions for deeper discussion
const PROVOCATIVE_ADDITIONS = [
  ' Also, do you see any potential conflicts between what\'s been proposed so far?',
  ' What might the others be overlooking from your perspective?',
  ' Are there any assumptions being made that you\'d challenge?',
  ' What questions would you ask your colleagues before moving forward?',
  ' What\'s the biggest risk you see in the current direction?',
];

interface DiscussionConfig {
  topic: string;
  experts: Expert[];
  language: string;
  moderatorMode: boolean;
  totalRounds: number;
  model: string; // Fallback model if expert doesn't have one
}

interface DiscussionState {
  currentRound: number;
  messages: Message[];
  expertPositions: Map<string, string[]>; // Track each expert's stated positions
  usedStylesThisRound: DebateStyle[];
  isRunning: boolean;
  consensusScore: number;
}

export class DiscussionEngine {
  private defaultLlmClient: LLMClient;
  private llmClients: Map<string, LLMClient> = new Map();
  private config: DiscussionConfig;
  private state: DiscussionState;

  constructor(llmClient: LLMClient, config: DiscussionConfig) {
    this.defaultLlmClient = llmClient;
    this.llmClients.set(llmClient.model, llmClient);
    this.config = config;
    this.state = {
      currentRound: 0,
      messages: [],
      expertPositions: new Map(),
      usedStylesThisRound: [],
      isRunning: false,
      consensusScore: 0,
    };
  }

  /**
   * Get or create LLMClient for an expert's model
   */
  private getLLMClientForExpert(expert: Expert): LLMClient {
    const model = expert.aiModel || this.config.model;

    // Return cached client if available
    if (this.llmClients.has(model)) {
      return this.llmClients.get(model)!;
    }

    // Create new client for this model
    const client = new LLMClient({
      model,
      provider: 'openrouter',
    });
    this.llmClients.set(model, client);
    return client;
  }

  /**
   * Get a debate style ensuring diversity within the round
   */
  private getDebateStyle(): DebateStyle {
    // Ensure at least one "challenging" per round
    const availableStyles = DEBATE_STYLES.filter(
      style => !this.state.usedStylesThisRound.includes(style)
    );

    // If we've used all styles, reset but ensure challenging is possible
    if (availableStyles.length === 0) {
      this.state.usedStylesThisRound = [];
      return randomChoice(DEBATE_STYLES);
    }

    // Prioritize challenging style if not yet used this round
    if (
      !this.state.usedStylesThisRound.includes('challenging') &&
      this.state.usedStylesThisRound.length >= 2
    ) {
      this.state.usedStylesThisRound.push('challenging');
      return 'challenging';
    }

    const style = randomChoice(availableStyles);
    this.state.usedStylesThisRound.push(style);
    return style;
  }

  /**
   * Get the language instruction based on configured language
   */
  private getLanguageInstruction(): string {
    switch (this.config.language) {
      case 'de':
        return '- Always answer in German, very important.';
      case 'en':
        return '- Always answer in English.';
      default:
        return `- Always answer in ${this.config.language}.`;
    }
  }

  /**
   * Get recent conversation context
   */
  private getRecentContext(numMessages: number = 4): string {
    if (this.state.messages.length === 0) return '';

    const recentMessages = this.state.messages.slice(-numMessages);
    let context = '\n\nMost recent exchanges:\n';

    for (const msg of recentMessages) {
      const speaker = msg.role === 'MODERATOR' ? 'Moderator' : msg.expert?.name || 'Unknown';
      context += `${speaker}: ${msg.content}\n`;
    }

    return context;
  }

  /**
   * Get expert's previous points (to avoid repetition)
   */
  private getExpertPreviousPoints(expertName: string): string {
    const positions = this.state.expertPositions.get(expertName);
    if (!positions || positions.length === 0) return '';

    return `\nYou've already covered these points: ${positions.slice(-3).join('; ')}. Add NEW insights only.`;
  }

  /**
   * Generate round-specific questions based on expert role
   */
  private getRoundSpecificQuestion(roundNum: number, expert: Expert): string {
    const role = expert.role.toLowerCase();
    const otherExperts = this.config.experts
      .filter(e => e.name !== expert.name)
      .map(e => e.name);

    let baseQuestion: string;

    if (roundNum === 1) {
      baseQuestion = 'Give your initial expert assessment and key recommendations.';
    } else if (roundNum === 2) {
      // Deep dive questions based on role
      if (['business', 'strategy', 'director', 'manager'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, what do you think about the strategies proposed so far? What business risks do you see, and how can we ensure profitability?`;
      } else if (['technical', 'developer', 'engineer', 'architect', 'wordpress'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, considering the requirements outlined, what technical architecture would you recommend? Any concerns with the proposed approach?`;
      } else if (['seo', 'search', 'organic'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, given the constraints and content volume planned, how would you structure the SEO strategy? What are your thoughts on the approach discussed?`;
      } else if (['content', 'editorial', 'writer', 'copy', 'marketing'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, how would you balance automation with quality content? What's your take on the scalability challenges mentioned?`;
      } else if (['social', 'community', 'media'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, hearing all these strategies, how would you integrate social media to amplify this? What concerns do you have about community building?`;
      } else {
        baseQuestion = `${expert.name}, what's your expert take on the discussion so far from your ${expert.role} perspective?`;
      }
    } else {
      // Round 3+: Consensus-building questions
      if (['business', 'strategy', 'director', 'manager'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, after hearing everyone's perspectives, what would be your final business recommendation? What should be the absolute priorities?`;
      } else if (['technical', 'developer', 'engineer', 'architect', 'wordpress'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, considering all the feedback, what would your final technical implementation roadmap look like? Where do you see the biggest technical risks?`;
      } else if (['seo', 'search', 'organic'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, integrating all the strategies discussed, what's your finalized SEO action plan? What do you think could make or break the goals?`;
      } else if (['content', 'editorial', 'writer', 'copy', 'marketing'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, bringing together all considerations, what's your ultimate content strategy recommendation? How do we ensure sustainable growth?`;
      } else if (['social', 'community', 'media'].some(kw => role.includes(kw))) {
        baseQuestion = `${expert.name}, considering the full strategy now, how would you execute a plan that supports all these goals? What's your biggest concern?`;
      } else {
        baseQuestion = `${expert.name}, given everything discussed, what are your top 3 actionable recommendations?`;
      }
    }

    // Add provocative follow-ups for rounds with enough history
    if (this.state.messages.length > 5 && roundNum >= 2) {
      baseQuestion += randomChoice(PROVOCATIVE_ADDITIONS);
    }

    // Include context about moderator input if present
    const recentModeratorMsgs = this.state.messages
      .slice(-3)
      .filter(msg => msg.role === 'MODERATOR');

    if (recentModeratorMsgs.length > 0) {
      const lastModeratorMsg = recentModeratorMsgs[recentModeratorMsgs.length - 1];
      baseQuestion += ` The moderator has also commented: '${lastModeratorMsg.content}' - please address this as well.`;
    }

    return baseQuestion;
  }

  /**
   * Build the prompt for an expert response
   */
  private buildPrompt(expert: Expert, roundNum: number, debateStyle: DebateStyle): string {
    const otherExperts = this.config.experts
      .filter(e => e.name !== expert.name)
      .map(e => e.name)
      .join(', ');

    const recentContext = this.getRecentContext();
    const languageInstruction = this.getLanguageInstruction();
    const specificQuestion = this.getRoundSpecificQuestion(roundNum, expert);
    const previousPoints = this.getExpertPreviousPoints(expert.name);

    // Adjust temperature instruction based on round
    const focusInstruction = roundNum >= this.config.totalRounds
      ? 'Be very focused and conclusive in your final thoughts.'
      : 'Keep the discussion moving forward with fresh perspectives.';

    return `${expert.systemPrompt}

DISCUSSION TOPIC: ${this.config.topic}
${recentContext}
${previousPoints}

ROUND ${roundNum} INSTRUCTIONS:
- ${STYLE_INSTRUCTIONS[debateStyle]}
- Feel free to address other experts by name (${otherExperts})
- Ask specific questions or request clarification if needed
- Don't just agree - bring your unique perspective and expertise
- If you disagree with something, explain why constructively
- Build on ideas, challenge assumptions, or propose alternatives
${languageInstruction}
- ${focusInstruction}

SPECIFIC QUESTION FOR YOU: ${specificQuestion}

Respond as ${expert.name} (${expert.role}). Keep focused and practical (under 350 words).
Make this feel like a real expert discussion - engage directly with your colleagues!
`;
  }

  /**
   * Analyze consensus level (0.0-1.0)
   */
  async analyzeConsensus(): Promise<number> {
    if (this.state.messages.length < 5) return 0;

    const recentMessages = this.state.messages.slice(-6);
    const analysisPrompt = `Analyze these expert discussion messages and rate the consensus level from 0.0 (complete disagreement) to 1.0 (full agreement).

Messages:
${recentMessages.map(m => `${m.expert?.name || 'Moderator'}: ${m.content.slice(0, 200)}...`).join('\n')}

Reply with ONLY a number between 0.0 and 1.0, nothing else.`;

    try {
      const response = await this.defaultLlmClient.generateResponse(analysisPrompt, {
        maxTokens: 10,
        temperature: 0.1,
      });
      const score = parseFloat(response);
      return isNaN(score) ? 0.5 : Math.min(1, Math.max(0, score));
    } catch {
      return 0.5;
    }
  }

  /**
   * Extract key points from an expert's response
   */
  private extractKeyPoints(content: string): string[] {
    // Simple extraction - get sentences that look like recommendations
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  /**
   * Run a single expert's turn and yield SSE events
   */
  async *runExpertTurn(
    expert: Expert,
    roundNum: number
  ): AsyncGenerator<SSEEvent, void, unknown> {
    const debateStyle = this.getDebateStyle();

    yield {
      type: 'expert_start',
      expertId: expert.id,
      expertName: expert.name,
      expertColor: expert.color,
      round: roundNum,
      debateStyle,
    };

    const prompt = this.buildPrompt(expert, roundNum, debateStyle);

    // Adjust temperature based on round
    const temperature = roundNum >= this.config.totalRounds ? 0.6 : 0.8;

    let fullContent = '';

    // Get the LLM client for this expert (uses expert's model or fallback)
    const llmClient = this.getLLMClientForExpert(expert);

    try {
      for await (const token of llmClient.generateStream(prompt, {
        maxTokens: 450,
        temperature,
      })) {
        fullContent += token;
        yield { type: 'token', content: token };
      }

      // Track expert's positions
      const keyPoints = this.extractKeyPoints(fullContent);
      const existingPoints = this.state.expertPositions.get(expert.name) || [];
      this.state.expertPositions.set(expert.name, [...existingPoints, ...keyPoints]);

      // Create message record
      const message: Message = {
        id: `msg_${Date.now()}_${expert.id}`,
        content: fullContent,
        role: 'EXPERT',
        round: roundNum,
        debateStyle,
        expertId: expert.id,
        expert,
        discussionId: '', // Set by caller
        createdAt: new Date(),
      };

      this.state.messages.push(message);

      yield {
        type: 'expert_complete',
        messageId: message.id,
        expertId: expert.id,
        fullContent,
      };
    } catch (error) {
      yield {
        type: 'error',
        message: `Error getting response from ${expert.name}: ${error}`,
      };
    }
  }

  /**
   * Run a complete discussion round
   */
  async *runRound(roundNum: number): AsyncGenerator<SSEEvent, void, unknown> {
    this.state.currentRound = roundNum;
    this.state.usedStylesThisRound = [];

    // Shuffle experts for variety (except final consensus round)
    const isFinalRound = roundNum >= this.config.totalRounds && this.config.totalRounds >= 4;
    const expertOrder = isFinalRound
      ? this.config.experts
      : shuffleArray(this.config.experts);

    for (const expert of expertOrder) {
      // Run expert's turn
      for await (const event of this.runExpertTurn(expert, roundNum)) {
        yield event;
      }

      // Prompt for moderator input if enabled
      if (this.config.moderatorMode) {
        yield {
          type: 'moderator_prompt',
          message: `${expert.name} has finished. You can add a comment or question, or skip to continue.`,
        };
      }
    }

    // Analyze consensus at end of round
    const consensusScore = await this.analyzeConsensus();
    this.state.consensusScore = consensusScore;

    yield {
      type: 'round_complete',
      round: roundNum,
      consensusScore,
    };
  }

  /**
   * Add a moderator message to the discussion
   */
  addModeratorMessage(content: string): Message {
    const message: Message = {
      id: `msg_mod_${Date.now()}`,
      content,
      role: 'MODERATOR',
      round: this.state.currentRound,
      discussionId: '',
      createdAt: new Date(),
    };

    this.state.messages.push(message);
    return message;
  }

  /**
   * Run the complete discussion
   */
  async *runDiscussion(): AsyncGenerator<SSEEvent, void, unknown> {
    this.state.isRunning = true;

    try {
      // Run initial rounds
      for (let round = 1; round <= this.config.totalRounds; round++) {
        for await (const event of this.runRound(round)) {
          yield event;

          // Check for early consensus (if score > 0.85 after round 3)
          if (
            event.type === 'round_complete' &&
            event.consensusScore &&
            event.consensusScore > 0.85 &&
            round >= 3
          ) {
            yield {
              type: 'discussion_complete',
              discussionId: '',
            };
            return;
          }
        }
      }

      yield {
        type: 'discussion_complete',
        discussionId: '',
      };
    } finally {
      this.state.isRunning = false;
    }
  }

  /**
   * Get current discussion state
   */
  getState(): DiscussionState {
    return { ...this.state };
  }

  /**
   * Get all messages
   */
  getMessages(): Message[] {
    return [...this.state.messages];
  }
}
