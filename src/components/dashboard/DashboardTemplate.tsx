import { DashboardType } from "@/types/agent";
import { getDashboardConfig } from "@/lib/config/dashboards";
import { ChartWidget } from "@/components/charts";
import MetricsGrid from "./MetricsGrid";
import DataTableWidget from "./DataTableWidget";
import AISuggestionsPanel from "./AISuggestionsPanel";

interface DashboardTemplateProps {
  dashboardType: DashboardType;
}

export function DashboardTemplate({ dashboardType }: DashboardTemplateProps) {
  const config = getDashboardConfig(dashboardType);
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`rounded-lg ${config.theme.bg} p-3 text-white`}>
          <Icon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {config.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {config.description}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid metrics={config.metrics} />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {config.charts.main.title}
          </h3>
          <ChartWidget config={config.charts.main} height={300} />
        </div>

        {/* Secondary Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {config.charts.secondary.title}
          </h3>
          <ChartWidget config={config.charts.secondary} height={300} />
        </div>
      </div>

      {/* Additional Content Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Third Chart/Table */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          {config.widgets.length > 0 ? (
            <>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {config.widgets[0].title}
              </h3>
              <DataTableWidget widget={config.widgets[0]} />
            </>
          ) : config.charts.tertiary ? (
            <>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {config.charts.tertiary.title}
              </h3>
              <ChartWidget config={config.charts.tertiary} height={250} />
            </>
          ) : null}
        </div>

        {/* Fourth Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          {config.charts.quaternary ? (
            <>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {config.charts.quaternary.title}
              </h3>
              <ChartWidget config={config.charts.quaternary} height={280} />
            </>
          ) : config.charts.tertiary && config.widgets.length > 0 ? (
            <>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {config.charts.tertiary.title}
              </h3>
              <ChartWidget config={config.charts.tertiary} height={280} />
            </>
          ) : null}
        </div>
      </div>

      {/* AI Suggestions */}
      <AISuggestionsPanel
        theme={config.theme}
        suggestions={config.aiSuggestions}
      />
    </div>
  );
}

export default DashboardTemplate;
