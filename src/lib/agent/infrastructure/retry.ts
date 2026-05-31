import { RetryOptions, AgentError, ErrorCategory } from "../types";
import { sanitizeError } from "@/lib/utils/sanitize";

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "RATE_LIMIT", "5XX"],
};

export interface RetryContext {
  attempt: number;
  lastError?: Error;
  totalDelayMs: number;
}

export class RetryHandler {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async execute<T>(
    fn: () => Promise<T>,
    options?: Partial<RetryOptions>,
  ): Promise<T> {
    const opts = { ...this.options, ...options };
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        // Sanitize error before storing
        lastError = sanitizeError(error as Error);

        if (!this.isRetryable(error, opts.retryableErrors)) {
          throw lastError;
        }

        if (attempt === opts.maxAttempts) {
          throw this.createMaxRetriesError(lastError, attempt);
        }

        const delay = this.calculateDelay(attempt, opts);
        totalDelay += delay;
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  calculateDelay(attempt: number, options?: Partial<RetryOptions>): number {
    const opts = { ...this.options, ...options };
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = opts.baseDelayMs * Math.pow(2, attempt - 1);
    // Add jitter (±10%)
    const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
    const delay = Math.min(exponentialDelay + jitter, opts.maxDelayMs);
    return Math.max(0, Math.round(delay));
  }

  isRetryable(error: unknown, retryableErrors?: string[]): boolean {
    const errors = retryableErrors ?? this.options.retryableErrors;

    if (error instanceof Error) {
      const errorCode = (error as any).code || "";
      const errorMessage = error.message.toLowerCase();

      for (const retryable of errors) {
        const lower = retryable.toLowerCase();

        // Check error code
        if (errorCode.toLowerCase().includes(lower)) {
          return true;
        }

        // Check error message
        if (errorMessage.includes(lower)) {
          return true;
        }

        // Check for HTTP 5xx errors
        if (lower === "5xx") {
          const statusMatch = errorMessage.match(/status[:\s]*(\d{3})/i);
          if (statusMatch && statusMatch[1].startsWith("5")) {
            return true;
          }
        }

        // Check for rate limit (429)
        if (lower === "rate_limit" || lower === "rate limit") {
          if (
            errorMessage.includes("429") ||
            errorMessage.includes("rate limit")
          ) {
            return true;
          }
        }

        // Check for timeout
        if (lower === "timeout") {
          if (
            errorMessage.includes("timeout") ||
            errorMessage.includes("timed out")
          ) {
            return true;
          }
        }

        // Check for network errors
        if (lower === "network_error" || lower === "network error") {
          if (
            errorMessage.includes("network") ||
            errorMessage.includes("econnrefused") ||
            errorMessage.includes("enotfound")
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private createMaxRetriesError(
    lastError: Error,
    attempts: number,
  ): AgentError {
    return {
      category: ErrorCategory.NETWORK,
      code: "MAX_RETRIES_EXCEEDED",
      message: `Failed after ${attempts} attempts: ${lastError.message}`,
      retryable: false,
      userMessage:
        "The request failed after multiple attempts. Please try again later.",
      details: {
        attempts,
        lastError: lastError.message,
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const retryHandler = new RetryHandler();
