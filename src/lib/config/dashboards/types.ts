import { DashboardType } from "@/types/agent";
import { LucideIcon } from "lucide-react";

/**
 * Metric configuration for dashboard cards
 */
export interface MetricConfig {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

/**
 * Chart type definitions
 */
export type ChartType = "line" | "bar" | "area" | "pie" | "radar" | "composed";

/**
 * Base chart configuration
 */
export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  dataKey: string;
  data: Record<string, unknown>[];
  config?: ChartSpecificConfig;
}

/**
 * Chart-specific configuration options
 */
export interface ChartSpecificConfig {
  xAxisKey?: string;
  yAxisKey?: string;
  secondaryYAxisKey?: string;
  layout?: "horizontal" | "vertical";
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  strokeWidth?: number;
  fillOpacity?: number;
  labelKey?: string;
}

/**
 * Widget configuration for tables and custom displays
 */
export interface WidgetConfig {
  id: string;
  type: "table" | "list" | "custom";
  title: string;
  data: Record<string, unknown>[];
  columns?: TableColumnConfig[];
}

/**
 * Table column configuration
 */
export interface TableColumnConfig {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  format?: "text" | "number" | "currency" | "percent" | "rating";
  colorClass?: string;
}

/**
 * Color theme configuration for dashboards
 */
export interface DashboardTheme {
  primary: string;
  gradient?: string;
  bg: string;
  text: string;
  light: string;
}

/**
 * AI assistant suggestions for each dashboard
 */
export interface AISuggestions {
  prompts: string[];
}

/**
 * Complete dashboard configuration
 */
export interface DashboardConfig {
  id: DashboardType;
  title: string;
  description: string;
  icon: LucideIcon;
  color: DashboardColorKey;
  theme: DashboardTheme;
  metrics: MetricConfig[];
  charts: {
    main: ChartConfig;
    secondary: ChartConfig;
    tertiary?: ChartConfig;
    quaternary?: ChartConfig;
  };
  widgets: WidgetConfig[];
  aiSuggestions: AISuggestions;
}

/**
 * Dashboard color keys
 */
export type DashboardColorKey =
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "indigo"
  | "pink";

/**
 * Color classes mapping
 */
export const COLOR_CLASSES: Record<DashboardColorKey, DashboardTheme> = {
  blue: {
    primary: "blue",
    bg: "bg-blue-500",
    text: "text-blue-600",
    light: "bg-blue-50 dark:bg-blue-900/20",
  },
  purple: {
    primary: "purple",
    bg: "bg-purple-500",
    text: "text-purple-600",
    light: "bg-purple-50 dark:bg-purple-900/20",
  },
  green: {
    primary: "green",
    bg: "bg-green-500",
    text: "text-green-600",
    light: "bg-green-50 dark:bg-green-900/20",
  },
  orange: {
    primary: "orange",
    bg: "bg-orange-500",
    text: "text-orange-600",
    light: "bg-orange-50 dark:bg-orange-900/20",
  },
  indigo: {
    primary: "indigo",
    bg: "bg-indigo-500",
    text: "text-indigo-600",
    light: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  pink: {
    primary: "pink",
    bg: "bg-pink-500",
    text: "text-pink-600",
    light: "bg-pink-50 dark:bg-pink-900/20",
  },
};

/**
 * Default chart colors
 */
export const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

/**
 * Chart data types for each dashboard
 */
export interface SalesChartData {
  revenue: Array<{ month: string; revenue: number; target: number }>;
  pipeline: Array<{ stage: string; count: number }>;
  topPerformers: Array<{
    name: string;
    deals: number;
    revenue: number;
    commission: number;
  }>;
  regional: Array<{ region: string; revenue: number; deals: number }>;
  conversion: Array<{ month: string; rate: number }>;
}

export interface AnalyticsChartData {
  traffic: Array<{ day: string; users: number; pageviews: number }>;
  sources: Array<{ name: string; value: number }>;
  devices: Array<{ name: string; sessions: number; conversion: number }>;
  topPages: Array<{
    page: string;
    views: number;
    avgTime: string;
    bounce: number;
  }>;
  hourly: Array<{ hour: string; visits: number }>;
}

export interface FinancialChartData {
  financial: Array<{ quarter: string; revenue: number; expenses: number }>;
  breakdown: Array<{ category: string; value: number }>;
  cashflow: Array<{ month: string; inflow: number; outflow: number }>;
  expenses: Array<{ category: string; amount: number }>;
}

export interface OperationsChartData {
  performance: Array<{ time: string; requests: number; latency: number }>;
  tasks: Array<{ status: string; count: number }>;
  incidents: Array<{ severity: string; count: number; resolved: number }>;
  services: Array<{ name: string; status: number; requests: number }>;
}

export interface HRChartData {
  headcount: Array<{ month: string; hired: number; left: number }>;
  departments: Array<{ name: string; count: number }>;
  satisfaction: Array<{ category: string; score: number }>;
  benefits: Array<{ benefit: string; enrolled: number }>;
}

export interface EcommerceChartData {
  sales: Array<{ week: string; orders: number; revenue: number }>;
  categories: Array<{ name: string; value: number }>;
  topProducts: Array<{
    product: string;
    sold: number;
    revenue: number;
    rating: number;
  }>;
  returns: Array<{ month: string; returns: number; rate: number }>;
}

export type DashboardChartData =
  | SalesChartData
  | AnalyticsChartData
  | FinancialChartData
  | OperationsChartData
  | HRChartData
  | EcommerceChartData;
