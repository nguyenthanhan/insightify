import { v4 as uuidv4 } from "uuid";
import {
  ActivityEvent,
  ActivityEventType,
  ActivityFilter,
  Severity,
} from "./types";

export class ActivityFeed {
  private events: ActivityEvent[] = [];
  private maxEvents: number;
  private listeners: Set<(events: ActivityEvent[]) => void> = new Set();

  constructor(maxEvents = 100) {
    this.maxEvents = maxEvents;
  }

  addEvent(
    event: Omit<ActivityEvent, "id" | "timestamp" | "read">
  ): ActivityEvent {
    const newEvent: ActivityEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.events.unshift(newEvent);

    // Trim to max events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    this.notifyListeners();
    return newEvent;
  }

  getEvents(filter?: ActivityFilter): ActivityEvent[] {
    let filtered = [...this.events];

    if (filter) {
      if (filter.types && filter.types.length > 0) {
        filtered = filtered.filter((e) => filter.types!.includes(e.type));
      }

      if (filter.severity && filter.severity.length > 0) {
        filtered = filtered.filter((e) =>
          filter.severity!.includes(e.severity)
        );
      }

      if (filter.startDate) {
        filtered = filtered.filter((e) => e.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        filtered = filtered.filter((e) => e.timestamp <= filter.endDate!);
      }

      if (filter.read !== undefined) {
        filtered = filtered.filter((e) => e.read === filter.read);
      }
    }

    // Always return in reverse chronological order
    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  markAsRead(eventId: string): boolean {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.read = true;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  markAllAsRead(): void {
    this.events.forEach((e) => (e.read = true));
    this.notifyListeners();
  }

  getUnreadCount(): number {
    return this.events.filter((e) => !e.read).length;
  }

  groupByType(): Record<ActivityEventType, ActivityEvent[]> {
    const groups: Record<ActivityEventType, ActivityEvent[]> = {
      metric_change: [],
      alert: [],
      user_action: [],
      system: [],
      ai_insight: [],
    };

    for (const event of this.events) {
      groups[event.type].push(event);
    }

    // Sort each group by timestamp (reverse chronological)
    for (const type of Object.keys(groups) as ActivityEventType[]) {
      groups[type].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return groups;
  }

  groupByDate(): Record<string, ActivityEvent[]> {
    const groups: Record<string, ActivityEvent[]> = {};

    for (const event of this.events) {
      const date = event.timestamp.split("T")[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    }

    // Sort each group by timestamp (reverse chronological)
    for (const date of Object.keys(groups)) {
      groups[date].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return groups;
  }

  removeEvent(eventId: string): boolean {
    const index = this.events.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      this.events.splice(index, 1);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  clear(): void {
    this.events = [];
    this.notifyListeners();
  }

  subscribe(listener: (events: ActivityEvent[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const events = this.getEvents();
    this.listeners.forEach((listener) => listener(events));
  }

  // Serialization
  serialize(): string {
    return JSON.stringify(this.events);
  }

  deserialize(data: string): void {
    this.events = JSON.parse(data);
    this.notifyListeners();
  }
}

// Singleton instance
let activityFeedInstance: ActivityFeed | null = null;

export function getActivityFeed(): ActivityFeed {
  if (!activityFeedInstance) {
    activityFeedInstance = new ActivityFeed();
  }
  return activityFeedInstance;
}

// Helper to create events
export function createActivityEvent(
  type: ActivityEventType,
  title: string,
  description: string,
  severity: Severity = "info",
  metadata?: Record<string, unknown>
): Omit<ActivityEvent, "id" | "timestamp" | "read"> {
  return {
    type,
    title,
    description,
    severity,
    metadata,
  };
}
