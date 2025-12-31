import { DashboardType } from "@/types/agent";
import { DashboardConfig } from "./types";
import { salesDashboardConfig, salesChartData } from "./salesDashboard";
import {
  analyticsDashboardConfig,
  analyticsChartData,
} from "./analyticsDashboard";
import {
  financialDashboardConfig,
  financialChartData,
} from "./financialDashboard";
import {
  operationsDashboardConfig,
  operationsChartData,
} from "./operationsDashboard";
import { hrDashboardConfig, hrChartData } from "./hrDashboard";
import {
  ecommerceDashboardConfig,
  ecommerceChartData,
} from "./ecommerceDashboard";

// Export all types
export * from "./types";

// Export individual configs
export {
  salesDashboardConfig,
  salesChartData,
  analyticsDashboardConfig,
  analyticsChartData,
  financialDashboardConfig,
  financialChartData,
  operationsDashboardConfig,
  operationsChartData,
  hrDashboardConfig,
  hrChartData,
  ecommerceDashboardConfig,
  ecommerceChartData,
};

// Dashboard configs map
export const dashboardConfigs: Record<DashboardType, DashboardConfig> = {
  sales: salesDashboardConfig,
  analytics: analyticsDashboardConfig,
  financial: financialDashboardConfig,
  operations: operationsDashboardConfig,
  hr: hrDashboardConfig,
  ecommerce: ecommerceDashboardConfig,
};

// Helper function to get dashboard config
export function getDashboardConfig(type: DashboardType): DashboardConfig {
  return dashboardConfigs[type];
}

// Get all dashboard types
export function getAllDashboardTypes(): DashboardType[] {
  return Object.keys(dashboardConfigs) as DashboardType[];
}
