import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { ResponseCache } from "./cache";
import { agentResponseArb } from "@/test/arbitraries";
import { AgentResponse } from "../types";

describe("ResponseCache", () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache({ storage: "memory" });
  });

  /**
   * **Feature: advanced-ai-agent, Property 12: Cache Round-Trip**
   * **Validates: Requirements 6.5**
   *
   * For any AgentResponse stored in cache, retrieving it SHALL return
   * an equivalent AgentResponse.
   */
  it("should round-trip any AgentResponse through cache", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        agentResponseArb,
        (key, response) => {
          cache.set(key, response);
          const retrieved = cache.get(key);

          expect(retrieved).not.toBeNull();
          expect(retrieved?.content).toBe(response.content);
          expect(retrieved?.type).toBe(response.type);
          expect(retrieved?.cached).toBe(response.cached);
          expect(retrieved?.provider).toBe(response.provider);

          if (response.data) {
            expect(retrieved?.data).toEqual(response.data);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: advanced-ai-agent, Property 14: Cache TTL Expiration**
   * **Validates: Requirements 6.4**
   *
   * For any cached response, after TTL expiration the cache SHALL return
   * null and trigger a fresh API call.
   */
  it("should expire entries after TTL", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        agentResponseArb,
        fc.integer({ min: 1, max: 100 }),
        (key, response, ttlMs) => {
          const shortTtlCache = new ResponseCache({
            storage: "memory",
            ttlMs: ttlMs,
          });

          // Set with short TTL
          shortTtlCache.set(key, response, ttlMs);

          // Should exist immediately
          expect(shortTtlCache.has(key)).toBe(true);

          // Mock time passing
          vi.useFakeTimers();
          vi.advanceTimersByTime(ttlMs + 1);

          // Should be expired now
          const retrieved = shortTtlCache.get(key);
          expect(retrieved).toBeNull();

          vi.useRealTimers();
        }
      ),
      { numRuns: 50 }
    );
  });

  describe("basic operations", () => {
    it("should store and retrieve a response", () => {
      const response: AgentResponse = {
        content: "Test response",
        type: "text",
        cached: false,
        provider: "test",
      };

      cache.set("test-key", response);
      const retrieved = cache.get("test-key");

      expect(retrieved).toEqual(response);
    });

    it("should return null for non-existent key", () => {
      const result = cache.get("non-existent");
      expect(result).toBeNull();
    });

    it("should invalidate a specific key", () => {
      const response: AgentResponse = {
        content: "Test",
        type: "text",
        cached: false,
        provider: "test",
      };

      cache.set("key1", response);
      cache.set("key2", response);

      cache.invalidate("key1");

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).not.toBeNull();
    });

    it("should clear all entries", () => {
      const response: AgentResponse = {
        content: "Test",
        type: "text",
        cached: false,
        provider: "test",
      };

      cache.set("key1", response);
      cache.set("key2", response);

      cache.clear();

      expect(cache.size()).toBe(0);
    });

    it("should respect max size limit", () => {
      const smallCache = new ResponseCache({
        storage: "memory",
        maxSize: 3,
      });

      const response: AgentResponse = {
        content: "Test",
        type: "text",
        cached: false,
        provider: "test",
      };

      smallCache.set("key1", response);
      smallCache.set("key2", response);
      smallCache.set("key3", response);
      smallCache.set("key4", response);

      expect(smallCache.size()).toBe(3);
    });
  });

  describe("serialization", () => {
    it("should serialize and deserialize response", () => {
      const response: AgentResponse = {
        content: "Test",
        type: "chart",
        data: {
          title: "Chart",
          data: [{ x: 1, y: 2 }],
          chartType: "line",
          xKey: "x",
          yKey: "y",
        },
        cached: true,
        provider: "openai",
      };

      const serialized = cache.serialize(response);
      const deserialized = cache.deserialize(serialized);

      expect(deserialized).toEqual(response);
    });
  });

  describe("key generation", () => {
    it("should generate consistent keys", () => {
      const key1 = ResponseCache.generateKey("Show me sales", "sales");
      const key2 = ResponseCache.generateKey("show me sales", "sales");
      const key3 = ResponseCache.generateKey("  Show Me Sales  ", "sales");

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });

    it("should differentiate by dashboard type", () => {
      const key1 = ResponseCache.generateKey("show data", "sales");
      const key2 = ResponseCache.generateKey("show data", "analytics");

      expect(key1).not.toBe(key2);
    });
  });
});
