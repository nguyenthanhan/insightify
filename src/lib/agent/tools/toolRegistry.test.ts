import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ToolRegistry, createTool } from "./toolRegistry";
import { ToolDefinition, JSONSchema } from "../types";

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  /**
   * **Feature: advanced-ai-agent, Property 7: Tool Parameter Validation**
   * **Validates: Requirements 4.5**
   *
   * For any tool invocation, parameters SHALL be validated against the tool's
   * JSON schema before execution, rejecting invalid parameters.
   */
  it("should validate parameters against schema", () => {
    const tool = createTool(
      "testTool",
      "A test tool",
      {
        type: "object",
        properties: {
          name: { type: "string" },
          count: { type: "integer" },
        },
        required: ["name"],
      },
      async (params) => ({ success: true, data: params })
    );

    registry.register(tool);

    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1 }),
          count: fc.integer(),
        }),
        (params) => {
          const result = registry.validateParams("testTool", params);
          // Valid params should pass validation
          return result.valid === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("should reject invalid parameter types", () => {
    const tool = createTool(
      "typedTool",
      "A typed tool",
      {
        type: "object",
        properties: {
          value: { type: "number" },
        },
        required: ["value"],
      },
      async (params) => ({ success: true, data: params })
    );

    registry.register(tool);

    fc.assert(
      fc.property(fc.string(), (invalidValue) => {
        const result = registry.validateParams("typedTool", {
          value: invalidValue,
        });
        // String should fail number validation
        return result.valid === false;
      }),
      { numRuns: 30 }
    );
  });

  it("should reject missing required parameters", () => {
    const tool = createTool(
      "requiredTool",
      "Tool with required params",
      {
        type: "object",
        properties: {
          required1: { type: "string" },
          required2: { type: "string" },
          optional: { type: "string" },
        },
        required: ["required1", "required2"],
      },
      async (params) => ({ success: true, data: params })
    );

    registry.register(tool);

    // Missing required1
    let result = registry.validateParams("requiredTool", {
      required2: "value",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "required1")).toBe(true);

    // Missing required2
    result = registry.validateParams("requiredTool", { required1: "value" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "required2")).toBe(true);

    // Both present
    result = registry.validateParams("requiredTool", {
      required1: "a",
      required2: "b",
    });
    expect(result.valid).toBe(true);
  });

  describe("registration", () => {
    it("should register a tool", () => {
      const tool = createTool(
        "myTool",
        "Description",
        { type: "object", properties: {} },
        async () => ({ success: true })
      );

      registry.register(tool);
      expect(registry.has("myTool")).toBe(true);
      expect(registry.get("myTool")).toEqual(tool);
    });

    it("should throw on duplicate registration", () => {
      const tool = createTool(
        "duplicate",
        "Description",
        { type: "object", properties: {} },
        async () => ({ success: true })
      );

      registry.register(tool);
      expect(() => registry.register(tool)).toThrow("already registered");
    });

    it("should unregister a tool", () => {
      const tool = createTool(
        "toRemove",
        "Description",
        { type: "object", properties: {} },
        async () => ({ success: true })
      );

      registry.register(tool);
      expect(registry.unregister("toRemove")).toBe(true);
      expect(registry.has("toRemove")).toBe(false);
    });

    it("should list all tools", () => {
      registry.register(
        createTool(
          "tool1",
          "Desc 1",
          { type: "object", properties: {} },
          async () => ({ success: true })
        )
      );
      registry.register(
        createTool(
          "tool2",
          "Desc 2",
          { type: "object", properties: {} },
          async () => ({ success: true })
        )
      );

      const tools = registry.list();
      expect(tools).toHaveLength(2);
      expect(registry.listNames()).toEqual(["tool1", "tool2"]);
    });
  });

  describe("execution", () => {
    it("should execute a tool successfully", async () => {
      const tool = createTool(
        "adder",
        "Adds two numbers",
        {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" },
          },
          required: ["a", "b"],
        },
        async (params) => ({
          success: true,
          data: (params.a as number) + (params.b as number),
        })
      );

      registry.register(tool);
      const result = await registry.execute("adder", { a: 5, b: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toBe(8);
    });

    it("should return error for unknown tool", async () => {
      const result = await registry.execute("unknown", {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should return error for invalid params", async () => {
      const tool = createTool(
        "strictTool",
        "Strict params",
        {
          type: "object",
          properties: {
            value: { type: "number" },
          },
          required: ["value"],
        },
        async (params) => ({ success: true, data: params })
      );

      registry.register(tool);
      const result = await registry.execute("strictTool", {
        value: "not a number",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid parameters");
    });

    it("should handle handler errors", async () => {
      const tool = createTool(
        "errorTool",
        "Throws error",
        { type: "object", properties: {} },
        async () => {
          throw new Error("Handler failed");
        }
      );

      registry.register(tool);
      const result = await registry.execute("errorTool", {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Handler failed");
    });
  });

  describe("enum validation", () => {
    it("should validate enum values", () => {
      const tool = createTool(
        "enumTool",
        "Tool with enum",
        {
          type: "object",
          properties: {
            status: { type: "string", enum: ["active", "inactive", "pending"] },
          },
          required: ["status"],
        },
        async (params) => ({ success: true, data: params })
      );

      registry.register(tool);

      // Valid enum value
      let result = registry.validateParams("enumTool", { status: "active" });
      expect(result.valid).toBe(true);

      // Invalid enum value
      result = registry.validateParams("enumTool", { status: "unknown" });
      expect(result.valid).toBe(false);
    });
  });
});
