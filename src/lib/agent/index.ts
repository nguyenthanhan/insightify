// Main exports
export { AIAgent, createAIAgent } from "./aiAgent";
export { ContextManager, createContextManager } from "./context/contextManager";
export { ToolRegistry, createTool } from "./tools/toolRegistry";
export { MessageParser } from "./parser/messageParser";
export { ResponseCache } from "./infrastructure/cache";
export { RetryHandler } from "./infrastructure/retry";
export { RateLimiter } from "./infrastructure/rateLimiter";

// Provider exports
export { OpenAIAdapter } from "./providers/openaiAdapter";
export { OpenAICompatibleAdapter } from "./providers/openaiCompatibleAdapter";
export { AnthropicAdapter } from "./providers/anthropicAdapter";
export { AnthropicCompatibleAdapter } from "./providers/anthropicCompatibleAdapter";
export { BaseProviderAdapter } from "./providers/baseAdapter";

// Type exports
export * from "./types";
export type { ParsedResponse } from "./parser/messageParser";
export type { ProviderAdapter } from "./providers/types";

// Legacy mock engine (for fallback)
export { processMockQuery } from "./mockEngine";
