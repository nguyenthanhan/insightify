import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { safeStorage } from "@/lib/utils/sanitize";

/**
 * Schema for error details within a log entry
 */
export const ErrorDetailsSchema = z.object({
  name: z.string(),
  message: z.string(),
  stack: z.string().optional(),
});

/**
 * Schema for a single error log entry
 */
export const ErrorLogEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number(),
  error: ErrorDetailsSchema,
  componentStack: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;
export type ErrorLogEntry = z.infer<typeof ErrorLogEntrySchema>;

/**
 * Configuration options for ErrorLogger
 */
export interface ErrorLoggerConfig {
  maxEntries?: number;
  persistToStorage?: boolean;
  storageKey?: string;
}

const DEFAULT_CONFIG: Required<ErrorLoggerConfig> = {
  maxEntries: 100,
  persistToStorage: false,
  storageKey: "error_log_entries",
};

/**
 * ErrorLogger - Structured error logging with serialization support
 *
 * @example
 * ```typescript
 * const logger = new ErrorLogger({ maxEntries: 50 });
 * logger.log(new Error('Something went wrong'), undefined, { userId: '123' });
 * const entries = logger.getEntries();
 * const json = logger.serialize();
 * ```
 */
export class ErrorLogger {
  private entries: ErrorLogEntry[] = [];
  private config: Required<ErrorLoggerConfig>;

  constructor(config: ErrorLoggerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * Log an error with optional React error info and context
   */
  log(
    error: Error,
    errorInfo?: { componentStack?: string },
    context?: Record<string, unknown>,
  ): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo?.componentStack,
      context,
    };

    this.entries.unshift(entry);

    // Trim entries if exceeding max
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(0, this.config.maxEntries);
    }

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorLogger]", entry);
    }

    return entry;
  }

  /**
   * Get all logged entries
   */
  getEntries(): ErrorLogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by time range
   */
  getEntriesByTimeRange(startTime: number, endTime: number): ErrorLogEntry[] {
    return this.entries.filter(
      (entry) => entry.timestamp >= startTime && entry.timestamp <= endTime,
    );
  }

  /**
   * Get entries filtered by error name
   */
  getEntriesByErrorName(name: string): ErrorLogEntry[] {
    return this.entries.filter((entry) => entry.error.name === name);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Serialize entries to JSON string
   */
  serialize(): string {
    return JSON.stringify(this.entries);
  }

  /**
   * Deserialize JSON string to entries
   * Returns the parsed entries without modifying internal state
   */
  deserialize(json: string): ErrorLogEntry[] {
    try {
      const parsed = JSON.parse(json);

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid format: expected array");
      }

      // Validate each entry against schema
      const validatedEntries: ErrorLogEntry[] = [];
      for (const item of parsed) {
        const result = ErrorLogEntrySchema.safeParse(item);
        if (result.success) {
          validatedEntries.push(result.data);
        }
      }

      return validatedEntries;
    } catch {
      return [];
    }
  }

  /**
   * Load entries from deserialized JSON and replace current entries
   */
  loadFromJson(json: string): void {
    const entries = this.deserialize(json);
    this.entries = entries;
  }

  /**
   * Get the count of entries
   */
  get count(): number {
    return this.entries.length;
  }

  private loadFromStorage(): void {
    const stored = safeStorage.getItem(this.config.storageKey);
    if (stored) {
      this.entries = this.deserialize(stored);
    }
  }

  private saveToStorage(): void {
    const success = safeStorage.setItem(
      this.config.storageKey,
      this.serialize(),
    );
    if (!success && process.env.NODE_ENV === "development") {
      console.warn("Failed to save error logs: storage quota exceeded");
    }
  }
}

// Singleton instance for global error logging
let globalLogger: ErrorLogger | null = null;

/**
 * Get or create the global ErrorLogger instance
 */
export function getErrorLogger(config?: ErrorLoggerConfig): ErrorLogger {
  if (!globalLogger) {
    globalLogger = new ErrorLogger(config);
  }
  return globalLogger;
}

/**
 * Reset the global logger (useful for testing)
 */
export function resetErrorLogger(): void {
  globalLogger = null;
}
