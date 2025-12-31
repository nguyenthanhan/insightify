import { Activity } from "lucide-react";
import { DashboardConfig, COLOR_CLASSES, AnalyticsChartData } from "./types";

export const analyticsChartData: AnalyticsChartData = {
  traffic: [
    { day: "Mon", users: 3200, pageviews: 12400 },
    { day: "Tue", users: 3800, pageviews: 14200 },
    { day: "Wed", users: 4200, pageviews: 16800 },
    { day: "Thu", users: 3900, pageviews: 15200 },
    { day: "Fri", users: 4500, pageviews: 18600 },
    { day: "Sat", users: 2800, pageviews: 9200 },
    { day: "Sun", users: 2400, pageviews: 7800 },
  ],
  sources: [
    { name: "Organic Search", value: 35200 },
    { name: "Direct", value: 28400 },
    { name: "Social Media", value: 18600 },
    { name: "Email", value: 12800 },
    { name: "Referral", value: 9200 },
  ],
  devices: [
    { name: "Desktop", sessions: 48200, conversion: 3.8 },
    { name: "Mobile", sessions: 38600, conversion: 2.4 },
    { name: "Tablet", sessions: 17400, conversion: 3.2 },
  ],
  topPages: [
    { page: "/products", views: 28400, avgTime: "3:24", bounce: 32 },
    { page: "/home", views: 24800, avgTime: "2:18", bounce: 28 },
    { page: "/about", views: 18200, avgTime: "1:52", bounce: 42 },
    { page: "/pricing", views: 16800, avgTime: "2:48", bounce: 38 },
    { page: "/contact", views: 12400, avgTime: "1:34", bounce: 52 },
  ],
  hourly: [
    { hour: "00", visits: 1200 },
    { hour: "03", visits: 890 },
    { hour: "06", visits: 1450 },
    { hour: "09", visits: 3240 },
    { hour: "12", visits: 4180 },
    { hour: "15", visits: 3890 },
    { hour: "18", visits: 2940 },
    { hour: "21", visits: 2180 },
  ],
};

export const analyticsDashboardConfig: DashboardConfig = {
  id: "analytics",
  title: "Analytics Dashboard",
  description: "Real-time traffic and user analytics",
  icon: Activity,
  color: "purple",
  theme: COLOR_CLASSES.purple,
  metrics: [
    { label: "Page Views", value: "125K", change: "+12%", trend: "up" },
    { label: "Unique Visitors", value: "42.3K", change: "+8%", trend: "up" },
    { label: "Bounce Rate", value: "38%", change: "-5%", trend: "up" },
    { label: "Avg Session", value: "4m 32s", change: "+15s", trend: "up" },
  ],
  charts: {
    main: {
      id: "traffic-overview",
      type: "area",
      title: "Traffic Overview",
      dataKey: "users",
      data: analyticsChartData.traffic,
      config: {
        xAxisKey: "day",
        showLegend: true,
        showGrid: true,
        fillOpacity: 0.6,
      },
    },
    secondary: {
      id: "traffic-sources",
      type: "pie",
      title: "Traffic Sources",
      dataKey: "value",
      data: analyticsChartData.sources,
      config: {
        labelKey: "name",
      },
    },
    tertiary: {
      id: "device-breakdown",
      type: "pie",
      title: "Device Breakdown",
      dataKey: "sessions",
      data: analyticsChartData.devices,
      config: {
        labelKey: "name",
      },
    },
  },
  widgets: [
    {
      id: "top-pages",
      type: "table",
      title: "Top Pages",
      data: analyticsChartData.topPages,
      columns: [
        { key: "page", header: "Page", align: "left" },
        { key: "views", header: "Views", align: "right", format: "number" },
        { key: "avgTime", header: "Avg Time", align: "right" },
        {
          key: "bounce",
          header: "Bounce %",
          align: "right",
          format: "percent",
        },
      ],
    },
  ],
  aiSuggestions: {
    prompts: [
      "Forecast traffic for next quarter",
      "Show me analytics trends over the last month",
      "Compare this month vs last month",
      "Give me insights on analytics performance",
    ],
  },
};
