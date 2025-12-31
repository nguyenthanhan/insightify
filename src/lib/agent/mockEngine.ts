import { DashboardType, MockResponse } from '@/types/agent';
import { matchKeywords, extractTimeframe } from './keywords';
import { getTemplate } from './templates';

export async function processMockQuery(
  query: string,
  dashboardType: DashboardType = 'sales'
): Promise<MockResponse> {
  // Simulate processing delay for realism
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

  // Extract intent from query
  const intent = matchKeywords(query);
  
  // Extract timeframe if present
  const timeframe = extractTimeframe(query);

  // Get appropriate template response
  const response = getTemplate(intent.type, dashboardType, timeframe || undefined);

  return response;
}

export function generateTypingDelay(): number {
  return 800 + Math.random() * 400; // 800-1200ms
}
