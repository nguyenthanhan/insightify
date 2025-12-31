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
  OpenAIRequest,
  OpenAIMessage,
  OpenAITool,
  OpenAIResponse,
  OpenAIStreamChunk,
} from "./types";

export class OpenAIAdapter extends BaseProviderAdapter {
  readonly name = "openai";

  constructor(config: ProviderConfig) {
    super(config);
  }

  async *sendRequest(
    request: NormalizedRequest
  ): AsyncGenerator<ProviderChunk> {
    const openaiRequest = this.toOpenAIRequest(request);
    const headers = await this.getHeaders();
    const url = `${this.getBaseUrl()}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(openaiRequest),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: { message: response.statusText } }));
        throw new Error(
          `OpenAI API error: ${error.error?.message || response.statusText}`
        );
      }

      if (request.stream && response.body) {
        yield* this.handleStreamingResponse(response.body);
      } else {
        const data = (await response.json()) as OpenAIResponse;
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

    // Optionally test connectivity
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.getBaseUrl()}/models`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        errors.push(
          this.createValidationError(
            "connection",
            "Failed to connect to OpenAI API",
            "CONNECTION_FAILED"
          )
        );
      }
    } catch (error) {
      errors.push(
        this.createValidationError(
          "connection",
          `Connection error: ${error}`,
          "CONNECTION_ERROR"
        )
      );
    }

    return errors.length > 0
      ? this.createFailedValidation(errors)
      : this.createSuccessValidation();
  }

  supportsFeature(feature: ProviderFeature): boolean {
    switch (feature) {
      case "streaming":
        return true;
      case "tools":
        return true;
      case "vision":
        return (
          this._config.model.includes("vision") ||
          this._config.model.includes("gpt-4")
        );
      case "json-mode":
        return true;
      default:
        return false;
    }
  }

  protected getDefaultBaseUrl(): string {
    return "https://api.openai.com/v1";
  }

  protected getDefaultAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this._config.apiKey}`,
    };
  }

  private toOpenAIRequest(request: NormalizedRequest): OpenAIRequest {
    const openaiRequest: OpenAIRequest = {
      model: this.getMappedModel(),
      messages: this.toOpenAIMessages(request.messages),
      stream: request.stream,
    };

    if (request.maxTokens) {
      openaiRequest.max_tokens = request.maxTokens;
    }

    if (request.temperature !== undefined) {
      openaiRequest.temperature = request.temperature;
    }

    if (request.tools && request.tools.length > 0) {
      openaiRequest.tools = this.toOpenAITools(request.tools);
    }

    return openaiRequest;
  }

  private toOpenAIMessages(
    messages: NormalizedRequest["messages"]
  ): OpenAIMessage[] {
    return messages.map((msg) => {
      const openaiMsg: OpenAIMessage = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.toolCallId) {
        openaiMsg.tool_call_id = msg.toolCallId;
      }

      if (msg.toolCalls && msg.toolCalls.length > 0) {
        openaiMsg.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }));
      }

      return openaiMsg;
    });
  }

  private toOpenAITools(tools: NormalizedRequest["tools"]): OpenAITool[] {
    if (!tools) return [];
    return tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
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
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6)) as OpenAIStreamChunk;
            const delta = json.choices[0]?.delta;

            if (delta?.content) {
              yield this.createChunk(delta.content, false);
            }

            if (json.choices[0]?.finish_reason) {
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

  private handleNonStreamingResponse(data: OpenAIResponse): ProviderChunk {
    const choice = data.choices[0];
    const content = choice?.message?.content || "";
    const toolCalls = this.parseToolCalls(choice?.message?.tool_calls);

    return {
      content,
      toolCalls,
      done: true,
    };
  }

  private parseToolCalls(
    toolCalls?: OpenAIMessage["tool_calls"]
  ): ToolCall[] | undefined {
    if (!toolCalls || toolCalls.length === 0) return undefined;

    return toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: this.parseToolCallArguments(tc.function.arguments),
    }));
  }
}
