import { BaseProviderAdapter } from "./baseAdapter";
import {
  ProviderConfig,
  ProviderFeature,
  NormalizedRequest,
  ProviderChunk,
  ValidationResult,
  ToolCall,
} from "../types";
import {
  AnthropicRequest,
  AnthropicMessage,
  AnthropicTool,
  AnthropicResponse,
  AnthropicStreamEvent,
  AnthropicContentBlock,
} from "./types";

export class AnthropicAdapter extends BaseProviderAdapter {
  readonly name = "anthropic";

  constructor(config: ProviderConfig) {
    super(config);
  }

  async *sendRequest(
    request: NormalizedRequest
  ): AsyncGenerator<ProviderChunk> {
    const anthropicRequest = this.toAnthropicRequest(request);
    const headers = await this.getHeaders();
    const url = `${this.getBaseUrl()}/messages`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(anthropicRequest),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: { message: response.statusText } }));
        throw new Error(
          `Anthropic API error: ${error.error?.message || response.statusText}`
        );
      }

      if (request.stream && response.body) {
        yield* this.handleStreamingResponse(response.body);
      } else {
        const data = (await response.json()) as AnthropicResponse;
        yield this.handleNonStreamingResponse(data);
      }
    } catch (error) {
      throw error;
    }
  }

  async validateConfig(): Promise<ValidationResult> {
    const errors = this.validateBaseConfig();

    if (!this._config.apiKey && !this._config.authStrategy) {
      errors.push(
        this.createValidationError(
          "apiKey",
          "API key or auth strategy is required",
          "REQUIRED"
        )
      );
    }

    if (errors.length > 0) {
      return this.createFailedValidation(errors);
    }

    return this.createSuccessValidation();
  }

  supportsFeature(feature: ProviderFeature): boolean {
    switch (feature) {
      case "streaming":
        return true;
      case "tools":
        return true;
      case "vision":
        return this._config.model.includes("claude-3");
      case "json-mode":
        return false; // Anthropic doesn't have explicit JSON mode
      default:
        return false;
    }
  }

  protected getDefaultBaseUrl(): string {
    return "https://api.anthropic.com/v1";
  }

  protected getDefaultAuthHeaders(): Record<string, string> {
    return {
      "x-api-key": this._config.apiKey || "",
      "anthropic-version": this._config.apiVersion || "2024-01-01",
    };
  }

  private toAnthropicRequest(request: NormalizedRequest): AnthropicRequest {
    // Extract system message
    const systemMessage = request.messages.find((m) => m.role === "system");
    const nonSystemMessages = request.messages.filter(
      (m) => m.role !== "system"
    );

    const anthropicRequest: AnthropicRequest = {
      model: this.getMappedModel(),
      messages: this.toAnthropicMessages(nonSystemMessages),
      max_tokens: request.maxTokens || 4096,
      stream: request.stream,
    };

    if (systemMessage) {
      anthropicRequest.system = systemMessage.content;
    }

    if (request.temperature !== undefined) {
      anthropicRequest.temperature = request.temperature;
    }

    if (request.tools && request.tools.length > 0) {
      anthropicRequest.tools = this.toAnthropicTools(request.tools);
    }

    return anthropicRequest;
  }

  private toAnthropicMessages(
    messages: NormalizedRequest["messages"]
  ): AnthropicMessage[] {
    return messages.map((msg) => {
      // Handle tool results
      if (msg.role === "tool" && msg.toolCallId) {
        return {
          role: "user" as const,
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: msg.toolCallId,
              content: msg.content,
            },
          ],
        };
      }

      // Handle assistant messages with tool calls
      if (
        msg.role === "assistant" &&
        msg.toolCalls &&
        msg.toolCalls.length > 0
      ) {
        const content: AnthropicContentBlock[] = [];

        if (msg.content) {
          content.push({ type: "text", text: msg.content });
        }

        for (const tc of msg.toolCalls) {
          content.push({
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }

        return {
          role: "assistant" as const,
          content,
        };
      }

      // Regular message
      return {
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      } as AnthropicMessage;
    });
  }

  private toAnthropicTools(tools: NormalizedRequest["tools"]): AnthropicTool[] {
    if (!tools) return [];
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }

  private async *handleStreamingResponse(
    body: ReadableStream<Uint8Array>
  ): AsyncGenerator<ProviderChunk> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(trimmed.slice(6)) as AnthropicStreamEvent;

            if (event.type === "content_block_delta" && event.delta?.text) {
              yield this.createChunk(event.delta.text, false);
            }

            if (event.type === "message_stop") {
              yield this.createChunk(undefined, true);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private handleNonStreamingResponse(data: AnthropicResponse): ProviderChunk {
    let content = "";
    const toolCalls: ToolCall[] = [];

    for (const block of data.content) {
      if (block.type === "text" && block.text) {
        content += block.text;
      } else if (block.type === "tool_use" && block.id && block.name) {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input || {},
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      done: true,
    };
  }
}
