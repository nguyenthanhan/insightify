import { v4 as uuidv4 } from "uuid";
import {
  ConversationContext,
  ContextMessage,
  ContextOptions,
  DashboardType,
} from "../types";

const DEFAULT_OPTIONS: ContextOptions = {
  maxTokens: 8000,
  summarizationThreshold: 0.8, // Summarize when 80% of max tokens used
  preserveSystemPrompt: true,
};

const DASHBOARD_PROMPTS: Record<DashboardType, string> = {
  sales: `You are a sales analytics assistant. Help users understand sales metrics, revenue trends, pipeline data, and sales team performance. Provide insights on deals, conversion rates, and forecasts.`,
  analytics: `You are a web analytics assistant. Help users understand traffic patterns, user behavior, page performance, and conversion metrics. Provide insights on sessions, bounce rates, and engagement.`,
  financial: `You are a financial analytics assistant. Help users understand revenue, expenses, cash flow, and profitability. Provide insights on financial performance and budget analysis.`,
  operations: `You are an operations analytics assistant. Help users understand system performance, uptime, task completion, and operational efficiency. Provide insights on incidents and service health.`,
  hr: `You are an HR analytics assistant. Help users understand workforce metrics, hiring, retention, and employee satisfaction. Provide insights on headcount, turnover, and engagement.`,
  ecommerce: `You are an e-commerce analytics assistant. Help users understand orders, revenue, product performance, and customer behavior. Provide insights on sales trends and inventory.`,
};

// Rough token estimation (4 chars per token average)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class ContextManager {
  private context: ConversationContext;
  private options: ContextOptions;

  constructor(
    dashboardType: DashboardType = "sales",
    options: Partial<ContextOptions> = {},
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.context = this.createInitialContext(dashboardType);
  }

  addMessage(
    message: Omit<ContextMessage, "id" | "timestamp" | "tokenCount">,
  ): void {
    const tokenCount = estimateTokens(message.content);
    const fullMessage: ContextMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      tokenCount,
    };

    this.context.messages.push(fullMessage);
    this.context.tokenCount += tokenCount;
    this.context.metadata.messageCount = this.context.messages.length;
    this.context.metadata.lastUpdatedAt = new Date().toISOString();
  }

  getContext(): ConversationContext {
    return { ...this.context };
  }

  getMessages(): ContextMessage[] {
    return [...this.context.messages];
  }

  getSystemPrompt(): string {
    return this.context.systemPrompt;
  }

  clear(): void {
    const dashboardType = this.context.metadata.dashboardType;
    this.context = this.createInitialContext(dashboardType);
  }

  setDashboardContext(type: DashboardType): void {
    this.context.systemPrompt =
      DASHBOARD_PROMPTS[type] || DASHBOARD_PROMPTS.sales;
    this.context.metadata.dashboardType = type;
    this.context.metadata.lastUpdatedAt = new Date().toISOString();
  }

  needsSummarization(): boolean {
    const threshold =
      this.options.maxTokens * this.options.summarizationThreshold;
    return this.context.tokenCount > threshold;
  }

  async summarizeIfNeeded(
    summarizer?: (messages: ContextMessage[]) => Promise<string>,
  ): Promise<void> {
    if (!this.needsSummarization()) return;

    // Keep recent messages, summarize older ones
    const keepCount = Math.min(4, Math.floor(this.context.messages.length / 2));
    const toSummarize = this.context.messages.slice(0, -keepCount);
    const toKeep = this.context.messages.slice(-keepCount);

    if (toSummarize.length === 0) return;

    let summary: string;
    if (summarizer) {
      summary = await summarizer(toSummarize);
    } else {
      // Default simple summarization
      summary = this.createSimpleSummary(toSummarize);
    }

    // Create summary message
    const summaryMessage: ContextMessage = {
      id: uuidv4(),
      role: "system",
      content: `[Previous conversation summary: ${summary}]`,
      timestamp: new Date().toISOString(),
      tokenCount: estimateTokens(summary),
      summarized: true,
    };

    // Replace messages
    this.context.messages = [summaryMessage, ...toKeep];
    this.context.tokenCount = this.context.messages.reduce(
      (sum, m) => sum + m.tokenCount,
      0,
    );
    this.context.metadata.messageCount = this.context.messages.length;
  }

  serialize(): string {
    return JSON.stringify(this.context);
  }

  deserialize(data: string): ConversationContext {
    const parsed = JSON.parse(data) as ConversationContext;
    this.context = parsed;
    return this.context;
  }

  static fromSerialized(
    data: string,
    options?: Partial<ContextOptions>,
  ): ContextManager {
    const manager = new ContextManager("sales", options);
    manager.deserialize(data);
    return manager;
  }

  private createInitialContext(
    dashboardType: DashboardType,
  ): ConversationContext {
    return {
      id: uuidv4(),
      messages: [],
      systemPrompt: DASHBOARD_PROMPTS[dashboardType] || DASHBOARD_PROMPTS.sales,
      metadata: {
        dashboardType,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        messageCount: 0,
      },
      tokenCount: 0,
    };
  }

  private createSimpleSummary(messages: ContextMessage[]): string {
    const userMessages = messages.filter((m) => m.role === "user");
    const topics = userMessages.map((m) => m.content.slice(0, 50)).join("; ");
    return `User discussed: ${topics}`;
  }
}

export const createContextManager = (
  dashboardType: DashboardType = "sales",
  options?: Partial<ContextOptions>,
): ContextManager => {
  return new ContextManager(dashboardType, options);
};
