import { TrendingUp } from "lucide-react";
import { DashboardConfig, COLOR_CLASSES, FinancialChartData } from "./types";

export const financialChartData: FinancialChartData = {
  financial: [
    { quarter: "Q1 2024", revenue: 2850000, expenses: 1920000 },
    { quarter: "Q2 2024", revenue: 3150000, expenses: 1980000 },
    { quarter: "Q3 2024", revenue: 3420000, expenses: 2040000 },
    { quarter: "Q4 2024", revenue: 3680000, expenses: 2100000 },
  ],
  breakdown: [
    { category: "Product Sales", value: 5200000 },
    { category: "Services", value: 2800000 },
    { category: "Subscriptions", value: 1800000 },
    { category: "Licensing", value: 1200000 },
    { category: "Other", value: 600000 },
  ],
  cashflow: [
    { month: "Jan", inflow: 985000, outflow: 620000 },
    { month: "Feb", inflow: 1050000, outflow: 640000 },
    { month: "Mar", inflow: 1125000, outflow: 660000 },
    { month: "Apr", inflow: 1095000, outflow: 650000 },
    { month: "May", inflow: 1185000, outflow: 680000 },
    { month: "Jun", inflow: 1210000, outflow: 680000 },
  ],
  expenses: [
    { category: "Salaries", amount: 420000 },
    { category: "Operations", amount: 180000 },
    { category: "Marketing", amount: 140000 },
    { category: "Infrastructure", amount: 95000 },
    { category: "R&D", amount: 75000 },
    { category: "Other", amount: 45000 },
  ],
};

export const financialDashboardConfig: DashboardConfig = {
  id: "financial",
  title: "Financial Dashboard",
  description: "Real-time financial insights and analytics",
  icon: TrendingUp,
  color: "green",
  theme: COLOR_CLASSES.green,
  metrics: [
    { label: "Net Revenue", value: "$1.2M", change: "+15%", trend: "up" },
    { label: "Operating Cost", value: "$680K", change: "+5%", trend: "down" },
    { label: "Net Profit", value: "$520K", change: "+28%", trend: "up" },
    { label: "Profit Margin", value: "43%", change: "+4%", trend: "up" },
  ],
  charts: {
    main: {
      id: "financial-performance",
      type: "bar",
      title: "Financial Performance",
      dataKey: "revenue",
      data: financialChartData.financial,
      config: {
        xAxisKey: "quarter",
        showLegend: true,
        showGrid: true,
      },
    },
    secondary: {
      id: "revenue-breakdown",
      type: "pie",
      title: "Revenue Breakdown",
      dataKey: "value",
      data: financialChartData.breakdown,
      config: {
        labelKey: "category",
      },
    },
    tertiary: {
      id: "cash-flow",
      type: "area",
      title: "Cash Flow",
      dataKey: "inflow",
      data: financialChartData.cashflow,
      config: {
        xAxisKey: "month",
        showLegend: true,
        showGrid: true,
        fillOpacity: 0.6,
      },
    },
    quaternary: {
      id: "expense-categories",
      type: "pie",
      title: "Expense Categories",
      dataKey: "amount",
      data: financialChartData.expenses,
      config: {
        labelKey: "category",
      },
    },
  },
  widgets: [],
  aiSuggestions: {
    prompts: [
      "Forecast profit for next quarter",
      "Show me financial trends over the last month",
      "Compare this month vs last month",
      "Give me insights on financial performance",
    ],
  },
};
