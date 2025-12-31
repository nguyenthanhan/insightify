import { DashboardType, MockResponse } from '@/types/agent';
import {
  generateMockRevenueForecast,
  generateMockSalesTable,
  generateMockInsight,
  generateMockTrendData,
  generateMockComparison,
} from './mockData';

type TemplateGenerator = (dashboardType: DashboardType, timeframe?: string) => MockResponse;

const TEMPLATES: Record<string, TemplateGenerator> = {
  forecast: (dashboardType) => ({
    type: 'chart',
    content: `Based on historical data and current trends, here's the ${dashboardType} forecast for the next 6 months. The projection shows steady growth with some seasonal variations.`,
    data: generateMockRevenueForecast(),
    confidence: 85,
  }),

  analyze: (dashboardType) => ({
    type: 'text',
    content: `I've analyzed the ${dashboardType} data. Key findings: Performance is trending positively with a 15% improvement over the previous period. The data shows consistent growth patterns across all major metrics.`,
    confidence: 82,
  }),

  compare: (dashboardType) => ({
    type: 'chart',
    content: `Here's a comparison of ${dashboardType} metrics. The data reveals interesting performance differences across categories.`,
    data: generateMockComparison(),
    confidence: 88,
  }),

  trend: (dashboardType) => ({
    type: 'chart',
    content: `The ${dashboardType} trend analysis shows fluctuations over the past month. Overall trajectory is positive with minor variations.`,
    data: generateMockTrendData('Revenue'),
    confidence: 80,
  }),

  revenue: () => ({
    type: 'table',
    content: `Current revenue breakdown by team member. This table shows performance metrics including deals closed and conversion rates.`,
    data: generateMockSalesTable(),
    confidence: 90,
  }),

  performance: (dashboardType) => ({
    type: 'table',
    content: `Performance metrics for the ${dashboardType} dashboard. Top performers are highlighted with their key statistics.`,
    data: generateMockSalesTable(),
    confidence: 87,
  }),

  show: (dashboardType) => ({
    type: 'chart',
    content: `Here's the visual representation of your ${dashboardType} data. The chart displays the most relevant metrics for quick analysis.`,
    data: generateMockRevenueForecast(),
    confidence: 85,
  }),

  summary: (dashboardType, timeframe = 'this month') => ({
    type: 'text',
    content: `**${dashboardType.toUpperCase()} Summary for ${timeframe}:**\n\n• Revenue: $487,500 (+18% vs previous period)\n• Active deals: 47 opportunities\n• Conversion rate: 28% (above target)\n• Top performer: Sarah Williams\n\nOverall performance is strong with key metrics trending positively. No major concerns identified.`,
    confidence: 92,
  }),

  insights: (dashboardType) => ({
    type: 'insight',
    content: `Here's a key insight from your ${dashboardType} data that requires attention.`,
    data: generateMockInsight(dashboardType),
    confidence: 85,
  }),

  export: () => ({
    type: 'text',
    content: `I've prepared your data export. In a real implementation, this would download a CSV or JSON file with your selected data.`,
    confidence: 95,
  }),

  unknown: (dashboardType) => ({
    type: 'text',
    content: `I'm not quite sure what you're asking about the ${dashboardType} data. Could you rephrase your question? Try asking about forecasts, trends, comparisons, or summaries.`,
    confidence: 30,
  }),
};

export function getTemplate(intentType: string, dashboardType: DashboardType, timeframe?: string): MockResponse {
  const generator = TEMPLATES[intentType] || TEMPLATES.unknown;
  return generator(dashboardType, timeframe);
}

export function getWelcomeMessage(dashboardType: DashboardType): string {
  return `👋 Hello! I'm your ${dashboardType} assistant. I can help you with:

• **Forecasts** - "Forecast revenue for next quarter"
• **Trends** - "Show me sales trends"
• **Comparisons** - "Compare this month vs last month"
• **Insights** - "Give me insights on performance"
• **Summaries** - "Summarize this month's results"

What would you like to know?`;
}
