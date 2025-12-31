import { ToolDefinition, ToolResult, JSONSchema } from "../types";
import {
  DashboardType,
  ChartData,
  TableData,
  InsightData,
} from "@/types/agent";
import {
  generateMockRevenueForecast,
  generateMockSalesTable,
  generateMockInsight,
  generateMockTrendData,
  generateMockComparison,
} from "../mockData";

// ============ Tool Schemas ============

const getMetricsSchema: JSONSchema = {
  type: "object",
  properties: {
    dashboardType: {
      type: "string",
      enum: [
        "sales",
        "analytics",
        "financial",
        "operations",
        "hr",
        "ecommerce",
      ],
      description: "The type of dashboard to get metrics for",
    },
    metricNames: {
      type: "array",
      items: { type: "string" },
      description: "Optional list of specific metric names to retrieve",
    },
    timeRange: {
      type: "string",
      enum: ["day", "week", "month", "quarter", "year"],
      description: "Time range for the metrics",
    },
  },
  required: ["dashboardType"],
};

const getChartDataSchema: JSONSchema = {
  type: "object",
  properties: {
    chartType: {
      type: "string",
      enum: ["line", "bar", "pie", "area", "funnel", "gauge"],
      description: "Type of chart to generate data for",
    },
    dataSource: {
      type: "string",
      enum: ["revenue", "sales", "users", "conversion", "comparison", "trend"],
      description: "The data source for the chart",
    },
    metric: {
      type: "string",
      description: "Specific metric name for trend charts",
    },
  },
  required: ["chartType", "dataSource"],
};

const getTableDataSchema: JSONSchema = {
  type: "object",
  properties: {
    tableType: {
      type: "string",
      enum: ["sales", "products", "users", "transactions", "performance"],
      description: "Type of table data to retrieve",
    },
    limit: {
      type: "integer",
      description: "Maximum number of rows to return",
    },
    sortBy: {
      type: "string",
      description: "Column to sort by",
    },
    sortOrder: {
      type: "string",
      enum: ["asc", "desc"],
      description: "Sort order",
    },
  },
  required: ["tableType"],
};

const getInsightsSchema: JSONSchema = {
  type: "object",
  properties: {
    dashboardType: {
      type: "string",
      enum: [
        "sales",
        "analytics",
        "financial",
        "operations",
        "hr",
        "ecommerce",
      ],
      description: "Dashboard type to get insights for",
    },
    count: {
      type: "integer",
      description: "Number of insights to retrieve",
    },
    severity: {
      type: "string",
      enum: ["info", "warning", "success", "error"],
      description: "Filter by severity level",
    },
  },
  required: ["dashboardType"],
};

const aggregateDataSchema: JSONSchema = {
  type: "object",
  properties: {
    operation: {
      type: "string",
      enum: ["sum", "avg", "min", "max", "count"],
      description: "Aggregation operation to perform",
    },
    metric: {
      type: "string",
      description: "Metric to aggregate",
    },
    groupBy: {
      type: "string",
      description: "Field to group by",
    },
    filters: {
      type: "object",
      description: "Filters to apply before aggregation",
    },
  },
  required: ["operation", "metric"],
};

const filterDataSchema: JSONSchema = {
  type: "object",
  properties: {
    dataSource: {
      type: "string",
      description: "Data source to filter",
    },
    filters: {
      type: "object",
      description: "Filter conditions as key-value pairs",
    },
    dateRange: {
      type: "object",
      properties: {
        start: { type: "string", description: "Start date (ISO format)" },
        end: { type: "string", description: "End date (ISO format)" },
      },
    },
  },
  required: ["dataSource"],
};

// ============ Tool Handlers ============

async function handleGetMetrics(
  params: Record<string, unknown>
): Promise<ToolResult> {
  const dashboardType = params.dashboardType as DashboardType;
  const timeRange = (params.timeRange as string) || "month";

  // Generate mock metrics based on dashboard type
  const metrics = generateMetricsForDashboard(dashboardType, timeRange);

  return {
    success: true,
    data: metrics,
  };
}

async function handleGetChartData(
  params: Record<string, unknown>
): Promise<ToolResult> {
  const dataSource = params.dataSource as string;
  const metric = params.metric as string;

  let chartData: ChartData;

  switch (dataSource) {
    case "revenue":
      chartData = generateMockRevenueForecast();
      break;
    case "comparison":
      chartData = generateMockComparison();
      break;
    case "trend":
      chartData = generateMockTrendData(metric || "Revenue");
      break;
    default:
      chartData = generateMockTrendData(dataSource);
  }

  return {
    success: true,
    data: chartData,
  };
}

async function handleGetTableData(
  params: Record<string, unknown>
): Promise<ToolResult> {
  const tableType = params.tableType as string;
  const limit = (params.limit as number) || 10;
  const sortBy = params.sortBy as string;
  const sortOrder = (params.sortOrder as string) || "desc";

  let tableData: TableData;

  switch (tableType) {
    case "sales":
    case "performance":
      tableData = generateMockSalesTable();
      break;
    default:
      tableData = generateMockSalesTable();
  }

  // Apply limit
  if (tableData.rows.length > limit) {
    tableData.rows = tableData.rows.slice(0, limit);
  }

  // Apply sorting if specified
  if (sortBy && tableData.rows.length > 0 && sortBy in tableData.rows[0]) {
    tableData.rows.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }

  return {
    success: true,
    data: tableData,
  };
}

async function handleGetInsights(
  params: Record<string, unknown>
): Promise<ToolResult> {
  const dashboardType = params.dashboardType as DashboardType;
  const count = (params.count as number) || 3;
  const severityFilter = params.severity as string | undefined;

  const insights: InsightData[] = [];
  for (let i = 0; i < count; i++) {
    const insight = generateMockInsight(dashboardType);
    if (!severityFilter || insight.severity === severityFilter) {
      insights.push(insight);
    }
  }

  return {
    success: true,
    data: insights,
  };
}

async function handleAggregateData(
  params: Record<string, unknown>
): Promise<ToolResult> {
  const operation = params.operation as string;
  const metric = params.metric as string;
  const groupBy = params.groupBy as string | undefined;

  // Generate mock aggregated data
  const result = generateAggregatedData(operation, metric, groupBy);

  return {
    success: true,
    data: result,
  };
}

async function handleFilterData(
  params: Record<string, unknown>
): Promise<ToolResult> {
  const dataSource = params.dataSource as string;
  const filters = params.filters as Record<string, unknown> | undefined;
  const dateRange = params.dateRange as
    | { start?: string; end?: string }
    | undefined;

  // Generate filtered mock data
  const result = generateFilteredData(dataSource, filters, dateRange);

  return {
    success: true,
    data: result,
  };
}

// ============ Helper Functions ============

function generateMetricsForDashboard(
  dashboardType: DashboardType,
  timeRange: string
): Record<string, unknown> {
  const baseMetrics: Record<DashboardType, Record<string, unknown>> = {
    sales: {
      totalRevenue: randomBetween(500000, 2000000),
      dealsWon: randomBetween(50, 200),
      conversionRate: randomBetween(15, 35) / 100,
      avgDealSize: randomBetween(10000, 50000),
      pipelineValue: randomBetween(1000000, 5000000),
    },
    analytics: {
      pageViews: randomBetween(100000, 500000),
      uniqueVisitors: randomBetween(50000, 200000),
      bounceRate: randomBetween(30, 60) / 100,
      avgSessionDuration: randomBetween(120, 300),
      conversionRate: randomBetween(2, 8) / 100,
    },
    financial: {
      revenue: randomBetween(1000000, 5000000),
      expenses: randomBetween(500000, 2000000),
      netIncome: randomBetween(200000, 1000000),
      cashFlow: randomBetween(100000, 500000),
      profitMargin: randomBetween(10, 30) / 100,
    },
    operations: {
      uptime: randomBetween(9950, 9999) / 100,
      responseTime: randomBetween(50, 200),
      errorRate: randomBetween(1, 50) / 1000,
      throughput: randomBetween(1000, 10000),
      activeUsers: randomBetween(500, 5000),
    },
    hr: {
      totalEmployees: randomBetween(100, 1000),
      newHires: randomBetween(5, 50),
      attritionRate: randomBetween(5, 15) / 100,
      avgTenure: randomBetween(2, 5),
      satisfactionScore: randomBetween(70, 95) / 100,
    },
    ecommerce: {
      orders: randomBetween(1000, 10000),
      revenue: randomBetween(100000, 1000000),
      avgOrderValue: randomBetween(50, 200),
      cartAbandonmentRate: randomBetween(60, 80) / 100,
      returnRate: randomBetween(5, 15) / 100,
    },
  };

  return {
    dashboardType,
    timeRange,
    metrics: baseMetrics[dashboardType] || baseMetrics.sales,
    generatedAt: new Date().toISOString(),
  };
}

function generateAggregatedData(
  operation: string,
  metric: string,
  groupBy?: string
): Record<string, unknown> {
  const value = randomBetween(10000, 100000);

  if (groupBy) {
    const groups = ["Group A", "Group B", "Group C", "Group D"];
    return {
      operation,
      metric,
      groupBy,
      results: groups.map((group) => ({
        [groupBy]: group,
        value: randomBetween(1000, 25000),
      })),
    };
  }

  return {
    operation,
    metric,
    value,
  };
}

function generateFilteredData(
  dataSource: string,
  filters?: Record<string, unknown>,
  dateRange?: { start?: string; end?: string }
): Record<string, unknown> {
  return {
    dataSource,
    filters: filters || {},
    dateRange: dateRange || { start: null, end: null },
    resultCount: randomBetween(10, 100),
    data: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      value: randomBetween(100, 1000),
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    })),
  };
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============ Tool Definitions ============

export const getMetricsTool: ToolDefinition = {
  name: "get_metrics",
  description:
    "Retrieves dashboard metrics for a specific dashboard type and time range. Returns key performance indicators relevant to the dashboard context.",
  parameters: getMetricsSchema,
  handler: handleGetMetrics,
};

export const getChartDataTool: ToolDefinition = {
  name: "get_chart_data",
  description:
    "Retrieves data formatted for chart visualization. Supports various chart types and data sources including revenue, sales, trends, and comparisons.",
  parameters: getChartDataSchema,
  handler: handleGetChartData,
};

export const getTableDataTool: ToolDefinition = {
  name: "get_table_data",
  description:
    "Retrieves tabular data for display in tables. Supports sorting, limiting, and various data types like sales performance, products, and transactions.",
  parameters: getTableDataSchema,
  handler: handleGetTableData,
};

export const getInsightsTool: ToolDefinition = {
  name: "get_insights",
  description:
    "Retrieves AI-generated insights for a dashboard. Returns observations, alerts, and recommendations based on the data.",
  parameters: getInsightsSchema,
  handler: handleGetInsights,
};

export const aggregateDataTool: ToolDefinition = {
  name: "aggregate_data",
  description:
    "Performs aggregation operations (sum, avg, min, max, count) on metrics. Supports grouping by dimensions.",
  parameters: aggregateDataSchema,
  handler: handleAggregateData,
};

export const filterDataTool: ToolDefinition = {
  name: "filter_data",
  description:
    "Filters data based on conditions and date ranges. Returns a subset of data matching the specified criteria.",
  parameters: filterDataSchema,
  handler: handleFilterData,
};

// ============ All Dashboard Tools ============

export const dashboardTools: ToolDefinition[] = [
  getMetricsTool,
  getChartDataTool,
  getTableDataTool,
  getInsightsTool,
  aggregateDataTool,
  filterDataTool,
];

// Helper to register all dashboard tools
export function registerDashboardTools(registry: {
  register: (tool: ToolDefinition) => void;
}): void {
  dashboardTools.forEach((tool) => registry.register(tool));
}
