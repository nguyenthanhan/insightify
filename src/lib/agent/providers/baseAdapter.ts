import {
  ProviderConfig,
  ProviderFeature,
  NormalizedRequest,
  NormalizedMessage,
  NormalizedTool,
  NormalizedResponse,
  ProviderChunk,
  ValidationResult,
  ValidationError,
  ToolCall,
} from "../types";

export abstract class BaseProviderAdapter {
  abstract readonly name: string;
  protected _config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this._config = config;
  }

  get config(): ProviderConfig {
    return this._config;
  }

  abstract sendRequest(
    request: NormalizedRequest
  ): AsyncGenerator<ProviderChunk>;
  abstract validateConfig(): Promise<ValidationResult>;
  abstract supportsFeature(feature: ProviderFeature): boolean;

  // Common normalization helpers
  protected normalizeMessages(
    messages: NormalizedMessage[]
  ): NormalizedMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      toolCallId: msg.toolCallId,
      toolCalls: msg.toolCalls,
    }));
  }

  protected normalizeTools(
    tools?: NormalizedTool[]
  ): NormalizedTool[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  protected createValidationError(
    path: string,
    message: string,
    code: string
  ): ValidationError {
    return { path, message, code };
  }

  protected createSuccessValidation(): ValidationResult {
    return { valid: true, errors: [] };
  }

  protected createFailedValidation(
    errors: ValidationError[]
  ): ValidationResult {
    return { valid: false, errors };
  }

  // Parse tool calls from string arguments
  protected parseToolCallArguments(
    argsString: string
  ): Record<string, unknown> {
    try {
      return JSON.parse(argsString);
    } catch {
      return {};
    }
  }

  // Create a normalized response from provider-specific format
  protected createNormalizedResponse(
    content: string,
    toolCalls?: ToolCall[],
    finishReason: NormalizedResponse["finishReason"] = "stop"
  ): NormalizedResponse {
    return {
      content,
      toolCalls,
      finishReason,
    };
  }

  // Create a provider chunk for streaming
  protected createChunk(
    content?: string,
    done: boolean = false
  ): ProviderChunk {
    return {
      content,
      done,
    };
  }

  // Validate base configuration
  protected validateBaseConfig(): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!this._config.model) {
      errors.push(
        this.createValidationError("model", "Model is required", "REQUIRED")
      );
    }

    if (!this._config.type) {
      errors.push(
        this.createValidationError(
          "type",
          "Provider type is required",
          "REQUIRED"
        )
      );
    }

    return errors;
  }

  // Get the effective base URL
  protected getBaseUrl(): string {
    return this._config.baseUrl || this.getDefaultBaseUrl();
  }

  protected abstract getDefaultBaseUrl(): string;

  // Get headers for requests
  protected async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add custom headers from config
    if (this._config.headers) {
      Object.assign(headers, this._config.headers);
    }

    // Add auth headers
    if (this._config.authStrategy) {
      const authHeaders = await this._config.authStrategy.getHeaders();
      Object.assign(headers, authHeaders);
    } else if (this._config.apiKey) {
      Object.assign(headers, this.getDefaultAuthHeaders());
    }

    return headers;
  }

  protected abstract getDefaultAuthHeaders(): Record<string, string>;

  // Map model name if mapping is configured
  protected getMappedModel(): string {
    const model = this._config.model;
    if (this._config.modelMapping && this._config.modelMapping[model]) {
      return this._config.modelMapping[model];
    }
    return model;
  }
}
