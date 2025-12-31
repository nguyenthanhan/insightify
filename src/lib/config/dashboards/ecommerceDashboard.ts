import { ShoppingCart } from "lucide-react";
import { DashboardConfig, COLOR_CLASSES, EcommerceChartData } from "./types";

export const ecommerceChartData: EcommerceChartData = {
  sales: [
    { week: "Week 1", orders: 520, revenue: 38400 },
    { week: "Week 2", orders: 580, revenue: 42920 },
    { week: "Week 3", orders: 640, revenue: 47360 },
    { week: "Week 4", orders: 720, revenue: 53280 },
  ],
  categories: [
    { name: "Electronics", value: 128000 },
    { name: "Clothing", value: 87000 },
    { name: "Home & Garden", value: 64000 },
    { name: "Sports", value: 43000 },
    { name: "Books", value: 28000 },
    { name: "Toys", value: 18000 },
  ],
  topProducts: [
    { product: "Wireless Headphones", sold: 1840, revenue: 89920, rating: 4.7 },
    { product: "Smart Watch", sold: 1520, revenue: 76000, rating: 4.5 },
    { product: "Laptop Stand", sold: 1340, revenue: 40200, rating: 4.8 },
    { product: "USB-C Cable", sold: 2140, revenue: 21400, rating: 4.6 },
    { product: "Phone Case", sold: 1980, revenue: 19800, rating: 4.4 },
  ],
  returns: [
    { month: "Jan", returns: 124, rate: 2.8 },
    { month: "Feb", returns: 118, rate: 2.6 },
    { month: "Mar", returns: 142, rate: 3.1 },
    { month: "Apr", returns: 136, rate: 2.9 },
    { month: "May", returns: 128, rate: 2.7 },
    { month: "Jun", returns: 132, rate: 2.8 },
  ],
};

export const ecommerceDashboardConfig: DashboardConfig = {
  id: "ecommerce",
  title: "E-Commerce Dashboard",
  description: "Real-time e-commerce insights and analytics",
  icon: ShoppingCart,
  color: "pink",
  theme: COLOR_CLASSES.pink,
  metrics: [
    { label: "Total Orders", value: "3,842", change: "+22%", trend: "up" },
    { label: "Revenue", value: "$284K", change: "+18%", trend: "up" },
    { label: "Avg Order Value", value: "$74", change: "-2%", trend: "down" },
    { label: "Cart Abandon", value: "68%", change: "-3%", trend: "up" },
  ],
  charts: {
    main: {
      id: "sales-trends",
      type: "line",
      title: "Sales Trends",
      dataKey: "orders",
      data: ecommerceChartData.sales,
      config: {
        xAxisKey: "week",
        showLegend: true,
        showGrid: true,
      },
    },
    secondary: {
      id: "sales-by-category",
      type: "pie",
      title: "Sales by Category",
      dataKey: "value",
      data: ecommerceChartData.categories,
      config: {
        labelKey: "name",
      },
    },
    tertiary: {
      id: "return-rate",
      type: "line",
      title: "Return Rate",
      dataKey: "rate",
      data: ecommerceChartData.returns,
      config: {
        xAxisKey: "month",
        showGrid: true,
      },
    },
  },
  widgets: [
    {
      id: "top-products",
      type: "table",
      title: "Top Products",
      data: ecommerceChartData.topProducts,
      columns: [
        { key: "product", header: "Product", align: "left" },
        { key: "sold", header: "Sold", align: "right", format: "number" },
        {
          key: "revenue",
          header: "Revenue",
          align: "right",
          format: "currency",
        },
        {
          key: "rating",
          header: "Rating",
          align: "right",
          format: "rating",
          colorClass: "text-yellow-600 dark:text-yellow-400",
        },
      ],
    },
  ],
  aiSuggestions: {
    prompts: [
      "Forecast orders for next quarter",
      "Show me ecommerce trends over the last month",
      "Compare this month vs last month",
      "Give me insights on ecommerce performance",
    ],
  },
};
