export type ActivityEventType =
  | "metric_change"
  | "alert"
  | "user_action"
  | "system"
  | "ai_insight";

export type Severity = "info" | "warning" | "success" | "error";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string;
  timestamp: string;
  severity: Severity;
  metadata?: Record<string, unknown>;
  read: boolean;
}

export interface ActivityFilter {
  types?: ActivityEventType[];
  severity?: Severity[];
  startDate?: string;
  endDate?: string;
  read?: boolean;
}

export interface NotificationConfig {
  id?: string;
  title: string;
  message: string;
  severity: Severity;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Notification extends NotificationConfig {
  id: string;
  timestamp: string;
  dismissed: boolean;
}
