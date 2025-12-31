import { DollarSign } from "lucide-react";
import { DashboardConfig, COLOR_CLASSES, SalesChartData } from "./types";

export const salesChartData: SalesChartData = {
  revenue: [
    { month: "Jan", revenue: 420000, target: 400000 },
    { month: "Feb", revenue: 445000, target: 420000 },
    { month: "Mar", revenue: 478000, target: 440000 },
    { month: "Apr", revenue: 461000, target: 450000 },
    { month: "May", revenue: 502000, target: 470000 },
    { month: "Jun", revenue: 487500, target: 480000 },
  ],
  pipeline: [
    { stage: "Lead", count: 45 },
    { stage: "Qualified", count: 32 },
    { stage: "Proposal", count: 18 },
    { stage: "Negotiation", count: 12 },
    { stage: "Won", count: 8 },
  ],
  topPerformers: [
    { name: "Sarah Williams", deals: 28, revenue: 324000, commission: 32400 },
    { name: "John Chen", deals: 24, revenue: 289000, commission: 28900 },
    { name: "Emily Rodriguez", deals: 22, revenue: 267000, commission: 26700 },
    { name: "Michael Brown", deals: 19, revenue: 198000, commission: 19800 },
    { name: "Lisa Anderson", deals: 17, revenue: 187000, commission: 18700 },
  ],
  regional: [
    { region: "North America", revenue: 185000, deals: 32 },
    { region: "Europe", revenue: 142000, deals: 28 },
    { region: "Asia Pacific", revenue: 98000, deals: 18 },
    { region: "Latin America", revenue: 62500, deals: 14 },
  ],
  conversion: [
    { month: "Jan", rate: 24 },
    { month: "Feb", rate: 26 },
    { month: "Mar", rate: 25 },
    { month: "Apr", rate: 27 },
    { month: "May", rate: 29 },
    { month: "Jun", rate: 28 },
  ],
};

export const salesDashboardConfig: DashboardConfig = {
  id: "sales",
  title: "Sales Dashboard",
  description: "Real-time sales insights and analytics",
  icon: DollarSign,
  color: "blue",
  theme: COLOR_CLASSES.blue,
  metrics: [
    { label: "Total Revenue", value: "$487,500", change: "+18%", trend: "up" },
    { label: "Active Deals", value: "47", change: "+5", trend: "up" },
    { label: "Conversion Rate", value: "28%", change: "+3%", trend: "up" },
    { label: "Avg Deal Size", value: "$10,372", change: "-2%", trend: "down" },
  ],
  charts: {
    main: {
      id: "revenue-trends",
      type: "line",
      title: "Revenue Trends",
      dataKey: "revenue",
      data: salesChartData.revenue,
      config: {
        xAxisKey: "month",
        showLegend: true,
        showGrid: true,
      },
    },
    secondary: {
      id: "pipeline-stages",
      type: "bar",
      title: "Pipeline Stages",
      dataKey: "count",
      data: salesChartData.pipeline,
      config: {
        xAxisKey: "stage",
        showGrid: true,
      },
    },
    tertiary: {
      id: "regional-performance",
      type: "bar",
      title: "Regional Performance",
      dataKey: "deals",
      data: salesChartData.regional,
      config: {
        xAxisKey: "region",
        layout: "vertical",
        showGrid: true,
      },
    },
  },
  widgets: [
    {
      id: "top-performers",
      type: "table",
      title: "Top Performers",
      data: salesChartData.topPerformers,
      columns: [
        { key: "name", header: "Name", align: "left" },
        { key: "deals", header: "Deals", align: "right", format: "number" },
        {
          key: "revenue",
          header: "Revenue",
          align: "right",
          format: "currency",
        },
        {
          key: "commission",
          header: "Commission",
          align: "right",
          format: "currency",
          colorClass: "text-green-600 dark:text-green-400",
        },
      ],
    },
  ],
  aiSuggestions: {
    prompts: [
      "Forecast revenue for next quarter",
      "Show me sales trends over the last month",
      "Compare this month vs last month",
      "Give me insights on sales performance",
    ],
  },
};
