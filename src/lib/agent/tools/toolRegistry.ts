import {
  ToolDefinition,
  ToolResult,
  ToolHandler,
  JSONSchema,
  ValidationResult,
  ValidationError,
} from "../types";

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  listNames(): string[] {
    return Array.from(this.tools.keys());
  }

  async execute(
    name: string,
    params: Record<string, unknown>
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
      };
    }

    // Validate parameters
    const validation = this.validateParams(name, params);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid parameters: ${validation.errors
          .map((e) => e.message)
          .join(", ")}`,
      };
    }

    try {
      return await tool.handler(params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  validateParams(
    name: string,
    params: Record<string, unknown>
  ): ValidationResult {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        valid: false,
        errors: [
          { path: "", message: `Tool "${name}" not found`, code: "NOT_FOUND" },
        ],
      };
    }

    return this.validateAgainstSchema(params, tool.parameters);
  }

  private validateAgainstSchema(
    data: Record<string, unknown>,
    schema: JSONSchema
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] === undefined) {
          errors.push({
            path: field,
            message: `Required field "${field}" is missing`,
            code: "REQUIRED",
          });
        }
      }
    }

    // Check property types
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          const value = data[key];
          const propErrors = this.validateValue(
            key,
            value,
            propSchema as JSONSchema
          );
          errors.push(...propErrors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateValue(
    path: string,
    value: unknown,
    schema: JSONSchema
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type checking
    if (schema.type) {
      const actualType = this.getType(value);
      if (schema.type !== actualType) {
        // Allow number for integer type
        if (
          !(
            schema.type === "integer" &&
            actualType === "number" &&
            Number.isInteger(value)
          )
        ) {
          errors.push({
            path,
            message: `Expected ${schema.type}, got ${actualType}`,
            code: "TYPE_MISMATCH",
          });
        }
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(", ")}`,
        code: "ENUM_MISMATCH",
      });
    }

    // Array items validation
    if (schema.type === "array" && Array.isArray(value) && schema.items) {
      value.forEach((item, index) => {
        const itemErrors = this.validateValue(
          `${path}[${index}]`,
          item,
          schema.items!
        );
        errors.push(...itemErrors);
      });
    }

    // Object properties validation
    if (
      schema.type === "object" &&
      typeof value === "object" &&
      value !== null &&
      schema.properties
    ) {
      const objErrors = this.validateAgainstSchema(
        value as Record<string, unknown>,
        schema
      );
      errors.push(...objErrors.errors);
    }

    return errors;
  }

  private getType(value: unknown): string {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  }

  clear(): void {
    this.tools.clear();
  }
}

export const toolRegistry = new ToolRegistry();

// Helper to create tool definitions
export function createTool(
  name: string,
  description: string,
  parameters: JSONSchema,
  handler: ToolHandler
): ToolDefinition {
  return { name, description, parameters, handler };
}
