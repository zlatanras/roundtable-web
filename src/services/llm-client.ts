/**
 * LLM Client Service for interacting with AI models via OpenRouter/OpenAI
 */

import OpenAI from 'openai';

export class LLMClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMClientError';
  }
}

interface LLMClientConfig {
  model: string;
  provider?: 'openrouter' | 'openai';
  apiKey?: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export class LLMClient {
  private client: OpenAI;
  public model: string;
  public provider: 'openrouter' | 'openai';
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: LLMClientConfig) {
    this.model = config.model;
    this.provider = config.provider || 'openrouter';
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 2000;

    const apiKey = config.apiKey ||
      (this.provider === 'openrouter'
        ? process.env.OPENROUTER_API_KEY
        : process.env.OPENAI_API_KEY);

    if (!apiKey) {
      throw new LLMClientError(
        `API key not found for provider ${this.provider}. ` +
        `Set ${this.provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY'} environment variable.`
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: this.provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1'
        : undefined,
    });
  }

  /**
   * Generate a response from the LLM (non-streaming)
   */
  async generateResponse(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<string> {
    const { maxTokens = 500, temperature = 0.7 } = options;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
        };

        // Add OpenRouter-specific headers
        const response = await this.client.chat.completions.create(requestParams, {
          headers: this.provider === 'openrouter' ? {
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'AI Expert Roundtable',
          } : undefined,
        });

        return response.choices[0]?.message?.content?.trim() || '';
      } catch (error) {
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new LLMClientError(
          `Failed to generate response after ${this.maxRetries} attempts: ${error}`
        );
      }
    }

    throw new LLMClientError('Failed to generate response');
  }

  /**
   * Generate a streaming response from the LLM
   */
  async *generateStream(
    prompt: string,
    options: GenerateOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const { maxTokens = 500, temperature = 0.7 } = options;

    const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
      stream: true,
    };

    try {
      const stream = await this.client.chat.completions.create(requestParams, {
        headers: this.provider === 'openrouter' ? {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'AI Expert Roundtable',
        } : undefined,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      throw new LLMClientError(`Streaming failed: ${error}`);
    }
  }
}

// Singleton factory for server-side use
let clientInstance: LLMClient | null = null;

export function getLLMClient(model?: string): LLMClient {
  if (!clientInstance || (model && clientInstance.model !== model)) {
    clientInstance = new LLMClient({
      model: model || 'openai/gpt-4o',
      provider: 'openrouter',
    });
  }
  return clientInstance;
}
