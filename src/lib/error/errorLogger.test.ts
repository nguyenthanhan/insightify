import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  ErrorLogger,
  ErrorLogEntry,
  ErrorLogEntrySchema,
  getErrorLogger,
  resetErrorLogger,
} from "./errorLogger";

// Arbitrary for generating valid error log entries
const errorLogEntryArbitrary = fc.record({
  id: fc.uuid(),
  timestamp: fc.integer({ min: 0, max: Date.now() + 1000000 }),
  error: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    message: fc.string({ minLength: 1, maxLength: 200 }),
    stack: fc.option(fc.string({ minLength: 0, maxLength: 500 }), {
      nil: undefined,
    }),
  }),
  componentStack: fc.option(fc.string({ minLength: 0, maxLength: 500 }), {
    nil: undefined,
  }),
  context: fc.option(
    fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
    { nil: undefined },
  ),
}) as fc.Arbitrary<ErrorLogEntry>;

describe("ErrorLogger", () => {
  let logger: ErrorLogger;

  beforeEach(() => {
    logger = new ErrorLogger();
    resetErrorLogger();
  });

  describe("log", () => {
    it("should create a log entry with error details", () => {
      const error = new Error("Test error");
      error.name = "TestError";

      const entry = logger.log(error);

      expect(entry.error.name).toBe("TestError");
      expect(entry.error.message).toBe("Test error");
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should include component stack when provided", () => {
      const error = new Error("Test error");
      const errorInfo = { componentStack: "at Component\nat App" };

      const entry = logger.log(error, errorInfo);

      expect(entry.componentStack).toBe("at Component\nat App");
    });

    it("should include context when provided", () => {
      const error = new Error("Test error");
      const context = { userId: "123", action: "submit" };

      const entry = logger.log(error, undefined, context);

      expect(entry.context).toEqual(context);
    });

    it("should add entries in reverse chronological order", () => {
      logger.log(new Error("First"));
      logger.log(new Error("Second"));

      const entries = logger.getEntries();

      expect(entries[0].error.message).toBe("Second");
      expect(entries[1].error.message).toBe("First");
    });

    it("should respect maxEntries limit", () => {
      const limitedLogger = new ErrorLogger({ maxEntries: 3 });

      for (let i = 0; i < 5; i++) {
        limitedLogger.log(new Error(`Error ${i}`));
      }

      expect(limitedLogger.count).toBe(3);
      expect(limitedLogger.getEntries()[0].error.message).toBe("Error 4");
    });
  });

  describe("getEntries", () => {
    it("should return a copy of entries", () => {
      logger.log(new Error("Test"));
      const entries1 = logger.getEntries();
      const entries2 = logger.getEntries();

      expect(entries1).not.toBe(entries2);
      expect(entries1).toEqual(entries2);
    });
  });

  describe("getEntriesByTimeRange", () => {
    it("should filter entries by time range", () => {
      const now = Date.now();

      // Create entries with specific timestamps by manipulating the logger
      const entry1 = logger.log(new Error("Old"));
      const entry2 = logger.log(new Error("Recent"));

      // Filter for recent entries
      const filtered = logger.getEntriesByTimeRange(
        entry1.timestamp,
        entry2.timestamp,
      );

      expect(filtered.length).toBe(2);
    });
  });

  describe("getEntriesByErrorName", () => {
    it("should filter entries by error name", () => {
      const error1 = new Error("Test 1");
      error1.name = "TypeError";
      const error2 = new Error("Test 2");
      error2.name = "RangeError";
      const error3 = new Error("Test 3");
      error3.name = "TypeError";

      logger.log(error1);
      logger.log(error2);
      logger.log(error3);

      const typeErrors = logger.getEntriesByErrorName("TypeError");

      expect(typeErrors.length).toBe(2);
      expect(typeErrors.every((e) => e.error.name === "TypeError")).toBe(true);
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      logger.log(new Error("Test 1"));
      logger.log(new Error("Test 2"));

      logger.clear();

      expect(logger.count).toBe(0);
      expect(logger.getEntries()).toEqual([]);
    });
  });

  /**
   * **Feature: code-optimization, Property 1: Error Log Entry Round-Trip**
   * **Validates: Requirements 1.5**
   *
   * For any valid ErrorLogEntry, serializing to JSON and deserializing back
   * SHALL produce an equivalent ErrorLogEntry with the same id, timestamp,
   * error details, and context.
   */
  describe("Property 1: Error Log Entry Round-Trip", () => {
    it("should round-trip serialize/deserialize entries correctly", () => {
      fc.assert(
        fc.property(
          fc.array(errorLogEntryArbitrary, { minLength: 0, maxLength: 10 }),
          (entries) => {
            const logger = new ErrorLogger();

            // Manually set entries for testing (using loadFromJson)
            const json = JSON.stringify(entries);
            logger.loadFromJson(json);

            // Serialize and deserialize
            const serialized = logger.serialize();
            const deserialized = logger.deserialize(serialized);

            // Verify round-trip
            expect(deserialized.length).toBe(entries.length);

            for (let i = 0; i < entries.length; i++) {
              const original = entries[i];
              const restored = deserialized[i];

              expect(restored.id).toBe(original.id);
              expect(restored.timestamp).toBe(original.timestamp);
              expect(restored.error.name).toBe(original.error.name);
              expect(restored.error.message).toBe(original.error.message);
              expect(restored.error.stack).toBe(original.error.stack);
              expect(restored.componentStack).toBe(original.componentStack);

              if (original.context !== undefined) {
                // JSON.stringify converts -0 to 0, so compare stringified versions
                expect(JSON.stringify(restored.context)).toBe(
                  JSON.stringify(original.context),
                );
              }
            }
          },
        ),
        { numRuns: 50, timeout: 5000 },
      );
    });

    it("should handle empty entries array", () => {
      const serialized = logger.serialize();
      const deserialized = logger.deserialize(serialized);

      expect(deserialized).toEqual([]);
    });

    it("should handle invalid JSON gracefully", () => {
      const deserialized = logger.deserialize("invalid json");
      expect(deserialized).toEqual([]);
    });

    it("should filter out invalid entries during deserialization", () => {
      const mixedData = [
        {
          id: "not-a-uuid",
          timestamp: 123,
          error: { name: "E", message: "M" },
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          timestamp: 123,
          error: { name: "E", message: "M" },
        },
      ];

      const deserialized = logger.deserialize(JSON.stringify(mixedData));

      // Only the valid entry should be included
      expect(deserialized.length).toBe(1);
      expect(deserialized[0].id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("Schema Validation", () => {
    it("should validate correct entries", () => {
      const validEntry: ErrorLogEntry = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: Date.now(),
        error: {
          name: "Error",
          message: "Test message",
          stack: "Error: Test\n  at test.js:1:1",
        },
        componentStack: "at Component",
        context: { key: "value" },
      };

      const result = ErrorLogEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it("should reject invalid entries", () => {
      const invalidEntry = {
        id: "not-a-uuid",
        timestamp: "not-a-number",
        error: { name: 123 },
      };

      const result = ErrorLogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });
  });

  describe("Global Logger", () => {
    it("should return the same instance", () => {
      const logger1 = getErrorLogger();
      const logger2 = getErrorLogger();

      expect(logger1).toBe(logger2);
    });

    it("should reset the global logger", () => {
      const logger1 = getErrorLogger();
      resetErrorLogger();
      const logger2 = getErrorLogger();

      expect(logger1).not.toBe(logger2);
    });
  });
});
