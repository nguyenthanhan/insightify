import { ChartData, TableData, InsightData, DashboardType } from '@/types/agent';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomBetween(0, arr.length - 1)];
}

export function generateMockRevenueForecast(): ChartData {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const data = months.map(month => ({
    month,
    revenue: randomBetween(400000, 600000),
    forecast: randomBetween(420000, 650000),
  }));

  return {
    title: 'Revenue Forecast (Next 6 Months)',
    data,
    chartType: 'line',
    xKey: 'month',
    yKey: 'revenue',
  };
}

export function generateMockSalesTable(): TableData {
  const salespeople = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown'];
  const rows = salespeople.map(name => ({
    name,
    deals: randomBetween(5, 25),
    revenue: randomBetween(50000, 250000),
    conversionRate: `${randomBetween(15, 45)}%`,
  }));

  return {
    title: 'Top Sales Performance',
    headers: ['Name', 'Deals', 'Revenue', 'Conversion Rate'],
    rows,
  };
}

export function generateMockInsight(dashboardType: DashboardType): InsightData {
  const insights: Record<DashboardType, InsightData[]> = {
    sales: [
      {
        title: 'Strong Q4 Performance',
        description: 'Revenue increased by 23% compared to last quarter, driven by enterprise deals.',
        severity: 'success',
      },
      {
        title: 'Pipeline Velocity Improving',
        description: 'Average deal closure time decreased from 45 to 32 days.',
        severity: 'info',
      },
      {
        title: 'Top Performer Alert',
        description: 'Sarah Williams exceeded her quota by 180% this month.',
        severity: 'success',
      },
    ],
    analytics: [
      {
        title: 'User Engagement Up',
        description: 'Daily active users increased by 15% this week.',
        severity: 'success',
      },
      {
        title: 'Bounce Rate Spike',
        description: 'Landing page bounce rate increased to 62%. Consider A/B testing new designs.',
        severity: 'warning',
      },
    ],
    financial: [
      {
        title: 'Cash Flow Healthy',
        description: 'Operating cash flow is positive for the 6th consecutive month.',
        severity: 'success',
      },
      {
        title: 'Budget Variance Detected',
        description: 'Marketing expenses are 18% over budget this quarter.',
        severity: 'warning',
      },
    ],
    operations: [
      {
        title: 'System Uptime Excellent',
        description: '99.98% uptime maintained across all services this month.',
        severity: 'success',
      },
    ],
    hr: [
      {
        title: 'Low Attrition Rate',
        description: 'Employee retention rate is at 95%, above industry average.',
        severity: 'success',
      },
    ],
    ecommerce: [
      {
        title: 'Conversion Rate Improving',
        description: 'Checkout conversion increased from 2.4% to 3.1% after UI improvements.',
        severity: 'success',
      },
    ],
  };

  const dashboardInsights = insights[dashboardType] || insights.sales;
  return randomChoice(dashboardInsights);
}

export function generateMockTrendData(metric: string): ChartData {
  const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const baseValue = randomBetween(1000, 5000);
  
  const data = periods.map((period, index) => ({
    period,
    value: baseValue + (index * randomBetween(-200, 500)),
  }));

  return {
    title: `${metric} Trend (Last 4 Weeks)`,
    data,
    chartType: 'area',
    xKey: 'period',
    yKey: 'value',
  };
}

export function generateMockComparison(): ChartData {
  const categories = ['Product A', 'Product B', 'Product C', 'Product D'];
  const data = categories.map(category => ({
    category,
    thisMonth: randomBetween(10000, 50000),
    lastMonth: randomBetween(10000, 50000),
  }));

  return {
    title: 'Product Performance Comparison',
    data,
    chartType: 'bar',
    xKey: 'category',
    yKey: 'thisMonth',
  };
}
