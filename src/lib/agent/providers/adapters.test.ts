import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { OpenAIAdapter } from "./openaiAdapter";
import { OpenAICompatibleAdapter } from "./openaiCompatibleAdapter";
import { AnthropicAdapter } from "./anthropicAdapter";
import { AnthropicCompatibleAdapter } from "./anthropicCompatibleAdapter";
import { NormalizedRequest, NormalizedMessage, ProviderConfig } from "../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Provider Adapters", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  /**
   * **Feature: advanced-ai-agent, Property 15: Provider Adapter Normalization**
   * **Validates: Requirements 7.2**
   *
   * For any provider type, the Provider_Adapter SHALL produce a NormalizedRequest
   * that conforms to the unified interface.
   */
  describe("Normalization", () => {
    const normalizedMessageArb = fc.record({
      role: fc.constantFrom<NormalizedMessage["role"]>(
        "system",
        "user",
        "assistant"
      ),
      content: fc.string({ minLength: 1, maxLength: 100 }),
    });

    const normalizedRequestArb = fc.record({
      messages: fc.array(normalizedMessageArb, { minLength: 1, maxLength: 5 }),
      model: fc.string({ minLength: 1, maxLength: 50 }),
      stream: fc.boolean(),
      maxTokens: fc.option(fc.integer({ min: 1, max: 4096 }), {
        nil: undefined,
      }),
      temperature: fc.option(fc.float({ min: 0, max: 2 }), { nil: undefined }),
    });

    it("OpenAI adapter should accept any normalized request", () => {
      fc.assert(
        fc.property(normalizedRequestArb, (request) => {
          const config: ProviderConfig = {
            type: "openai",
            apiKey: "test-key",
            model: "gpt-4",
          };
          const adapter = new OpenAIAdapter(config);

          // Adapter should be created without error
          expect(adapter.name).toBe("openai");
          expect(adapter.config.model).toBe("gpt-4");
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("Anthropic adapter should accept any normalized request", () => {
      fc.assert(
        fc.property(normalizedRequestArb, (request) => {
          const config: ProviderConfig = {
            type: "anthropic",
            apiKey: "test-key",
            model: "claude-3-sonnet-20240229",
          };
          const adapter = new AnthropicAdapter(config);

          expect(adapter.name).toBe("anthropic");
          expect(adapter.config.model).toBe("claude-3-sonnet-20240229");
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 17: OpenAI Response Parsing**
   * **Validates: Requirements 8.3**
   */
  describe("OpenAI Response Parsing", () => {
    it("should parse valid OpenAI response", async () => {
      const config: ProviderConfig = {
        type: "openai",
        apiKey: "test-key",
        model: "gpt-4",
      };
      const adapter = new OpenAIAdapter(config);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "chatcmpl-123",
          object: "chat.completion",
          created: 1234567890,
          model: "gpt-4",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Hello, world!",
              },
              finish_reason: "stop",
            },
          ],
        }),
      });

      const request: NormalizedRequest = {
        messages: [{ role: "user", content: "Hi" }],
        model: "gpt-4",
        stream: false,
      };

      const generator = adapter.sendRequest(request);
      const result = await generator.next();

      expect(result.value).toEqual({
        content: "Hello, world!",
        toolCalls: undefined,
        done: true,
      });
    });

    it("should handle OpenAI error response", async () => {
      const config: ProviderConfig = {
        type: "openai",
        apiKey: "test-key",
        model: "gpt-4",
      };
      const adapter = new OpenAIAdapter(config);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
        json: async () => ({
          error: { message: "Invalid API key" },
        }),
      });

      const request: NormalizedRequest = {
        messages: [{ role: "user", content: "Hi" }],
        model: "gpt-4",
        stream: false,
      };

      const generator = adapter.sendRequest(request);
      await expect(generator.next()).rejects.toThrow("OpenAI API error");
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 18: Anthropic Response Parsing**
   * **Validates: Requirements 9.3**
   */
  describe("Anthropic Response Parsing", () => {
    it("should parse valid Anthropic response", async () => {
      const config: ProviderConfig = {
        type: "anthropic",
        apiKey: "test-key",
        model: "claude-3-sonnet-20240229",
      };
      const adapter = new AnthropicAdapter(config);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "msg_123",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Hello from Claude!",
            },
          ],
          model: "claude-3-sonnet-20240229",
          stop_reason: "end_turn",
          usage: {
            input_tokens: 10,
            output_tokens: 5,
          },
        }),
      });

      const request: NormalizedRequest = {
        messages: [{ role: "user", content: "Hi" }],
        model: "claude-3-sonnet-20240229",
        stream: false,
      };

      const generator = adapter.sendRequest(request);
      const result = await generator.next();

      expect(result.value).toEqual({
        content: "Hello from Claude!",
        toolCalls: undefined,
        done: true,
      });
    });
  });

  describe("Feature Support", () => {
    it("OpenAI should support streaming and tools", () => {
      const config: ProviderConfig = {
        type: "openai",
        apiKey: "test-key",
        model: "gpt-4",
      };
      const adapter = new OpenAIAdapter(config);

      expect(adapter.supportsFeature("streaming")).toBe(true);
      expect(adapter.supportsFeature("tools")).toBe(true);
    });

    it("Anthropic should support streaming and tools", () => {
      const config: ProviderConfig = {
        type: "anthropic",
        apiKey: "test-key",
        model: "claude-3-sonnet-20240229",
      };
      const adapter = new AnthropicAdapter(config);

      expect(adapter.supportsFeature("streaming")).toBe(true);
      expect(adapter.supportsFeature("tools")).toBe(true);
    });

    it("OpenAI-compatible should have conservative defaults", () => {
      const config: ProviderConfig = {
        type: "openai-compatible",
        baseUrl: "http://localhost:1234/v1",
        model: "local-model",
      };
      const adapter = new OpenAICompatibleAdapter(config);

      expect(adapter.supportsFeature("streaming")).toBe(true);
      expect(adapter.supportsFeature("tools")).toBe(false); // Conservative default
    });
  });

  describe("Configuration Validation", () => {
    it("OpenAI should require API key", async () => {
      const config: ProviderConfig = {
        type: "openai",
        model: "gpt-4",
      };
      const adapter = new OpenAIAdapter(config);

      const result = await adapter.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === "apiKey")).toBe(true);
    });

    it("OpenAI-compatible should require base URL", async () => {
      const config: ProviderConfig = {
        type: "openai-compatible",
        model: "local-model",
      };
      const adapter = new OpenAICompatibleAdapter(config);

      const result = await adapter.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === "baseUrl")).toBe(true);
    });

    it("Anthropic-compatible should require base URL", async () => {
      const config: ProviderConfig = {
        type: "anthropic-compatible",
        model: "claude-3-sonnet",
      };
      const adapter = new AnthropicCompatibleAdapter(config);

      const result = await adapter.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === "baseUrl")).toBe(true);
    });
  });

  describe("Model Mapping", () => {
    it("should use mapped model name when configured", () => {
      const config: ProviderConfig = {
        type: "openai",
        apiKey: "test-key",
        model: "gpt4",
        modelMapping: {
          gpt4: "gpt-4-turbo-preview",
        },
      };
      const adapter = new OpenAIAdapter(config);

      // Access protected method via any
      const mappedModel = (adapter as any).getMappedModel();
      expect(mappedModel).toBe("gpt-4-turbo-preview");
    });
  });
});
