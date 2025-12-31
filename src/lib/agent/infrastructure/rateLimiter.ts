import { RateLimitOptions } from "../types";

const DEFAULT_OPTIONS: RateLimitOptions = {
  requestsPerMinute: 60,
  tokensPerMinute: 100000,
  queueEnabled: true,
};

interface QueuedRequest {
  id: string;
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class RateLimiter {
  private options: RateLimitOptions;
  private requestTimestamps: number[] = [];
  private tokenUsage: { timestamp: number; tokens: number }[] = [];
  private queue: QueuedRequest[] = [];
  private processing = false;

  constructor(options: Partial<RateLimitOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.cleanOldEntries();

    if (this.canProceed(tokens)) {
      this.recordRequest(tokens);
      return;
    }

    if (!this.options.queueEnabled) {
      throw new Error("Rate limit exceeded");
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.queue.push({
        id,
        resolve: () => {
          this.recordRequest(tokens);
          resolve();
        },
        reject,
        timestamp: Date.now(),
      });

      this.processQueue();
    });
  }

  getQueuePosition(): number {
    return this.queue.length;
  }

  getEstimatedWaitTime(): number {
    if (this.queue.length === 0) return 0;

    this.cleanOldEntries();

    // Calculate when the oldest request will expire
    if (this.requestTimestamps.length === 0) return 0;

    const oldestTimestamp = Math.min(...this.requestTimestamps);
    const expiryTime = oldestTimestamp + 60000; // 1 minute window
    const waitTime = Math.max(0, expiryTime - Date.now());

    // Multiply by queue position for rough estimate
    return waitTime * (this.queue.length + 1);
  }

  getCurrentUsage(): { requests: number; tokens: number } {
    this.cleanOldEntries();
    return {
      requests: this.requestTimestamps.length,
      tokens: this.tokenUsage.reduce((sum, entry) => sum + entry.tokens, 0),
    };
  }

  getRemainingCapacity(): { requests: number; tokens: number } {
    const usage = this.getCurrentUsage();
    return {
      requests: Math.max(0, this.options.requestsPerMinute - usage.requests),
      tokens: Math.max(0, this.options.tokensPerMinute - usage.tokens),
    };
  }

  reset(): void {
    this.requestTimestamps = [];
    this.tokenUsage = [];
    this.queue.forEach((req) => req.reject(new Error("Rate limiter reset")));
    this.queue = [];
  }

  private canProceed(tokens: number): boolean {
    const usage = this.getCurrentUsage();
    return (
      usage.requests < this.options.requestsPerMinute &&
      usage.tokens + tokens <= this.options.tokensPerMinute
    );
  }

  private recordRequest(tokens: number): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.tokenUsage.push({ timestamp: now, tokens });
  }

  private cleanOldEntries(): void {
    const cutoff = Date.now() - 60000; // 1 minute window
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff);
    this.tokenUsage = this.tokenUsage.filter(
      (entry) => entry.timestamp > cutoff
    );
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      this.cleanOldEntries();

      if (this.canProceed(1)) {
        const request = this.queue.shift();
        if (request) {
          request.resolve();
        }
      } else {
        // Wait for capacity
        const waitTime = this.calculateWaitTime();
        await this.sleep(waitTime);
      }
    }

    this.processing = false;
  }

  private calculateWaitTime(): number {
    if (this.requestTimestamps.length === 0) return 100;

    const oldestTimestamp = Math.min(...this.requestTimestamps);
    const expiryTime = oldestTimestamp + 60000;
    return Math.max(100, expiryTime - Date.now());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const rateLimiter = new RateLimiter();
