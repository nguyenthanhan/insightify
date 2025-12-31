import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  LoadingCoordinator,
  LoadingState,
  LoadingStateSchema,
  getLoadingCoordinator,
  resetLoadingCoordinator,
} from "./loadingCoordinator";

// Arbitrary for generating valid loading states
const loadingStateArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  isLoading: fc.boolean(),
  startTime: fc.integer({ min: 0, max: Date.now() + 1000000 }),
  minDuration: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined }),
});

describe("LoadingCoordinator", () => {
  let coordinator: LoadingCoordinator;

  beforeEach(() => {
    vi.useFakeTimers();
    coordinator = new LoadingCoordinator({ defaultMinDuration: 300 });
    resetLoadingCoordinator();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("register", () => {
    it("should register a new loading state", () => {
      coordinator.register("test");

      const state = coordinator.getState("test");
      expect(state).toBeDefined();
      expect(state?.id).toBe("test");
      expect(state?.isLoading).toBe(false);
    });

    it("should not overwrite existing state", () => {
      coordinator.register("test", 500);
      coordinator.start("test");
      coordinator.register("test", 1000);

      const state = coordinator.getState("test");
      expect(state?.isLoading).toBe(true);
      expect(state?.minDuration).toBe(500);
    });

    it("should use custom minDuration", () => {
      coordinator.register("test", 1000);

      const state = coordinator.getState("test");
      expect(state?.minDuration).toBe(1000);
    });
  });

  describe("start", () => {
    it("should set isLoading to true", () => {
      coordinator.register("test");
      coordinator.start("test");

      expect(coordinator.isLoading("test")).toBe(true);
    });

    it("should auto-register if not exists", () => {
      coordinator.start("auto");

      expect(coordinator.getState("auto")).toBeDefined();
      expect(coordinator.isLoading("auto")).toBe(true);
    });

    it("should set startTime", () => {
      const now = Date.now();
      vi.setSystemTime(now);

      coordinator.start("test");

      const state = coordinator.getState("test");
      expect(state?.startTime).toBe(now);
    });
  });

  describe("end", () => {
    it("should respect minDuration before ending", () => {
      coordinator.register("test", 300);
      coordinator.start("test");

      // End immediately
      coordinator.end("test");

      // Should still be loading (pending)
      expect(coordinator.isLoading("test")).toBe(true);

      // Advance time past minDuration
      vi.advanceTimersByTime(300);

      expect(coordinator.isLoading("test")).toBe(false);
    });

    it("should end immediately if minDuration elapsed", () => {
      coordinator.register("test", 300);
      coordinator.start("test");

      // Advance time past minDuration
      vi.advanceTimersByTime(400);

      coordinator.end("test");

      expect(coordinator.isLoading("test")).toBe(false);
    });
  });

  describe("forceEnd", () => {
    it("should end immediately regardless of minDuration", () => {
      coordinator.register("test", 1000);
      coordinator.start("test");
      coordinator.forceEnd("test");

      expect(coordinator.isLoading("test")).toBe(false);
    });
  });

  describe("isAnyLoading", () => {
    it("should return true if any state is loading", () => {
      coordinator.register("a");
      coordinator.register("b");
      coordinator.start("a");

      expect(coordinator.isAnyLoading()).toBe(true);
    });

    it("should return false if no state is loading", () => {
      coordinator.register("a");
      coordinator.register("b");

      expect(coordinator.isAnyLoading()).toBe(false);
    });

    it("should return true if pending end exists", () => {
      coordinator.register("test", 300);
      coordinator.start("test");
      coordinator.end("test");

      // Still pending
      expect(coordinator.isAnyLoading()).toBe(true);
    });
  });

  describe("getStates", () => {
    it("should return all registered states", () => {
      coordinator.register("a");
      coordinator.register("b");
      coordinator.register("c");

      const states = coordinator.getStates();
      expect(states.length).toBe(3);
    });
  });

  describe("clear", () => {
    it("should remove all states", () => {
      coordinator.register("a");
      coordinator.register("b");
      coordinator.start("a");

      coordinator.clear();

      expect(coordinator.getStates().length).toBe(0);
      expect(coordinator.isAnyLoading()).toBe(false);
    });

    it("should clear pending timeouts", () => {
      coordinator.register("test", 1000);
      coordinator.start("test");
      coordinator.end("test");

      coordinator.clear();

      // Advance time - should not cause errors
      vi.advanceTimersByTime(2000);

      expect(coordinator.getStates().length).toBe(0);
    });
  });

  describe("onStateChange callback", () => {
    it("should call callback on state changes", () => {
      const callback = vi.fn();
      const coordWithCallback = new LoadingCoordinator({
        onStateChange: callback,
      });

      coordWithCallback.register("test");
      coordWithCallback.start("test");

      expect(callback).toHaveBeenCalled();
    });
  });

  /**
   * **Feature: code-optimization, Property 2: Loading State Round-Trip**
   * **Validates: Requirements 3.5**
   *
   * For any valid LoadingState configuration, serializing and deserializing
   * SHALL produce an equivalent state with identical loading flags and timing information.
   */
  describe("Property 2: Loading State Round-Trip", () => {
    it("should round-trip serialize/deserialize states correctly", () => {
      fc.assert(
        fc.property(
          fc.array(loadingStateArbitrary, { minLength: 0, maxLength: 10 }),
          (states) => {
            // Deduplicate by id (Map behavior - last one wins)
            const uniqueStates = Array.from(
              new Map(states.map((s) => [s.id, s])).values()
            );

            const coordinator = new LoadingCoordinator();

            // Load states
            const json = JSON.stringify(uniqueStates);
            coordinator.loadFromJson(json);

            // Serialize and deserialize
            const serialized = coordinator.serialize();
            const deserialized = coordinator.deserialize(serialized);

            // Verify round-trip
            expect(deserialized.length).toBe(uniqueStates.length);

            for (let i = 0; i < uniqueStates.length; i++) {
              const original = uniqueStates[i];
              const restored = deserialized[i];

              expect(restored.id).toBe(original.id);
              expect(restored.isLoading).toBe(original.isLoading);
              expect(restored.startTime).toBe(original.startTime);
              expect(restored.minDuration).toBe(original.minDuration);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle empty states array", () => {
      const serialized = coordinator.serialize();
      const deserialized = coordinator.deserialize(serialized);

      expect(deserialized).toEqual([]);
    });

    it("should handle invalid JSON gracefully", () => {
      const deserialized = coordinator.deserialize("invalid json");
      expect(deserialized).toEqual([]);
    });
  });

  describe("Schema Validation", () => {
    it("should validate correct loading state", () => {
      const validState: LoadingState = {
        id: "test",
        isLoading: true,
        startTime: Date.now(),
        minDuration: 300,
      };

      const result = LoadingStateSchema.safeParse(validState);
      expect(result.success).toBe(true);
    });

    it("should reject invalid loading state", () => {
      const invalidState = {
        id: 123, // Should be string
        isLoading: "yes", // Should be boolean
      };

      const result = LoadingStateSchema.safeParse(invalidState);
      expect(result.success).toBe(false);
    });
  });

  describe("Global Coordinator", () => {
    it("should return the same instance", () => {
      const coord1 = getLoadingCoordinator();
      const coord2 = getLoadingCoordinator();

      expect(coord1).toBe(coord2);
    });

    it("should reset the global coordinator", () => {
      const coord1 = getLoadingCoordinator();
      resetLoadingCoordinator();
      const coord2 = getLoadingCoordinator();

      expect(coord1).not.toBe(coord2);
    });
  });
});
