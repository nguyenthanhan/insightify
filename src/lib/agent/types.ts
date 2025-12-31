import {
  ChartData,
  TableData,
  InsightData,
  DashboardType,
  MessageType,
} from "@/types/agent";

// Re-export types from @/types/agent for convenience
export type { DashboardType, MessageType, ChartData, TableData, InsightData };

// ============ AI Agent Core Types ============

export interface AIAgentConfig {
  provider: ProviderConfig;
  contextOptions: ContextOptions;
  cacheOptions: CacheOptions;
  retryOptions: RetryOptions;
  rateLimitOptions: RateLimitOptions;
}

export interface AgentRequest {
  query: string;
  context: ConversationContext;
  dashboardType: DashboardType;
  tools?: ToolDefinition[];
  requestId?: string;
}

export interface AgentResponse {
  content: string;
  type: MessageType;
  data?: ChartData | TableData | InsightData;
  toolCalls?: ToolCallResult[];
  cached: boolean;
  provider: string;
  partial?: boolean;
}

// ============ Provider Types ============

export type ProviderType =
  | "openai"
  | "anthropic"
  | "openai-compatible"
  | "anthropic-compatible";

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  authStrategy?: AuthStrategy;
  modelMapping?: Record<string, string>;
  apiVersion?: string;
  headers?: Record<string, string>;
}

export type ProviderFeature = "streaming" | "tools" | "vision" | "json-mode";

export interface AuthStrategy {
  type: "api-key" | "aws-sigv4" | "oauth" | "custom";
  getHeaders(): Promise<Record<string, string>>;
}

export interface NormalizedRequest {
  messages: NormalizedMessage[];
  model: string;
  stream: boolean;
  tools?: NormalizedTool[];
  maxTokens?: number;
  temperature?: number;
}

export interface NormalizedMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface NormalizedTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface NormalizedResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: "stop" | "tool_calls" | "length" | "error";
  usage?: TokenUsage;
}

export interface ProviderChunk {
  content?: string;
  toolCalls?: Partial<ToolCall>[];
  done: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ============ Context Types ============

export interface ConversationContext {
  id: string;
  messages: ContextMessage[];
  systemPrompt: string;
  metadata: ContextMetadata;
  tokenCount: number;
}

export interface ContextMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: string;
  tokenCount: number;
  summarized?: boolean;
}

export interface ContextMetadata {
  dashboardType: DashboardType;
  createdAt: string;
  lastUpdatedAt: string;
  messageCount: number;
}

export interface ContextOptions {
  maxTokens: number;
  summarizationThreshold: number;
  preserveSystemPrompt: boolean;
}

// ============ Tool Types ============

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  handler: ToolHandler;
}

export type ToolHandler = (
  params: Record<string, unknown>,
) => Promise<ToolResult>;

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResult {
  toolCallId: string;
  name: string;
  result: ToolResult;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  description?: string;
  default?: unknown;
}

// ============ Infrastructure Types ============

export interface CacheOptions {
  enabled: boolean;
  ttlMs: number;
  maxSize: number;
  storage: "memory" | "localStorage" | "indexedDB";
}

export interface CachedResponse {
  response: AgentResponse;
  timestamp: number;
  ttl: number;
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: string[];
}

export interface RateLimitOptions {
  requestsPerMinute: number;
  tokensPerMinute: number;
  queueEnabled: boolean;
}

// ============ Error Types ============

export enum ErrorCategory {
  NETWORK = "network",
  PROVIDER = "provider",
  RATE_LIMIT = "rate_limit",
  VALIDATION = "validation",
  PARSING = "parsing",
  TOOL = "tool",
  CACHE = "cache",
  EXPORT = "export",
}

export interface AgentError {
  category: ErrorCategory;
  code: string;
  message: string;
  retryable: boolean;
  userMessage: string;
  details?: Record<string, unknown>;
}

// ============ Validation Types ============

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}
