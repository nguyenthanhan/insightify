// Dashboard Widget Types

export type WidgetType = "metric" | "chart" | "table" | "activity" | "custom";

export interface GridPosition {
  x: number;
  y: number;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface VisualizationConfig {
  chartType?: "line" | "bar" | "pie" | "area" | "funnel" | "gauge";
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

export interface WidgetConfig {
  refreshInterval?: number;
  dataSource?: string;
  visualization?: VisualizationConfig;
  title?: string;
  subtitle?: string;
}

export interface WidgetData {
  value?: number | string;
  previousValue?: number | string;
  change?: number;
  trend?: "up" | "down" | "stable";
  chartData?: Array<Record<string, unknown>>;
  tableData?: {
    headers: string[];
    rows: Array<Record<string, unknown>>;
  };
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: GridPosition;
  size: GridSize;
  config: WidgetConfig;
  data?: WidgetData;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  gridColumns: number;
  gridRows: number;
}

export interface LayoutValidationResult {
  valid: boolean;
  errors: string[];
}
