/**
 * Request deduplication utility
 * Prevents duplicate requests from being sent simultaneously
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  abortController: AbortController;
}

export class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private requestTimeout: number;

  constructor(timeoutMs: number = 30000) {
    this.requestTimeout = timeoutMs;
  }

  /**
   * Execute request with deduplication
   * If same request is already in flight, return existing promise
   */
  async execute<T>(
    key: string,
    requestFn: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log(`[Dedup] Reusing existing request for key: ${key}`);
      return existing.promise;
    }

    // Create new request
    const abortController = new AbortController();
    const promise = this.executeWithTimeout(
      key,
      requestFn,
      abortController.signal,
    );

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
      abortController,
    });

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    key: string,
    requestFn: (signal: AbortSignal) => Promise<T>,
    signal: AbortSignal,
  ): Promise<T> {
    const timeoutId = setTimeout(() => {
      const pending = this.pendingRequests.get(key);
      if (pending) {
        pending.abortController.abort();
        this.pendingRequests.delete(key);
      }
    }, this.requestTimeout);

    try {
      return await requestFn(signal);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Cancel a pending request
   */
  cancel(key: string): boolean {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      pending.abortController.abort();
      this.pendingRequests.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    for (const [key, pending] of this.pendingRequests.entries()) {
      pending.abortController.abort();
    }
    this.pendingRequests.clear();
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Check if request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Clean up stale requests
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > this.requestTimeout) {
        pending.abortController.abort();
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Generate cache key from request parameters
   */
  static generateKey(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, any>,
      );

    return JSON.stringify(sorted);
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();

// Cleanup stale requests every minute
if (typeof window !== "undefined") {
  setInterval(() => {
    requestDeduplicator.cleanup();
  }, 60000);
}
