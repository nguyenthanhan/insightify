import { OpenAIAdapter } from "./openaiAdapter";
import { ProviderConfig, ProviderFeature, ValidationResult } from "../types";

/**
 * Adapter for OpenAI API-compatible endpoints like:
 * - Azure OpenAI
 * - LM Studio
 * - Ollama
 * - vLLM
 * - LocalAI
 */
export class OpenAICompatibleAdapter extends OpenAIAdapter {
  readonly name = "openai-compatible";
  private detectedFeatures: Set<ProviderFeature> = new Set();
  private featuresDetected = false;

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

    if (errors.length > 0) {
      return this.createFailedValidation(errors);
    }

    // Test connectivity and detect features
    try {
      await this.detectFeatures();
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
    // If features haven't been detected yet, assume basic support
    if (!this.featuresDetected) {
      switch (feature) {
        case "streaming":
          return true; // Most endpoints support streaming
        case "tools":
          return false; // Conservative default
        case "vision":
          return false;
        case "json-mode":
          return false;
        default:
          return false;
      }
    }

    return this.detectedFeatures.has(feature);
  }

  protected getDefaultBaseUrl(): string {
    // No default for compatible endpoints - must be configured
    return this._config.baseUrl || "";
  }

  protected getDefaultAuthHeaders(): Record<string, string> {
    // Some endpoints don't require auth, others use different schemes
    if (this._config.apiKey) {
      return {
        Authorization: `Bearer ${this._config.apiKey}`,
      };
    }
    return {};
  }

  private async detectFeatures(): Promise<void> {
    this.detectedFeatures.clear();

    // Always assume streaming is supported
    this.detectedFeatures.add("streaming");

    try {
      const headers = await this.getHeaders();

      // Try to get models list to verify connectivity
      const modelsResponse = await fetch(`${this.getBaseUrl()}/models`, {
        method: "GET",
        headers,
      });

      if (modelsResponse.ok) {
        const models = await modelsResponse.json();

        // Check if the configured model supports tools/functions
        if (this.modelSupportsTools(models)) {
          this.detectedFeatures.add("tools");
        }

        // Check for vision support
        if (this.modelSupportsVision(models)) {
          this.detectedFeatures.add("vision");
        }
      }

      // Try a simple completion to verify the endpoint works
      const testResponse = await fetch(
        `${this.getBaseUrl()}/chat/completions`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: this.getMappedModel(),
            messages: [{ role: "user", content: "test" }],
            max_tokens: 1,
          }),
        }
      );

      if (testResponse.ok) {
        // Endpoint is working
        this.featuresDetected = true;
      }
    } catch {
      // Feature detection failed, use conservative defaults
      this.featuresDetected = true;
    }
  }

  private modelSupportsTools(models: any): boolean {
    // Check if the model list indicates function calling support
    const modelList = models?.data || [];
    const configuredModel = this.getMappedModel().toLowerCase();

    for (const model of modelList) {
      const modelId = (model.id || "").toLowerCase();
      if (
        modelId.includes(configuredModel) ||
        configuredModel.includes(modelId)
      ) {
        // Check for known models that support tools
        if (
          modelId.includes("gpt-4") ||
          modelId.includes("gpt-3.5-turbo") ||
          modelId.includes("claude") ||
          modelId.includes("mistral") ||
          modelId.includes("mixtral")
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private modelSupportsVision(models: any): boolean {
    const modelList = models?.data || [];
    const configuredModel = this.getMappedModel().toLowerCase();

    for (const model of modelList) {
      const modelId = (model.id || "").toLowerCase();
      if (
        modelId.includes(configuredModel) ||
        configuredModel.includes(modelId)
      ) {
        if (
          modelId.includes("vision") ||
          modelId.includes("gpt-4o") ||
          modelId.includes("gpt-4-turbo") ||
          modelId.includes("llava")
        ) {
          return true;
        }
      }
    }

    return false;
  }
}
