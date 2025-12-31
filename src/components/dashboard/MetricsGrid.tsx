import { MetricConfig } from "@/lib/config/dashboards/types";

interface MetricsGridProps {
  metrics: MetricConfig[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {metric.label}
            </span>
            <span
              className={`text-xs font-semibold ${
                metric.trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {metric.change}
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricsGrid;
