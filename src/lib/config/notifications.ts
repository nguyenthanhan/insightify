export interface NotificationConfig {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "error";
  read: boolean;
}

// Sample notifications for demo purposes
export const SAMPLE_NOTIFICATIONS: NotificationConfig[] = [
  {
    id: "1",
    title: "New Sale",
    message: "You have a new sale of $1,234",
    type: "success",
    read: false,
  },
  {
    id: "2",
    title: "Alert",
    message: "Revenue target reached 90%",
    type: "warning",
    read: false,
  },
  {
    id: "3",
    title: "Update",
    message: "Dashboard data refreshed",
    type: "info",
    read: true,
  },
];

// Create notifications with timestamps
export function createSampleNotifications(): Array<
  NotificationConfig & { timestamp: string }
> {
  return SAMPLE_NOTIFICATIONS.map((notification) => ({
    ...notification,
    timestamp: new Date().toISOString(),
  }));
}
