import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  LazyRegistry,
  ChunkConfig,
  ChunkConfigSchema,
  getLazyRegistry,
  resetLazyRegistry,
} from "./lazyLoader";

// Mock component loader
const createMockLoader = () =>
  vi.fn(() => Promise.resolve({ default: () => null }));

// Arbitrary for generating valid chunk configs
const chunkConfigArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  modules: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
    minLength: 1,
    maxLength: 10,
  }),
  priority: fc.integer({ min: 0, max: 100 }),
});

describe("LazyRegistry", () => {
  let registry: LazyRegistry;

  beforeEach(() => {
    registry = new LazyRegistry();
    resetLazyRegistry();
  });

  describe("register", () => {
    it("should register a component", () => {
      const loader = createMockLoader();
      registry.register("TestComponent", { loader });

      expect(registry.has("TestComponent")).toBe(true);
    });

    it("should not overwrite existing registration", () => {
      const loader1 = createMockLoader();
      const loader2 = createMockLoader();

      registry.register("TestComponent", { loader: loader1 });
      registry.register("TestComponent", { loader: loader2 });

      // Should still have original
      expect(registry.has("TestComponent")).toBe(true);
    });

    it("should track chunk config when provided", () => {
      const loader = createMockLoader();
      registry.register("TestComponent", {
        loader,
        chunkName: "test-chunk",
      });

      const configs = registry.getChunkConfigs();
      expect(configs.length).toBe(1);
      expect(configs[0].name).toBe("test-chunk");
    });
  });

  describe("get", () => {
    it("should return registered component", () => {
      const loader = createMockLoader();
      registry.register("TestComponent", { loader });

      const component = registry.get("TestComponent");
      expect(component).not.toBeNull();
    });

    it("should return null from get for unregistered component", () => {
      const component = registry.get("NonExistent");
      expect(component).toBeNull();
    });
  });

  describe("getWithSuspense", () => {
    it("should return wrapped component", () => {
      const loader = createMockLoader();
      registry.register("TestComponent", { loader });

      const WrappedComponent = registry.getWithSuspense("TestComponent");
      expect(WrappedComponent).not.toBeNull();
      expect(WrappedComponent?.displayName).toBe("Lazy(TestComponent)");
    });

    it("should return null from getWithSuspense for unregistered component", () => {
      const component = registry.getWithSuspense("NonExistent");
      expect(component).toBeNull();
    });
  });

  describe("preload", () => {
    it("should call loader when preloading", async () => {
      const loader = createMockLoader();
      registry.register("TestComponent", { loader });

      await registry.preload("TestComponent");

      expect(loader).toHaveBeenCalled();
    });

    it("should not preload twice", async () => {
      const loader = createMockLoader();
      registry.register("TestComponent", { loader });

      await registry.preload("TestComponent");
      await registry.preload("TestComponent");

      expect(loader).toHaveBeenCalledTimes(1);
    });

    it("should auto-preload when configured", () => {
      const loader = createMockLoader();
      registry.register("TestComponent", { loader, preload: true });

      expect(loader).toHaveBeenCalled();
    });
  });

  describe("preloadAll", () => {
    it("should preload all registered components", async () => {
      const loader1 = createMockLoader();
      const loader2 = createMockLoader();

      registry.register("Component1", { loader: loader1 });
      registry.register("Component2", { loader: loader2 });

      await registry.preloadAll();

      expect(loader1).toHaveBeenCalled();
      expect(loader2).toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("should return all registered component names", () => {
      registry.register("A", { loader: createMockLoader() });
      registry.register("B", { loader: createMockLoader() });
      registry.register("C", { loader: createMockLoader() });

      const names = registry.list();
      expect(names).toContain("A");
      expect(names).toContain("B");
      expect(names).toContain("C");
    });
  });

  describe("clear", () => {
    it("should remove all registrations", () => {
      registry.register("A", { loader: createMockLoader() });
      registry.register("B", { loader: createMockLoader() });

      registry.clear();

      expect(registry.list().length).toBe(0);
      expect(registry.getChunkConfigs().length).toBe(0);
    });
  });

  /**
   * **Feature: code-optimization, Property 10: Chunk Config Round-Trip**
   * **Validates: Requirements 2.5**
   *
   * For any valid chunk configuration, serializing and deserializing
   * SHALL produce an equivalent configuration with the same module
   * assignments and priorities.
   */
  describe("Property 10: Chunk Config Round-Trip", () => {
    it("should round-trip serialize/deserialize chunk configs", () => {
      fc.assert(
        fc.property(
          fc.array(chunkConfigArbitrary, { minLength: 0, maxLength: 10 }),
          (configs) => {
            // Serialize
            const json = JSON.stringify(configs);

            // Deserialize
            const deserialized = registry.deserializeChunkConfigs(json);

            // Verify round-trip
            expect(deserialized.length).toBe(configs.length);

            for (let i = 0; i < configs.length; i++) {
              const original = configs[i];
              const restored = deserialized[i];

              expect(restored.name).toBe(original.name);
              expect(restored.modules).toEqual(original.modules);
              expect(restored.priority).toBe(original.priority);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle empty configs array", () => {
      const serialized = registry.serializeChunkConfigs();
      const deserialized = registry.deserializeChunkConfigs(serialized);

      expect(deserialized).toEqual([]);
    });

    it("should handle invalid JSON gracefully", () => {
      const deserialized = registry.deserializeChunkConfigs("invalid json");
      expect(deserialized).toEqual([]);
    });

    it("should filter out invalid configs during deserialization", () => {
      const mixedData = [
        { name: "valid", modules: ["a"], priority: 1 },
        { name: 123, modules: "invalid", priority: "bad" }, // Invalid
        { name: "also-valid", modules: ["b", "c"], priority: 2 },
      ];

      const deserialized = registry.deserializeChunkConfigs(
        JSON.stringify(mixedData)
      );

      expect(deserialized.length).toBe(2);
      expect(deserialized[0].name).toBe("valid");
      expect(deserialized[1].name).toBe("also-valid");
    });
  });

  describe("Schema Validation", () => {
    it("should validate correct chunk config", () => {
      const validConfig: ChunkConfig = {
        name: "test-chunk",
        modules: ["ComponentA", "ComponentB"],
        priority: 1,
      };

      const result = ChunkConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("should reject invalid chunk config", () => {
      const invalidConfig = {
        name: 123, // Should be string
        modules: "not-array", // Should be array
        priority: "high", // Should be number
      };

      const result = ChunkConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("Global Registry", () => {
    it("should return the same instance", () => {
      const reg1 = getLazyRegistry();
      const reg2 = getLazyRegistry();

      expect(reg1).toBe(reg2);
    });

    it("should reset the global registry", () => {
      const reg1 = getLazyRegistry();
      resetLazyRegistry();
      const reg2 = getLazyRegistry();

      expect(reg1).not.toBe(reg2);
    });
  });
});
