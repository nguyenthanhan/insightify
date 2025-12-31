export type MessageRole = 'user' | 'assistant';

export type MessageType = 'text' | 'chart' | 'table' | 'insight' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  data?: ChartData | TableData | InsightData;
  timestamp: string;
  feedback?: MessageFeedback;
}

export interface MessageFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface ChartData {
  title: string;
  data: Array<Record<string, string | number>>;
  chartType: 'line' | 'bar' | 'pie' | 'area';
  xKey: string;
  yKey: string;
}

export interface TableData {
  title: string;
  headers: string[];
  rows: Array<Record<string, string | number>>;
}

export interface InsightData {
  title: string;
  description: string;
  icon?: string;
  severity?: 'info' | 'warning' | 'success' | 'error';
}

export type DashboardType = 'sales' | 'analytics' | 'financial' | 'operations' | 'hr' | 'ecommerce';

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface UserPreferences {
  theme: 'light' | 'dark';
  verbosity: 'brief' | 'detailed' | 'comprehensive';
  formats: MessageType[];
  dashboardType: DashboardType;
}

export interface MockResponse {
  type: MessageType;
  content: string;
  data?: ChartData | TableData | InsightData;
  confidence: number;
}
