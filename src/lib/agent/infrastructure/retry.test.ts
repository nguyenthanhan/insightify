import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { RetryHandler } from "./retry";

describe("RetryHandler", () => {
  let handler: RetryHandler;

  beforeEach(() => {
    handler = new RetryHandler({
      baseDelayMs: 1,
      maxDelayMs: 100,
      maxAttempts: 3,
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 10: Exponential Backoff Timing**
   * **Validates: Requirements 5.1**
   */
  it("should calculate exponential backoff delays correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 5000, max: 30000 }),
        (attempt, baseDelayMs, maxDelayMs) => {
          const testHandler = new RetryHandler({ baseDelayMs, maxDelayMs });
          const delay = testHandler.calculateDelay(attempt, {
            baseDelayMs,
            maxDelayMs,
          });

          return delay >= 0 && delay <= maxDelayMs;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: advanced-ai-agent, Property 9: Retry Preserves Request Parameters**
   * **Validates: Requirements 5.5**
   *
   * Verifies that when a function is retried, it receives the same parameters each time.
   */
  it("should preserve request parameters across retries", async () => {
    const testHandler = new RetryHandler({
      baseDelayMs: 1,
      maxDelayMs: 5,
      maxAttempts: 3,
    });

    const originalParams = { query: "test query", model: "gpt-4" };
    const receivedParams: (typeof originalParams)[] = [];
    let callCount = 0;

    const fn = async () => {
      receivedParams.push({ ...originalParams });
      callCount++;
      if (callCount < 3) {
        throw new Error("Network error");
      }
      return "success";
    };

    await testHandler.execute(fn);

    // All 3 calls should have received the same parameters
    expect(receivedParams).toHaveLength(3);
    receivedParams.forEach((params) => {
      expect(params).toEqual(originalParams);
    });
  });

  describe("execute", () => {
    it("should succeed on first attempt if no error", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await handler.execute(fn);
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable error and succeed", async () => {
      const shortHandler = new RetryHandler({
        baseDelayMs: 1,
        maxDelayMs: 10,
        maxAttempts: 3,
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success");

      const result = await shortHandler.execute(fn);
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable error", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Validation error"));
      await expect(handler.execute(fn)).rejects.toThrow("Validation error");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should throw after max attempts", async () => {
      const shortHandler = new RetryHandler({
        baseDelayMs: 1,
        maxDelayMs: 10,
        maxAttempts: 3,
      });

      const fn = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(shortHandler.execute(fn)).rejects.toMatchObject({
        code: "MAX_RETRIES_EXCEEDED",
      });
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe("isRetryable", () => {
    it("should identify network errors as retryable", () => {
      expect(handler.isRetryable(new Error("Network error"))).toBe(true);
      expect(handler.isRetryable(new Error("ECONNREFUSED"))).toBe(true);
    });

    it("should identify timeout errors as retryable", () => {
      expect(handler.isRetryable(new Error("Request timeout"))).toBe(true);
    });

    it("should identify rate limit errors as retryable", () => {
      expect(handler.isRetryable(new Error("Rate limit exceeded"))).toBe(true);
    });

    it("should identify 5xx errors as retryable", () => {
      expect(handler.isRetryable(new Error("Status: 500"))).toBe(true);
    });

    it("should not retry validation errors", () => {
      expect(handler.isRetryable(new Error("Invalid input"))).toBe(false);
    });
  });

  describe("calculateDelay", () => {
    it("should increase delay exponentially", () => {
      const delay1 = handler.calculateDelay(1);
      const delay2 = handler.calculateDelay(2);
      expect(delay2).toBeGreaterThan(delay1 * 1.5);
    });

    it("should cap delay at maxDelayMs", () => {
      const delay = handler.calculateDelay(10);
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });
});
