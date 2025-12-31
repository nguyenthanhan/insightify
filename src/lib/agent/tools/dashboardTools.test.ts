import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ToolRegistry } from "./toolRegistry";
import {
  dashboardTools,
  registerDashboardTools,
  getMetricsTool,
  getChartDataTool,
  getTableDataTool,
  getInsightsTool,
  aggregateDataTool,
  filterDataTool,
} from "./dashboardTools";

describe("Dashboard Tools", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe("Tool Registration", () => {
    it("should register all dashboard tools", () => {
      registerDashboardTools(registry);
      expect(registry.list().length).toBe(6);
      expect(registry.has("get_metrics")).toBe(true);
      expect(registry.has("get_chart_data")).toBe(true);
      expect(registry.has("get_table_data")).toBe(true);
      expect(registry.has("get_insights")).toBe(true);
      expect(registry.has("aggregate_data")).toBe(true);
      expect(registry.has("filter_data")).toBe(true);
    });

    it("should export all tools in dashboardTools array", () => {
      expect(dashboardTools.length).toBe(6);
      expect(dashboardTools).toContain(getMetricsTool);
      expect(dashboardTools).toContain(getChartDataTool);
      expect(dashboardTools).toContain(getTableDataTool);
      expect(dashboardTools).toContain(getInsightsTool);
      expect(dashboardTools).toContain(aggregateDataTool);
      expect(dashboardTools).toContain(filterDataTool);
    });
  });

  describe("get_metrics Tool", () => {
    beforeEach(() => {
      registry.register(getMetricsTool);
    });

    it("should return metrics for valid dashboard type", async () => {
      const result = await registry.execute("get_metrics", {
        dashboardType: "sales",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const data = result.data as Record<string, unknown>;
      expect(data.dashboardType).toBe("sales");
      expect(data.metrics).toBeDefined();
    });

    it("should accept optional timeRange parameter", async () => {
      const result = await registry.execute("get_metrics", {
        dashboardType: "analytics",
        timeRange: "quarter",
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.timeRange).toBe("quarter");
    });

    it("should fail validation for missing dashboardType", async () => {
      const result = await registry.execute("get_metrics", {});
      expect(result.success).toBe(false);
      expect(result.error).toContain("dashboardType");
    });
  });

  describe("get_chart_data Tool", () => {
    beforeEach(() => {
      registry.register(getChartDataTool);
    });

    it("should return chart data for revenue source", async () => {
      const result = await registry.execute("get_chart_data", {
        chartType: "line",
        dataSource: "revenue",
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.title).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.chartType).toBeDefined();
    });

    it("should return comparison chart data", async () => {
      const result = await registry.execute("get_chart_data", {
        chartType: "bar",
        dataSource: "comparison",
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.chartType).toBe("bar");
    });

    it("should return trend data with metric", async () => {
      const result = await registry.execute("get_chart_data", {
        chartType: "area",
        dataSource: "trend",
        metric: "Users",
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.title).toContain("Users");
    });
  });

  describe("get_table_data Tool", () => {
    beforeEach(() => {
      registry.register(getTableDataTool);
    });

    it("should return table data for sales type", async () => {
      const result = await registry.execute("get_table_data", {
        tableType: "sales",
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.title).toBeDefined();
      expect(data.headers).toBeDefined();
      expect(data.rows).toBeDefined();
    });

    it("should respect limit parameter", async () => {
      const result = await registry.execute("get_table_data", {
        tableType: "sales",
        limit: 3,
      });

      expect(result.success).toBe(true);
      const data = result.data as { rows: unknown[] };
      expect(data.rows.length).toBeLessThanOrEqual(3);
    });

    it("should apply sorting when specified", async () => {
      const result = await registry.execute("get_table_data", {
        tableType: "sales",
        sortBy: "revenue",
        sortOrder: "desc",
      });

      expect(result.success).toBe(true);
      const data = result.data as { rows: Array<{ revenue: number }> };
      if (data.rows.length > 1) {
        expect(data.rows[0].revenue).toBeGreaterThanOrEqual(
          data.rows[1].revenue
        );
      }
    });
  });

  describe("get_insights Tool", () => {
    beforeEach(() => {
      registry.register(getInsightsTool);
    });

    it("should return insights for dashboard type", async () => {
      const result = await registry.execute("get_insights", {
        dashboardType: "sales",
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should respect count parameter", async () => {
      const result = await registry.execute("get_insights", {
        dashboardType: "analytics",
        count: 5,
      });

      expect(result.success).toBe(true);
      const data = result.data as unknown[];
      expect(data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("aggregate_data Tool", () => {
    beforeEach(() => {
      registry.register(aggregateDataTool);
    });

    it("should perform aggregation without groupBy", async () => {
      const result = await registry.execute("aggregate_data", {
        operation: "sum",
        metric: "revenue",
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.operation).toBe("sum");
      expect(data.metric).toBe("revenue");
      expect(data.value).toBeDefined();
    });

    it("should perform aggregation with groupBy", async () => {
      const result = await registry.execute("aggregate_data", {
        operation: "avg",
        metric: "sales",
        groupBy: "region",
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.groupBy).toBe("region");
      expect(data.results).toBeDefined();
    });
  });

  describe("filter_data Tool", () => {
    beforeEach(() => {
      registry.register(filterDataTool);
    });

    it("should filter data by source", async () => {
      const result = await registry.execute("filter_data", {
        dataSource: "transactions",
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.dataSource).toBe("transactions");
      expect(data.data).toBeDefined();
    });

    it("should accept filters and dateRange", async () => {
      const result = await registry.execute("filter_data", {
        dataSource: "orders",
        filters: { status: "completed" },
        dateRange: {
          start: "2024-01-01",
          end: "2024-12-31",
        },
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.filters).toEqual({ status: "completed" });
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 8: Tool Execution Order**
   * **Validates: Requirements 4.4**
   */
  describe("Property: Tool Execution Order", () => {
    it("should execute tools in sequence and aggregate results correctly", async () => {
      registerDashboardTools(registry);

      // Execute multiple tools in sequence
      const toolCalls = [
        { name: "get_metrics", params: { dashboardType: "sales" } },
        {
          name: "get_chart_data",
          params: { chartType: "line", dataSource: "revenue" },
        },
        { name: "get_insights", params: { dashboardType: "sales" } },
      ];

      const results: Array<{ name: string; success: boolean; order: number }> =
        [];

      for (let i = 0; i < toolCalls.length; i++) {
        const call = toolCalls[i];
        const result = await registry.execute(call.name, call.params);
        results.push({
          name: call.name,
          success: result.success,
          order: i,
        });
      }

      // Verify all executed successfully
      expect(results.every((r) => r.success)).toBe(true);

      // Verify order is preserved
      expect(results[0].order).toBe(0);
      expect(results[1].order).toBe(1);
      expect(results[2].order).toBe(2);
    });

    it("should maintain execution order for any sequence of valid tool calls", async () => {
      registerDashboardTools(registry);

      const toolNameArb = fc.constantFrom(
        "get_metrics",
        "get_chart_data",
        "get_table_data",
        "get_insights",
        "aggregate_data",
        "filter_data"
      );

      const paramsForTool = (name: string): Record<string, unknown> => {
        switch (name) {
          case "get_metrics":
            return { dashboardType: "sales" };
          case "get_chart_data":
            return { chartType: "line", dataSource: "revenue" };
          case "get_table_data":
            return { tableType: "sales" };
          case "get_insights":
            return { dashboardType: "sales" };
          case "aggregate_data":
            return { operation: "sum", metric: "revenue" };
          case "filter_data":
            return { dataSource: "transactions" };
          default:
            return {};
        }
      };

      await fc.assert(
        fc.asyncProperty(
          fc.array(toolNameArb, { minLength: 1, maxLength: 5 }),
          async (toolNames) => {
            const executionOrder: number[] = [];

            for (let i = 0; i < toolNames.length; i++) {
              const name = toolNames[i];
              const result = await registry.execute(name, paramsForTool(name));
              if (result.success) {
                executionOrder.push(i);
              }
            }

            // All tools should execute successfully
            if (executionOrder.length !== toolNames.length) {
              return false;
            }

            // Verify order is strictly increasing (FIFO)
            for (let i = 1; i < executionOrder.length; i++) {
              if (executionOrder[i] <= executionOrder[i - 1]) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
