import { useState, useEffect } from "react";
import { Notification, Severity } from "@/lib/activity/types";
import { getNotificationSystem } from "@/lib/activity/notificationSystem";

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function Toast({ notification, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 200);
  };

  const getSeverityStyles = (severity: Severity) => {
    switch (severity) {
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-900",
          border: "border-green-200 dark:border-green-700",
          icon: "text-green-500",
          title: "text-green-800 dark:text-green-200",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900",
          border: "border-yellow-200 dark:border-yellow-700",
          icon: "text-yellow-500",
          title: "text-yellow-800 dark:text-yellow-200",
        };
      case "error":
        return {
          bg: "bg-red-50 dark:bg-red-900",
          border: "border-red-200 dark:border-red-700",
          icon: "text-red-500",
          title: "text-red-800 dark:text-red-200",
        };
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-900",
          border: "border-blue-200 dark:border-blue-700",
          icon: "text-blue-500",
          title: "text-blue-800 dark:text-blue-200",
        };
    }
  };

  const getIcon = (severity: Severity) => {
    switch (severity) {
      case "success":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const styles = getSeverityStyles(notification.severity);

  return (
    <div
      className={`
        ${styles.bg} ${styles.border}
        border rounded-lg shadow-lg p-4 max-w-sm w-full
        transform transition-all duration-200
        ${
          isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
        }
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={styles.icon}>{getIcon(notification.severity)}</div>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${styles.title}`}>
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notification.message}
          </p>

          {notification.action && (
            <button
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              onClick={notification.action.onClick}
            >
              {notification.action.label}
            </button>
          )}
        </div>

        <button
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          onClick={handleDismiss}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const system = getNotificationSystem();
    setNotifications(system.getActive());
    return system.subscribe(setNotifications);
  }, []);

  const handleDismiss = (id: string) => {
    getNotificationSystem().dismiss(id);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
