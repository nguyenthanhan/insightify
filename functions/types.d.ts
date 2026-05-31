/**
 * TypeScript type definitions for Cloudflare Pages Functions
 *
 * This file provides type safety for Cloudflare Workers environment.
 */

/**
 * Cloudflare Pages Function handler
 */
declare type PagesFunction<Env = unknown> = (
  context: EventContext<Env, any, Record<string, unknown>>,
) => Response | Promise<Response>;

/**
 * Event context passed to Pages Functions
 */
interface EventContext<Env, P extends string, Data> {
  request: Request;
  env: Env;
  params: Record<P, string>;
  data: Data;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<any>) => void;
}

/**
 * Environment variables available in Cloudflare Workers
 */
interface CloudflareEnv {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
}

/**
 * OpenAI API types
 */
interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIRequest {
  messages: OpenAIMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Anthropic API types
 */
interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicRequest {
  messages: AnthropicMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Error response type
 */
interface ErrorResponse {
  error: string;
  details?: string;
  message?: string;
}
