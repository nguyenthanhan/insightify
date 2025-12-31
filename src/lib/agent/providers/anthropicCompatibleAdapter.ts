import { AnthropicAdapter } from "./anthropicAdapter";
import {
  ProviderConfig,
  ProviderFeature,
  ValidationResult,
  AuthStrategy,
} from "../types";

/**
 * Adapter for Anthropic API-compatible endpoints like:
 * - AWS Bedrock (Claude models)
 * - Custom Claude deployments
 */
export class AnthropicCompatibleAdapter extends AnthropicAdapter {
  readonly name = "anthropic-compatible";

  constructor(config: ProviderConfig) {
    super(config);
  }

  async validateConfig(): Promise<ValidationResult> {
    const errors = this.validateBaseConfig();

    // Custom base URL is required for compatible endpoints
    if (!this._config.baseUrl) {
      errors.push(
        this.createValidationError(
          "baseUrl",
          "Base URL is required for compatible endpoints",
          "REQUIRED"
        )
      );
    }

    // Either API key or auth strategy is required
    if (!this._config.apiKey && !this._config.authStrategy) {
      errors.push(
        this.createValidationError(
          "auth",
          "API key or auth strategy is required",
          "REQUIRED"
        )
      );
    }

    if (errors.length > 0) {
      return this.createFailedValidation(errors);
    }

    // Test connectivity
    try {
      const headers = await this.getHeaders();
      const testResponse = await fetch(`${this.getBaseUrl()}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.getMappedModel(),
          messages: [{ role: "user", content: "test" }],
          max_tokens: 1,
        }),
      });

      // Some endpoints return 400 for invalid requests but that means they're reachable
      if (!testResponse.ok && testResponse.status !== 400) {
        const error = await testResponse.json().catch(() => ({}));
        errors.push(
          this.createValidationError(
            "connection",
            `Connection failed: ${
              error.error?.message || testResponse.statusText
            }`,
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
    // Compatible endpoints may have different feature support
    switch (feature) {
      case "streaming":
        return true;
      case "tools":
        // Most Claude models support tools
        return this._config.model.includes("claude");
      case "vision":
        return this._config.model.includes("claude-3");
      case "json-mode":
        return false;
      default:
        return false;
    }
  }

  protected getDefaultBaseUrl(): string {
    // No default for compatible endpoints
    return this._config.baseUrl || "";
  }

  protected getDefaultAuthHeaders(): Record<string, string> {
    // For Bedrock, auth is handled by AWS SigV4
    // For other endpoints, use standard Anthropic headers
    if (this._config.authStrategy) {
      return {}; // Auth strategy will provide headers
    }

    if (this._config.apiKey) {
      return {
        "x-api-key": this._config.apiKey,
        "anthropic-version": this._config.apiVersion || "2024-01-01",
      };
    }

    return {
      "anthropic-version": this._config.apiVersion || "2024-01-01",
    };
  }
}

/**
 * Factory function to create the appropriate adapter based on config
 */
export function createProviderAdapter(
  config: ProviderConfig
): AnthropicAdapter | AnthropicCompatibleAdapter {
  switch (config.type) {
    case "anthropic":
      return new AnthropicAdapter(config);
    case "anthropic-compatible":
      return new AnthropicCompatibleAdapter(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}
