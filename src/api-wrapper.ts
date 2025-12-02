/**
 * Anthropic API Wrapper with Automatic Tracking
 * Claude API calls are automatically recorded in the monitoring system
 */

import Anthropic from '@anthropic-ai/sdk';
import { getTracker } from './monitoring/index.js';

export interface ClaudeMessage {
  id: string;
  type: string;
  role: string;
  content: string;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class TrackedAnthropicClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY || '', model: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  /**
   * Send a message and automatically track usage
   */
  async sendMessage(
    messages: Anthropic.MessageParam[],
    options?: {
      model?: string;
      max_tokens?: number;
      temperature?: number;
      system?: string;
    }
  ): Promise<ClaudeMessage> {
    const model = options?.model || this.model;
    const tracker = getTracker();

    const response = await this.client.messages.create({
      model,
      max_tokens: options?.max_tokens || 8192,
      temperature: options?.temperature || 0.7,
      system: options?.system,
      messages,
    });

    // Track the API usage
    const usage = response.usage;
    const requestId = response.id;

    tracker.recordUsage(
      model,
      usage.input_tokens,
      usage.output_tokens,
      requestId
    );

    // Check budget status
    const budgetStatus = tracker.checkBudgetStatus();
    if (budgetStatus.status === 'EMERGENCY') {
      console.error(`🚨 EMERGENCY: API budget at ${budgetStatus.percentUsed.toFixed(1)}%`);
      throw new Error(
        `API budget exceeded (${budgetStatus.percentUsed.toFixed(1)}%). ` +
        `Used: $${budgetStatus.monthlyUsed.toFixed(2)}/$${budgetStatus.monthlyBudget.toFixed(2)}`
      );
    }

    // Format response
    const content = response.content[0];
    return {
      id: response.id,
      type: response.type,
      role: response.role,
      content: content.type === 'text' ? content.text : '',
      model: response.model,
      stop_reason: response.stop_reason,
      stop_sequence: response.stop_sequence,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
      },
    };
  }

  /**
   * Send a message with streaming
   */
  async *streamMessage(
    messages: Anthropic.MessageParam[],
    options?: {
      model?: string;
      max_tokens?: number;
      temperature?: number;
      system?: string;
    }
  ): AsyncGenerator<string> {
    const model = options?.model || this.model;

    const stream = this.client.messages.stream({
      model,
      max_tokens: options?.max_tokens || 8192,
      temperature: options?.temperature || 0.7,
      system: options?.system,
      messages,
    });

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && 'delta' in event) {
        if (event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      } else if (event.type === 'message_delta' && 'usage' in event) {
        totalOutputTokens = event.usage.output_tokens;
      } else if (event.type === 'message_start' && 'message' in event) {
        totalInputTokens = event.message.usage.input_tokens;
      }
    }

    // Track at the end of streaming
    if (totalInputTokens > 0 || totalOutputTokens > 0) {
      const tracker = getTracker();
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      tracker.recordUsage(
        model,
        totalInputTokens,
        totalOutputTokens,
        requestId
      );

      const budgetStatus = tracker.checkBudgetStatus();
      if (budgetStatus.status === 'EMERGENCY') {
        console.error(`🚨 EMERGENCY: API budget at ${budgetStatus.percentUsed.toFixed(1)}%`);
      }
    }
  }

  /**
   * Get the underlying Anthropic client
   */
  getClient(): Anthropic {
    return this.client;
  }
}

// Singleton instance
let trackedClient: TrackedAnthropicClient | null = null;

export function getTrackedClient(
  apiKey?: string,
  model?: string
): TrackedAnthropicClient {
  if (!trackedClient) {
    trackedClient = new TrackedAnthropicClient(apiKey, model);
  }
  return trackedClient;
}

export function resetTrackedClient(): void {
  trackedClient = null;
}
