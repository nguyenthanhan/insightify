export interface Intent {
  type: string;
  confidence: number;
  keywords: string[];
}

const KEYWORD_PATTERNS: Record<string, string[]> = {
  forecast: ['forecast', 'predict', 'projection', 'next', 'future', 'estimate'],
  analyze: ['analyze', 'analysis', 'breakdown', 'examine', 'study', 'investigate'],
  compare: ['compare', 'versus', 'vs', 'difference', 'contrast'],
  trend: ['trend', 'trending', 'pattern', 'trajectory'],
  revenue: ['revenue', 'sales', 'income', 'earnings'],
  performance: ['performance', 'metrics', 'kpi', 'results'],
  show: ['show', 'display', 'view', 'see', 'visualize'],
  summary: ['summary', 'summarize', 'overview', 'brief'],
  insights: ['insight', 'insights', 'recommendation', 'suggest'],
  export: ['export', 'download', 'save'],
};

export function matchKeywords(query: string): Intent {
  const lowerQuery = query.toLowerCase();
  const matches: Array<{ type: string; score: number }> = [];

  for (const [intentType, keywords] of Object.entries(KEYWORD_PATTERNS)) {
    const matchedKeywords = keywords.filter(keyword => lowerQuery.includes(keyword));
    if (matchedKeywords.length > 0) {
      matches.push({
        type: intentType,
        score: matchedKeywords.length,
      });
    }
  }

  if (matches.length === 0) {
    return { type: 'unknown', confidence: 0, keywords: [] };
  }

  // Sort by score and return the highest
  matches.sort((a, b) => b.score - a.score);
  const topMatch = matches[0];

  return {
    type: topMatch.type,
    confidence: Math.min(topMatch.score * 25, 95), // Convert to percentage
    keywords: KEYWORD_PATTERNS[topMatch.type],
  };
}

export function extractTimeframe(query: string): string | null {
  const timeframes = [
    'last month',
    'last quarter',
    'last year',
    'this month',
    'this quarter',
    'this year',
    'q1', 'q2', 'q3', 'q4',
    'yesterday',
    'today',
    'last week',
  ];

  const lowerQuery = query.toLowerCase();
  for (const timeframe of timeframes) {
    if (lowerQuery.includes(timeframe)) {
      return timeframe;
    }
  }

  return null;
}
