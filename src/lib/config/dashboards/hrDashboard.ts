import { Users } from "lucide-react";
import { DashboardConfig, COLOR_CLASSES, HRChartData } from "./types";

export const hrChartData: HRChartData = {
  headcount: [
    { month: "Jan", hired: 8, left: 3 },
    { month: "Feb", hired: 7, left: 2 },
    { month: "Mar", hired: 6, left: 1 },
    { month: "Apr", hired: 5, left: 2 },
    { month: "May", hired: 6, left: 2 },
    { month: "Jun", hired: 7, left: 2 },
  ],
  departments: [
    { name: "Engineering", count: 92 },
    { name: "Sales", count: 48 },
    { name: "Marketing", count: 35 },
    { name: "Operations", count: 42 },
    { name: "HR", count: 18 },
    { name: "Finance", count: 12 },
  ],
  satisfaction: [
    { category: "Work-Life Balance", score: 4.3 },
    { category: "Compensation", score: 3.9 },
    { category: "Career Growth", score: 4.1 },
    { category: "Management", score: 4.2 },
    { category: "Culture", score: 4.5 },
    { category: "Benefits", score: 4.0 },
  ],
  benefits: [
    { benefit: "Health Insurance", enrolled: 242 },
    { benefit: "401k", enrolled: 198 },
    { benefit: "Dental", enrolled: 228 },
    { benefit: "Vision", enrolled: 215 },
    { benefit: "Life Insurance", enrolled: 187 },
  ],
};

export const hrDashboardConfig: DashboardConfig = {
  id: "hr",
  title: "HR Dashboard",
  description: "Real-time HR insights and analytics",
  icon: Users,
  color: "indigo",
  theme: COLOR_CLASSES.indigo,
  metrics: [
    { label: "Total Employees", value: "247", change: "+12", trend: "up" },
    { label: "Retention Rate", value: "95%", change: "+2%", trend: "up" },
    { label: "Avg Satisfaction", value: "4.2/5", change: "+0.3", trend: "up" },
    { label: "Open Positions", value: "8", change: "-3", trend: "up" },
  ],
  charts: {
    main: {
      id: "hiring-attrition",
      type: "bar",
      title: "Hiring & Attrition",
      dataKey: "hired",
      data: hrChartData.headcount,
      config: {
        xAxisKey: "month",
        showLegend: true,
        showGrid: true,
      },
    },
    secondary: {
      id: "department-distribution",
      type: "bar",
      title: "Department Distribution",
      dataKey: "count",
      data: hrChartData.departments,
      config: {
        xAxisKey: "name",
        showGrid: true,
      },
    },
    tertiary: {
      id: "employee-satisfaction",
      type: "radar",
      title: "Employee Satisfaction",
      dataKey: "score",
      data: hrChartData.satisfaction,
      config: {
        labelKey: "category",
      },
    },
    quaternary: {
      id: "benefits-enrollment",
      type: "bar",
      title: "Benefits Enrollment",
      dataKey: "enrolled",
      data: hrChartData.benefits,
      config: {
        xAxisKey: "benefit",
        layout: "vertical",
        showGrid: true,
      },
    },
  },
  widgets: [],
  aiSuggestions: {
    prompts: [
      "Forecast headcount for next quarter",
      "Show me HR trends over the last month",
      "Compare this month vs last month",
      "Give me insights on HR performance",
    ],
  },
};
