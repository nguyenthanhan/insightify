import { ChartData, TableData, InsightData, MessageType } from "@/types/agent";
import { ValidationResult, ValidationError } from "../types";

export interface ParsedResponse {
  type: MessageType;
  content: string;
  data?: ChartData | TableData | InsightData;
  confidence: number;
}

export interface ParserConfig {
  strictMode: boolean;
  fallbackType: MessageType;
}

const DEFAULT_CONFIG: ParserConfig = {
  strictMode: false,
  fallbackType: "text",
};

export class MessageParser {
  private config: ParserConfig;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  parse(rawResponse: string): ParsedResponse {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(rawResponse);
      return this.parseStructured(parsed);
    } catch {
      // If not JSON, treat as plain text
      return this.parseText(rawResponse);
    }
  }

  private parseStructured(data: unknown): ParsedResponse {
    if (!data || typeof data !== "object") {
      return this.createTextResponse(String(data));
    }

    const obj = data as Record<string, unknown>;

    // Check for explicit type field
    if (obj.type && typeof obj.type === "string") {
      const type = obj.type as MessageType;
      const content = typeof obj.content === "string" ? obj.content : "";

      switch (type) {
        case "chart":
          return this.parseChartResponse(obj, content);
        case "table":
          return this.parseTableResponse(obj, content);
        case "insight":
          return this.parseInsightResponse(obj, content);
        case "error":
          return { type: "error", content, confidence: 100 };
        default:
          return { type: "text", content, confidence: 90 };
      }
    }

    // Try to infer type from structure
    if (this.isChartData(obj)) {
      return this.parseChartResponse(obj, (obj.content as string) || "");
    }
    if (this.isTableData(obj)) {
      return this.parseTableResponse(obj, (obj.content as string) || "");
    }
    if (this.isInsightData(obj)) {
      return this.parseInsightResponse(obj, (obj.content as string) || "");
    }

    // Default to text
    return this.createTextResponse(
      (obj.content as string) || JSON.stringify(obj)
    );
  }

  private parseText(text: string): ParsedResponse {
    return this.createTextResponse(text.trim());
  }

  private createTextResponse(content: string): ParsedResponse {
    return {
      type: "text",
      content,
      confidence: 100,
    };
  }

  private parseChartResponse(
    obj: Record<string, unknown>,
    content: string
  ): ParsedResponse {
    const chartData = (obj.data as Record<string, unknown>) || obj;

    const data: ChartData = {
      title: (chartData.title as string) || "Chart",
      data: Array.isArray(chartData.data) ? chartData.data : [],
      chartType: (chartData.chartType as ChartData["chartType"]) || "line",
      xKey: (chartData.xKey as string) || "x",
      yKey: (chartData.yKey as string) || "y",
    };

    return {
      type: "chart",
      content,
      data,
      confidence: 85,
    };
  }

  private parseTableResponse(
    obj: Record<string, unknown>,
    content: string
  ): ParsedResponse {
    const tableData = (obj.data as Record<string, unknown>) || obj;

    const data: TableData = {
      title: (tableData.title as string) || "Table",
      headers: Array.isArray(tableData.headers) ? tableData.headers : [],
      rows: Array.isArray(tableData.rows) ? tableData.rows : [],
    };

    return {
      type: "table",
      content,
      data,
      confidence: 85,
    };
  }

  private parseInsightResponse(
    obj: Record<string, unknown>,
    content: string
  ): ParsedResponse {
    const insightData = (obj.data as Record<string, unknown>) || obj;

    const data: InsightData = {
      title: (insightData.title as string) || "Insight",
      description: (insightData.description as string) || "",
      icon: insightData.icon as string | undefined,
      severity: (insightData.severity as InsightData["severity"]) || "info",
    };

    return {
      type: "insight",
      content,
      data,
      confidence: 85,
    };
  }

  private isChartData(obj: Record<string, unknown>): boolean {
    const data = (obj.data as Record<string, unknown>) || obj;
    return (
      "chartType" in data ||
      ("data" in data && Array.isArray(data.data) && "xKey" in data)
    );
  }

  private isTableData(obj: Record<string, unknown>): boolean {
    const data = (obj.data as Record<string, unknown>) || obj;
    return "headers" in data && "rows" in data;
  }

  private isInsightData(obj: Record<string, unknown>): boolean {
    const data = (obj.data as Record<string, unknown>) || obj;
    return "description" in data && ("severity" in data || "icon" in data);
  }

  validate(response: ParsedResponse): ValidationResult {
    const errors: ValidationError[] = [];

    if (!response.type) {
      errors.push({
        path: "type",
        message: "Type is required",
        code: "REQUIRED",
      });
    }

    if (typeof response.content !== "string") {
      errors.push({
        path: "content",
        message: "Content must be a string",
        code: "INVALID_TYPE",
      });
    }

    if (response.confidence < 0 || response.confidence > 100) {
      errors.push({
        path: "confidence",
        message: "Confidence must be between 0 and 100",
        code: "OUT_OF_RANGE",
      });
    }

    // Validate data based on type
    if (response.data) {
      const dataErrors = this.validateData(response.type, response.data);
      errors.push(...dataErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateData(
    type: MessageType,
    data: ChartData | TableData | InsightData
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (type) {
      case "chart": {
        const chartData = data as ChartData;
        if (!chartData.title) {
          errors.push({
            path: "data.title",
            message: "Chart title is required",
            code: "REQUIRED",
          });
        }
        if (!Array.isArray(chartData.data)) {
          errors.push({
            path: "data.data",
            message: "Chart data must be an array",
            code: "INVALID_TYPE",
          });
        }
        break;
      }
      case "table": {
        const tableData = data as TableData;
        if (!Array.isArray(tableData.headers)) {
          errors.push({
            path: "data.headers",
            message: "Table headers must be an array",
            code: "INVALID_TYPE",
          });
        }
        if (!Array.isArray(tableData.rows)) {
          errors.push({
            path: "data.rows",
            message: "Table rows must be an array",
            code: "INVALID_TYPE",
          });
        }
        break;
      }
      case "insight": {
        const insightData = data as InsightData;
        if (!insightData.title) {
          errors.push({
            path: "data.title",
            message: "Insight title is required",
            code: "REQUIRED",
          });
        }
        break;
      }
    }

    return errors;
  }

  serialize(response: ParsedResponse): string {
    return JSON.stringify({
      type: response.type,
      content: response.content,
      data: response.data,
      confidence: response.confidence,
    });
  }

  deserialize(data: string): ParsedResponse {
    try {
      const parsed = JSON.parse(data);

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid data format");
      }

      return {
        type: parsed.type || this.config.fallbackType,
        content: parsed.content || "",
        data: parsed.data,
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : 0,
      };
    } catch (error) {
      if (this.config.strictMode) {
        throw error;
      }
      return {
        type: this.config.fallbackType,
        content: data,
        confidence: 0,
      };
    }
  }
}

export const messageParser = new MessageParser();
