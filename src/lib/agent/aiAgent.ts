import { v4 as uuidv4 } from "uuid";
import {
  AIAgentConfig,
  AgentRequest,
  AgentResponse,
  ProviderConfig,
  NormalizedRequest,
  NormalizedMessage,
  ProviderChunk,
  DashboardType,
} from "./types";
import { ContextManager } from "./context/contextManager";
import { ToolRegistry } from "./tools/toolRegistry";
import { ResponseCache } from "./infrastructure/cache";
import { RetryHandler } from "./infrastructure/retry";
import { RateLimiter } from "./infrastructure/rateLimiter";
import { MessageParser, ParsedResponse } from "./parser/messageParser";
import { OpenAIAdapter } from "./providers/openaiAdapter";
import { OpenAICompatibleAdapter } from "./providers/openaiCompatibleAdapter";
import { AnthropicAdapter } from "./providers/anthropicAdapter";
import { AnthropicCompatibleAdapter } from "./providers/anthropicCompatibleAdapter";
import { BaseProviderAdapter } from "./providers/baseAdapter";
import { processMockQuery } from "./mockEngine";

const DEFAULT_CONFIG: Partial<AIAgentConfig> = {
  contextOptions: {
    maxTokens: 8000,
    summarizationThreshold: 0.8,
    preserveSystemPrompt: true,
  },
  cacheOptions: {
    enabled: true,
    ttlMs: 5 * 60 * 1000,
    maxSize: 100,
    storage: "memory",
  },
  retryOptions: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "RATE_LIMIT", "5XX"],
  },
  rateLimitOptions: {
    requestsPerMinute: 60,
    tokensPerMinute: 100000,
    queueEnabled: true,
  },
};

export class AIAgent {
  private config: AIAgentConfig;
  private contextManager: ContextManager;
  private toolRegistry: ToolRegistry;
  private cache: ResponseCache;
  private retryHandler: RetryHandler;
  private rateLimiter: RateLimiter;
  private parser: MessageParser;
  private adapter: BaseProviderAdapter | null = null;
  private activeRequests: Map<string, AbortController> = new Map();
  private degradedMode = false;

  constructor(config: Partial<AIAgentConfig> & { provider: ProviderConfig }) {
    this.config = { ...DEFAULT_CONFIG, ...config } as AIAgentConfig;
    this.contextManager = new ContextManager(
      "sales",
      this.config.contextOptions
    );
    this.toolRegistry = new ToolRegistry();
    this.cache = new ResponseCache(this.config.cacheOptions);
    this.retryHandler = new RetryHandler(this.config.retryOptions);
    this.rateLimiter = new RateLimiter(this.config.rateLimitOptions);
    this.parser = new MessageParser();

    this.initializeAdapter(config.provider);
  }

  async *processQuery(request: AgentRequest): AsyncGenerator<AgentResponse> {
    const requestId = request.requestId || uuidv4();
    const abortController = new AbortController();
    this.activeRequests.set(requestId, abortController);

    try {
      // Update context with dashboard type
      if (
        request.dashboardType !==
        this.contextManager.getContext().metadata.dashboardType
      ) {
        this.contextManager.setDashboardContext(request.dashboardType);
      }

      // Add user message to context
      this.contextManager.addMessage({
        role: "user",
        content: request.query,
      });

      // Check cache first
      const cacheKey = ResponseCache.generateKey(
        request.query,
        request.dashboardType
      );
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        yield { ...cachedResponse, cached: true };
        return;
      }

      // Check if we should use mock engine (degraded mode or no adapter)
      if (this.degradedMode || !this.adapter) {
        yield* this.processMockQuery(request);
        return;
      }

      // Acquire rate limit
      await this.rateLimiter.acquire();

      // Build normalized request
      const normalizedRequest = this.buildNormalizedRequest(request);

      // Execute with retry
      let fullContent = "";
      let finalResponse: AgentResponse | null = null;

      try {
        const generator = this.retryHandler.execute(async () => {
          return this.adapter!.sendRequest(normalizedRequest);
        });

        const stream = await generator;

        for await (const chunk of stream) {
          if (abortController.signal.aborted) {
            // Return partial response on cancel
            if (fullContent) {
              yield this.createResponse(fullContent, true);
            }
            return;
          }

          if (chunk.content) {
            fullContent += chunk.content;
            yield this.createResponse(fullContent, false, true);
          }

          if (chunk.done) {
            finalResponse = this.createResponse(fullContent, false);
          }
        }
      } catch (error) {
        // Fall back to mock engine on failure
        console.warn("Provider failed, falling back to mock engine:", error);
        this.degradedMode = true;
        yield* this.processMockQuery(request, true);
        return;
      }

      if (finalResponse) {
        // Add assistant response to context
        this.contextManager.addMessage({
          role: "assistant",
          content: finalResponse.content,
        });

        // Cache the response
        this.cache.set(cacheKey, finalResponse);

        yield finalResponse;
      }
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
    }
  }

  clearContext(): void {
    this.contextManager.clear();
  }

  async switchProvider(config: ProviderConfig): Promise<void> {
    // Preserve context
    const contextData = this.contextManager.serialize();

    // Initialize new adapter
    this.initializeAdapter(config);
    this.config.provider = config;

    // Restore context
    this.contextManager.deserialize(contextData);

    // Reset degraded mode
    this.degradedMode = false;
  }

  getContext() {
    return this.contextManager.getContext();
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  isDegradedMode(): boolean {
    return this.degradedMode;
  }

  private initializeAdapter(config: ProviderConfig): void {
    switch (config.type) {
      case "openai":
        this.adapter = new OpenAIAdapter(config);
        break;
      case "openai-compatible":
        this.adapter = new OpenAICompatibleAdapter(config);
        break;
      case "anthropic":
        this.adapter = new AnthropicAdapter(config);
        break;
      case "anthropic-compatible":
        this.adapter = new AnthropicCompatibleAdapter(config);
        break;
      default:
        console.warn(
          `Unknown provider type: ${config.type}, using mock engine`
        );
        this.adapter = null;
        this.degradedMode = true;
    }
  }

  private buildNormalizedRequest(request: AgentRequest): NormalizedRequest {
    const context = this.contextManager.getContext();
    const messages: NormalizedMessage[] = [];

    // Add system prompt
    messages.push({
      role: "system",
      content: context.systemPrompt,
    });

    // Add conversation history
    for (const msg of context.messages) {
      messages.push({
        role: msg.role as NormalizedMessage["role"],
        content: msg.content,
      });
    }

    // Build tools if available
    const tools = request.tools || this.toolRegistry.list();

    return {
      messages,
      model: this.config.provider.model,
      stream: true,
      tools:
        tools.length > 0
          ? tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            }))
          : undefined,
    };
  }

  private async *processMockQuery(
    request: AgentRequest,
    showDegradedNotice = false
  ): AsyncGenerator<AgentResponse> {
    const mockResponse = await processMockQuery(
      request.query,
      request.dashboardType
    );

    let content = mockResponse.content;
    if (showDegradedNotice) {
      content = `[Running in degraded mode - using cached responses]\n\n${content}`;
    }

    const response: AgentResponse = {
      content,
      type: mockResponse.type,
      data: mockResponse.data,
      cached: false,
      provider: "mock",
    };

    // Add to context
    this.contextManager.addMessage({
      role: "assistant",
      content: response.content,
    });

    yield response;
  }

  private createResponse(
    content: string,
    cached: boolean,
    partial = false
  ): AgentResponse {
    const parsed = this.parser.parse(content);

    return {
      content: parsed.content,
      type: parsed.type,
      data: parsed.data,
      cached,
      provider: this.adapter?.name || "mock",
      partial,
    };
  }
}

// Factory function
export function createAIAgent(
  config: Partial<AIAgentConfig> & { provider: ProviderConfig }
): AIAgent {
  return new AIAgent(config);
}
