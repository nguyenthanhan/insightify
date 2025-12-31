import {
  ProviderConfig,
  ProviderFeature,
  NormalizedRequest,
  NormalizedResponse,
  ProviderChunk,
  ValidationResult,
  AuthStrategy,
} from "../types";

// ============ Provider Adapter Interface ============

export interface ProviderAdapter {
  readonly name: string;
  readonly config: ProviderConfig;

  sendRequest(request: NormalizedRequest): AsyncGenerator<ProviderChunk>;
  validateConfig(): Promise<ValidationResult>;
  supportsFeature(feature: ProviderFeature): boolean;
}

// ============ OpenAI Types ============

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  tools?: OpenAITool[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "text" | "json_object" };
}

export interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage?: OpenAIUsage;
}

export interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: "stop" | "tool_calls" | "length" | "content_filter";
}

export interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIStreamChoice[];
}

export interface OpenAIStreamChoice {
  index: number;
  delta: Partial<OpenAIMessage>;
  finish_reason: string | null;
}

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    code: string | null;
    param: string | null;
  };
}

// ============ Anthropic Types ============

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  stream?: boolean;
  tools?: AnthropicTool[];
  max_tokens: number;
  temperature?: number;
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

export interface AnthropicContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
  usage: AnthropicUsage;
}

export interface AnthropicStreamEvent {
  type:
    | "message_start"
    | "content_block_start"
    | "content_block_delta"
    | "content_block_stop"
    | "message_delta"
    | "message_stop";
  message?: Partial<AnthropicResponse>;
  index?: number;
  content_block?: AnthropicContentBlock;
  delta?: {
    type: "text_delta" | "input_json_delta";
    text?: string;
    partial_json?: string;
    stop_reason?: string;
  };
  usage?: Partial<AnthropicUsage>;
}

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface AnthropicError {
  type: "error";
  error: {
    type: string;
    message: string;
  };
}

// ============ Auth Strategy Implementations ============

export class ApiKeyAuthStrategy implements AuthStrategy {
  type: "api-key" = "api-key";

  constructor(
    private apiKey: string,
    private headerName: string = "Authorization",
    private prefix: string = "Bearer "
  ) {}

  async getHeaders(): Promise<Record<string, string>> {
    return {
      [this.headerName]: `${this.prefix}${this.apiKey}`,
    };
  }
}

export class CustomHeadersAuthStrategy implements AuthStrategy {
  type: "custom" = "custom";

  constructor(private headers: Record<string, string>) {}

  async getHeaders(): Promise<Record<string, string>> {
    return { ...this.headers };
  }
}

// AWS SigV4 would require additional implementation with AWS SDK
export class AWSSigV4AuthStrategy implements AuthStrategy {
  type: "aws-sigv4" = "aws-sigv4";

  constructor(
    private region: string,
    private service: string,
    private accessKeyId?: string,
    private secretAccessKey?: string
  ) {}

  async getHeaders(): Promise<Record<string, string>> {
    // Simplified - in production would use AWS SDK for proper signing
    // This is a placeholder that would need AWS credentials and signing logic
    return {
      "X-Amz-Date": new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""),
    };
  }
}
