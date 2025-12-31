import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  AppConfig,
  AppConfigSchema,
  ConfigSerializer,
  DEFAULT_CONFIG,
  getConfig,
  setConfig,
  resetConfig,
} from "./constants";

// Arbitrary for generating valid app configs
const apiConfigArbitrary = fc.record({
  baseUrl: fc.webUrl(),
  timeout: fc.integer({ min: 1, max: 120000 }),
  retryAttempts: fc.integer({ min: 0, max: 10 }),
});

const featureFlagsArbitrary = fc.record({
  enableAI: fc.boolean(),
  enableExport: fc.boolean(),
  enableThemes: fc.boolean(),
  enableVirtualization: fc.boolean(),
  enableErrorBoundaries: fc.boolean(),
});

const performanceConfigArbitrary = fc.record({
  virtualizationThreshold: fc.integer({ min: 1, max: 1000 }),
  lazyLoadDelay: fc.integer({ min: 0, max: 5000 }),
  skeletonMinDuration: fc.integer({ min: 0, max: 5000 }),
  memoizationCacheSize: fc.integer({ min: 1, max: 10000 }),
});

const appConfigArbitrary = fc.record({
  api: apiConfigArbitrary,
  features: featureFlagsArbitrary,
  performance: performanceConfigArbitrary,
});

describe("ConfigSerializer", () => {
  let serializer: ConfigSerializer;

  beforeEach(() => {
    serializer = new ConfigSerializer();
    resetConfig();
  });

  describe("serialize", () => {
    it("should serialize config to JSON string", () => {
      const json = serializer.serialize(DEFAULT_CONFIG);
      expect(typeof json).toBe("string");
      expect(JSON.parse(json)).toEqual(DEFAULT_CONFIG);
    });
  });

  describe("deserialize", () => {
    it("should deserialize valid JSON to config", () => {
      const json = JSON.stringify(DEFAULT_CONFIG);
      const config = serializer.deserialize(json);
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it("should return null for invalid JSON", () => {
      const config = serializer.deserialize("invalid json");
      expect(config).toBeNull();
    });

    it("should return null for invalid config structure", () => {
      const invalidConfig = { api: { baseUrl: "not-a-url" } };
      const config = serializer.deserialize(JSON.stringify(invalidConfig));
      expect(config).toBeNull();
    });
  });

  describe("validate", () => {
    it("should return true for valid config", () => {
      expect(serializer.validate(DEFAULT_CONFIG)).toBe(true);
    });

    it("should return false for invalid config", () => {
      expect(serializer.validate({ invalid: true })).toBe(false);
    });
  });

  describe("merge", () => {
    it("should merge partial config with defaults", () => {
      const partial = {
        api: { timeout: 60000 },
      };

      const merged = serializer.merge(partial as Partial<AppConfig>);

      expect(merged.api.timeout).toBe(60000);
      expect(merged.api.baseUrl).toBe(DEFAULT_CONFIG.api.baseUrl);
      expect(merged.features).toEqual(DEFAULT_CONFIG.features);
    });
  });

  /**
   * **Feature: code-optimization, Property 3: Configuration Round-Trip**
   * **Validates: Requirements 7.5**
   *
   * For any valid AppConfig, serializing to JSON and deserializing back
   * SHALL produce an equivalent configuration object.
   */
  describe("Property 3: Configuration Round-Trip", () => {
    it("should round-trip serialize/deserialize configs correctly", () => {
      fc.assert(
        fc.property(appConfigArbitrary, (config) => {
          const serialized = serializer.serialize(config);
          const deserialized = serializer.deserialize(serialized);

          expect(deserialized).not.toBeNull();
          expect(deserialized?.api.baseUrl).toBe(config.api.baseUrl);
          expect(deserialized?.api.timeout).toBe(config.api.timeout);
          expect(deserialized?.api.retryAttempts).toBe(
            config.api.retryAttempts
          );
          expect(deserialized?.features).toEqual(config.features);
          expect(deserialized?.performance).toEqual(config.performance);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: code-optimization, Property 4: Zod Schema Validation Correctness**
   * **Validates: Requirements 5.5**
   *
   * For any data that conforms to a Zod schema definition, validation SHALL pass.
   * For any data that violates the schema, validation SHALL fail.
   */
  describe("Property 4: Zod Schema Validation Correctness", () => {
    it("should accept all valid configs", () => {
      fc.assert(
        fc.property(appConfigArbitrary, (config) => {
          const result = AppConfigSchema.safeParse(config);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should reject configs with invalid api.baseUrl", () => {
      // Test specific invalid URLs that are definitely not valid URLs
      // Note: Zod's url() validator accepts many URL schemes, so we test truly invalid formats
      const invalidUrls = ["not-a-url", "just-text", "123", ""];

      for (const invalidUrl of invalidUrls) {
        const config = {
          ...DEFAULT_CONFIG,
          api: { ...DEFAULT_CONFIG.api, baseUrl: invalidUrl },
        };
        const result = AppConfigSchema.safeParse(config);
        expect(result.success).toBe(false);
      }
    });

    it("should reject configs with negative timeout", () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: -1 }), (negativeTimeout) => {
          const config = {
            ...DEFAULT_CONFIG,
            api: { ...DEFAULT_CONFIG.api, timeout: negativeTimeout },
          };
          const result = AppConfigSchema.safeParse(config);
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it("should reject configs with retryAttempts > 10", () => {
      fc.assert(
        fc.property(fc.integer({ min: 11, max: 100 }), (tooManyRetries) => {
          const config = {
            ...DEFAULT_CONFIG,
            api: { ...DEFAULT_CONFIG.api, retryAttempts: tooManyRetries },
          };
          const result = AppConfigSchema.safeParse(config);
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 }
      );
    });
  });
});

describe("Config Functions", () => {
  beforeEach(() => {
    resetConfig();
  });

  describe("getConfig", () => {
    it("should return current config", () => {
      const config = getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it("should return a copy, not the original", () => {
      const config1 = getConfig();
      const config2 = getConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe("setConfig", () => {
    it("should update config", () => {
      setConfig({ api: { timeout: 60000 } } as Partial<AppConfig>);
      const config = getConfig();
      expect(config.api.timeout).toBe(60000);
    });

    it("should preserve unset values", () => {
      setConfig({ features: { enableAI: false } } as Partial<AppConfig>);
      const config = getConfig();
      expect(config.features.enableAI).toBe(false);
      expect(config.features.enableExport).toBe(true);
    });
  });

  describe("resetConfig", () => {
    it("should reset to defaults", () => {
      setConfig({ api: { timeout: 60000 } } as Partial<AppConfig>);
      resetConfig();
      const config = getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });
});

describe("Schema Validation", () => {
  it("should validate DEFAULT_CONFIG", () => {
    const result = AppConfigSchema.safeParse(DEFAULT_CONFIG);
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const incomplete = { api: {} };
    const result = AppConfigSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("should reject wrong types", () => {
    const wrongTypes = {
      api: {
        baseUrl: 123, // Should be string
        timeout: "fast", // Should be number
        retryAttempts: true, // Should be number
      },
      features: {},
      performance: {},
    };
    const result = AppConfigSchema.safeParse(wrongTypes);
    expect(result.success).toBe(false);
  });
});
