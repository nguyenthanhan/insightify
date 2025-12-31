import { Briefcase } from "lucide-react";
import { DashboardConfig, COLOR_CLASSES, OperationsChartData } from "./types";

export const operationsChartData: OperationsChartData = {
  performance: [
    { time: "00:00", requests: 1200, latency: 145 },
    { time: "04:00", requests: 890, latency: 132 },
    { time: "08:00", requests: 2340, latency: 178 },
    { time: "12:00", requests: 3180, latency: 203 },
    { time: "16:00", requests: 2890, latency: 189 },
    { time: "20:00", requests: 2150, latency: 167 },
  ],
  tasks: [
    { status: "Completed", count: 342 },
    { status: "In Progress", count: 127 },
    { status: "Pending", count: 89 },
    { status: "Blocked", count: 23 },
  ],
  incidents: [
    { severity: "Critical", count: 2, resolved: 2 },
    { severity: "High", count: 8, resolved: 7 },
    { severity: "Medium", count: 23, resolved: 20 },
    { severity: "Low", count: 47, resolved: 45 },
  ],
  services: [
    { name: "API Gateway", status: 99.99, requests: 2840000 },
    { name: "Database", status: 99.98, requests: 1920000 },
    { name: "Auth Service", status: 100, requests: 1450000 },
    { name: "CDN", status: 99.95, requests: 980000 },
    { name: "Queue", status: 99.97, requests: 720000 },
  ],
};

export const operationsDashboardConfig: DashboardConfig = {
  id: "operations",
  title: "Operations Dashboard",
  description: "Real-time system operations and monitoring",
  icon: Briefcase,
  color: "orange",
  theme: COLOR_CLASSES.orange,
  metrics: [
    { label: "System Uptime", value: "99.98%", change: "+0.01%", trend: "up" },
    { label: "Active Tasks", value: "127", change: "-8", trend: "up" },
    { label: "Avg Response", value: "1.2s", change: "-0.3s", trend: "up" },
    { label: "Error Rate", value: "0.02%", change: "-0.01%", trend: "up" },
  ],
  charts: {
    main: {
      id: "system-performance",
      type: "line",
      title: "System Performance",
      dataKey: "requests",
      data: operationsChartData.performance,
      config: {
        xAxisKey: "time",
        showLegend: true,
        showGrid: true,
      },
    },
    secondary: {
      id: "task-status",
      type: "bar",
      title: "Task Status",
      dataKey: "count",
      data: operationsChartData.tasks,
      config: {
        xAxisKey: "status",
        showGrid: true,
      },
    },
    tertiary: {
      id: "incidents",
      type: "bar",
      title: "Incidents",
      dataKey: "count",
      data: operationsChartData.incidents,
      config: {
        xAxisKey: "severity",
        showLegend: true,
        showGrid: true,
      },
    },
  },
  widgets: [
    {
      id: "service-status",
      type: "table",
      title: "Service Status",
      data: operationsChartData.services,
      columns: [
        { key: "name", header: "Service", align: "left" },
        {
          key: "status",
          header: "Uptime",
          align: "right",
          format: "percent",
          colorClass: "text-green-600 dark:text-green-400",
        },
        {
          key: "requests",
          header: "Requests",
          align: "right",
          format: "number",
        },
      ],
    },
  ],
  aiSuggestions: {
    prompts: [
      "Forecast system load for next quarter",
      "Show me operations trends over the last month",
      "Compare this month vs last month",
      "Give me insights on operations performance",
    ],
  },
};
