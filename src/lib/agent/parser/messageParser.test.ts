import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { MessageParser, ParsedResponse } from "./messageParser";
import { parsedResponseArb, textParsedResponseArb } from "@/test/arbitraries";

describe("MessageParser", () => {
  const parser = new MessageParser();

  /**
   * **Feature: advanced-ai-agent, Property 1: Message Parser Round-Trip**
   * **Validates: Requirements 1.5**
   *
   * For any valid ParsedResponse, serializing it to string and then
   * deserializing SHALL produce an equivalent ParsedResponse object.
   */
  it("should round-trip any valid ParsedResponse", () => {
    fc.assert(
      fc.property(parsedResponseArb, (response) => {
        const serialized = parser.serialize(response);
        const deserialized = parser.deserialize(serialized);

        expect(deserialized.type).toBe(response.type);
        expect(deserialized.content).toBe(response.content);
        expect(deserialized.confidence).toBe(response.confidence);

        if (response.data) {
          expect(deserialized.data).toEqual(response.data);
        }
      }),
      { numRuns: 100 }
    );
  });

  describe("parse", () => {
    it("should parse plain text as text type", () => {
      const result = parser.parse("Hello, world!");
      expect(result.type).toBe("text");
      expect(result.content).toBe("Hello, world!");
      expect(result.confidence).toBe(100);
    });

    it("should parse JSON with explicit type", () => {
      const input = JSON.stringify({
        type: "text",
        content: "Test message",
      });
      const result = parser.parse(input);
      expect(result.type).toBe("text");
      expect(result.content).toBe("Test message");
    });

    it("should parse chart response", () => {
      const input = JSON.stringify({
        type: "chart",
        content: "Here is your chart",
        data: {
          title: "Sales Chart",
          data: [{ x: "Jan", y: 100 }],
          chartType: "line",
          xKey: "x",
          yKey: "y",
        },
      });
      const result = parser.parse(input);
      expect(result.type).toBe("chart");
      expect(result.data).toBeDefined();
      expect((result.data as any).title).toBe("Sales Chart");
    });

    it("should parse table response", () => {
      const input = JSON.stringify({
        type: "table",
        content: "Here is your table",
        data: {
          title: "Sales Table",
          headers: ["Name", "Value"],
          rows: [{ Name: "Item 1", Value: 100 }],
        },
      });
      const result = parser.parse(input);
      expect(result.type).toBe("table");
      expect(result.data).toBeDefined();
      expect((result.data as any).headers).toEqual(["Name", "Value"]);
    });

    it("should parse insight response", () => {
      const input = JSON.stringify({
        type: "insight",
        content: "Here is an insight",
        data: {
          title: "Key Insight",
          description: "Sales are up 20%",
          severity: "success",
        },
      });
      const result = parser.parse(input);
      expect(result.type).toBe("insight");
      expect(result.data).toBeDefined();
      expect((result.data as any).severity).toBe("success");
    });

    it("should handle malformed JSON gracefully", () => {
      const result = parser.parse("{ invalid json }");
      expect(result.type).toBe("text");
      expect(result.content).toBe("{ invalid json }");
    });
  });

  describe("validate", () => {
    it("should validate a correct text response", () => {
      const response: ParsedResponse = {
        type: "text",
        content: "Hello",
        confidence: 100,
      };
      const result = parser.validate(response);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject confidence out of range", () => {
      const response: ParsedResponse = {
        type: "text",
        content: "Hello",
        confidence: 150,
      };
      const result = parser.validate(response);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "OUT_OF_RANGE")).toBe(true);
    });

    it("should validate chart data structure", () => {
      const response: ParsedResponse = {
        type: "chart",
        content: "Chart",
        confidence: 85,
        data: {
          title: "Test",
          data: [],
          chartType: "line",
          xKey: "x",
          yKey: "y",
        },
      };
      const result = parser.validate(response);
      expect(result.valid).toBe(true);
    });
  });

  describe("serialize/deserialize", () => {
    it("should serialize to valid JSON", () => {
      const response: ParsedResponse = {
        type: "text",
        content: "Hello",
        confidence: 100,
      };
      const serialized = parser.serialize(response);
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    it("should deserialize valid JSON", () => {
      const json = JSON.stringify({
        type: "text",
        content: "Hello",
        confidence: 100,
      });
      const result = parser.deserialize(json);
      expect(result.type).toBe("text");
      expect(result.content).toBe("Hello");
    });

    it("should handle invalid JSON in non-strict mode", () => {
      const parser = new MessageParser({ strictMode: false });
      const result = parser.deserialize("invalid json");
      expect(result.type).toBe("text");
      expect(result.content).toBe("invalid json");
    });

    it("should throw on invalid JSON in strict mode", () => {
      const parser = new MessageParser({ strictMode: true });
      expect(() => parser.deserialize("invalid json")).toThrow();
    });
  });
});
