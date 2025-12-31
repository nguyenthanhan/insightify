import { v4 as uuidv4 } from "uuid";
import { Notification, NotificationConfig, Severity } from "./types";

const DEFAULT_DURATION = 5000;

export class NotificationSystem {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  show(config: NotificationConfig): string {
    const notification: Notification = {
      ...config,
      id: config.id || uuidv4(),
      timestamp: new Date().toISOString(),
      dismissed: false,
    };

    this.notifications.push(notification);
    this.notifyListeners();

    // Auto-dismiss after duration
    if (config.duration !== 0) {
      const duration = config.duration || DEFAULT_DURATION;
      const timer = setTimeout(() => {
        this.dismiss(notification.id);
      }, duration);
      this.timers.set(notification.id, timer);
    }

    return notification.id;
  }

  dismiss(notificationId: string): boolean {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.dismissed = true;

      // Clear auto-dismiss timer
      const timer = this.timers.get(notificationId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(notificationId);
      }

      this.notifyListeners();
      return true;
    }
    return false;
  }

  dismissAll(): void {
    this.notifications.forEach((n) => (n.dismissed = true));
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.notifyListeners();
  }

  getActive(): Notification[] {
    return this.notifications.filter((n) => !n.dismissed);
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.dismissed).length;
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const active = this.getActive();
    this.listeners.forEach((listener) => listener(active));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.notifications = [];
    this.notifyListeners();
  }
}

// Singleton instance
let notificationSystemInstance: NotificationSystem | null = null;

export function getNotificationSystem(): NotificationSystem {
  if (!notificationSystemInstance) {
    notificationSystemInstance = new NotificationSystem();
  }
  return notificationSystemInstance;
}

// Helper functions for common notification types
export function showInfo(
  title: string,
  message: string,
  duration?: number
): string {
  return getNotificationSystem().show({
    title,
    message,
    severity: "info",
    duration,
  });
}

export function showSuccess(
  title: string,
  message: string,
  duration?: number
): string {
  return getNotificationSystem().show({
    title,
    message,
    severity: "success",
    duration,
  });
}

export function showWarning(
  title: string,
  message: string,
  duration?: number
): string {
  return getNotificationSystem().show({
    title,
    message,
    severity: "warning",
    duration,
  });
}

export function showError(
  title: string,
  message: string,
  duration?: number
): string {
  return getNotificationSystem().show({
    title,
    message,
    severity: "error",
    duration: duration || 0, // Errors don't auto-dismiss by default
  });
}
