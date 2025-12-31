import {
  Skeleton,
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
} from "../ui/Skeleton";

/**
 * DashboardSkeleton - Loading placeholder for dashboard components
 * Shows a realistic skeleton of the dashboard layout while content loads
 */
export function DashboardSkeleton(): JSX.Element {
  return (
    <div className="animate-pulse space-y-6">
      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart height={280} />
        <SkeletonChart height={280} />
      </div>

      {/* Bottom Row - Table and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonTable rows={5} columns={4} />
        </div>
        <ActivityFeedSkeleton />
      </div>
    </div>
  );
}

/**
 * ActivityFeedSkeleton - Loading placeholder for activity feed
 */
function ActivityFeedSkeleton(): JSX.Element {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      role="status"
      aria-label="Loading activity feed..."
    >
      {/* Title */}
      <Skeleton variant="text" width="50%" height={20} className="mb-4" />

      {/* Activity Items */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="80%" height={14} />
              <Skeleton variant="text" width="40%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MetricsGridSkeleton - Loading placeholder for metrics grid only
 */
export function MetricsGridSkeleton(): JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * ChartsSkeleton - Loading placeholder for charts section
 */
export function ChartsSkeleton(): JSX.Element {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart height={280} />
      <SkeletonChart height={280} />
    </div>
  );
}

export default DashboardSkeleton;
