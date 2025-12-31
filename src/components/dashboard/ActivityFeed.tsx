import { useState, useEffect } from "react";
import { ActivityEvent, ActivityFilter, Severity } from "@/lib/activity/types";
import { getActivityFeed } from "@/lib/activity/activityFeed";

interface ActivityFeedProps {
  filter?: ActivityFilter;
  maxItems?: number;
  pageSize?: number;
  showFilters?: boolean;
  onEventClick?: (event: ActivityEvent) => void;
}

export function ActivityFeedComponent({
  filter,
  maxItems = 100,
  pageSize = 10,
  showFilters = true,
  onEventClick,
}: ActivityFeedProps) {
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([]);
  const [displayedCount, setDisplayedCount] = useState(pageSize);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>(
    filter || {}
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const feed = getActivityFeed();
    const updateEvents = () => {
      const filtered = feed.getEvents(activeFilter);
      setAllEvents(filtered.slice(0, maxItems));
    };

    updateEvents();
    return feed.subscribe(updateEvents);
  }, [activeFilter, maxItems]);

  const events = allEvents.slice(0, displayedCount);
  const hasMore = displayedCount < allEvents.length;

  const handleLoadMore = () => {
    setIsLoading(true);
    // Simulate loading delay for smooth animation
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + pageSize, allEvents.length));
      setIsLoading(false);
    }, 300);
  };

  const getSeverityStyles = (severity: Severity) => {
    switch (severity) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getTypeIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "metric_change":
        return (
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
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case "alert":
        return (
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "user_action":
        return (
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case "ai_insight":
        return (
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
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        );
      default:
        return (
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            className={`px-2 py-1 text-xs rounded ${
              !activeFilter.types
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
            onClick={() =>
              setActiveFilter({ ...activeFilter, types: undefined })
            }
          >
            All
          </button>
          {["alert", "metric_change", "ai_insight", "system"].map((type) => (
            <button
              key={type}
              className={`px-2 py-1 text-xs rounded capitalize ${
                activeFilter.types?.includes(type as ActivityEvent["type"])
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
              onClick={() =>
                setActiveFilter({
                  ...activeFilter,
                  types: [type as ActivityEvent["type"]],
                })
              }
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>
      )}

      {/* Event List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No activity yet</div>
        ) : (
          <>
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all duration-300
                  ${
                    event.read
                      ? "bg-white dark:bg-gray-800"
                      : "bg-blue-50 dark:bg-gray-700"
                  }
                  border-gray-200 dark:border-gray-600
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  animate-slide-up
                `}
                style={{ animationDelay: `${(index % pageSize) * 50}ms` }}
                onClick={() => {
                  getActivityFeed().markAsRead(event.id);
                  onEventClick?.(event);
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-full ${getSeverityStyles(
                      event.severity
                    )}`}
                  >
                    {getTypeIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {event.title}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!event.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                  )}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full py-2 mt-2 text-sm text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  `Load more (${allEvents.length - displayedCount} remaining)`
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ActivityFeedComponent;
