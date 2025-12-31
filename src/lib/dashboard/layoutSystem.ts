import { v4 as uuidv4 } from "uuid";
import {
  Widget,
  DashboardLayout,
  GridPosition,
  GridSize,
  WidgetType,
  WidgetConfig,
  LayoutValidationResult,
} from "./types";

const DEFAULT_GRID_COLUMNS = 12;
const DEFAULT_GRID_ROWS = 8;

export class LayoutSystem {
  private layout: DashboardLayout;

  constructor(layout?: Partial<DashboardLayout>) {
    this.layout = {
      id: layout?.id || uuidv4(),
      name: layout?.name || "Default Layout",
      widgets: layout?.widgets || [],
      gridColumns: layout?.gridColumns || DEFAULT_GRID_COLUMNS,
      gridRows: layout?.gridRows || DEFAULT_GRID_ROWS,
    };
  }

  getLayout(): DashboardLayout {
    return { ...this.layout, widgets: [...this.layout.widgets] };
  }

  getWidget(widgetId: string): Widget | undefined {
    return this.layout.widgets.find((w) => w.id === widgetId);
  }

  addWidget(widget: Omit<Widget, "id"> & { id?: string }): Widget {
    const newWidget: Widget = {
      ...widget,
      id: widget.id || uuidv4(),
    };

    // Validate position
    if (
      !this.isPositionValid(newWidget.position, newWidget.size, newWidget.id)
    ) {
      // Find next available position
      const position = this.findNextAvailablePosition(newWidget.size);
      newWidget.position = position;
    }

    this.layout.widgets.push(newWidget);
    return newWidget;
  }

  removeWidget(widgetId: string): boolean {
    const index = this.layout.widgets.findIndex((w) => w.id === widgetId);
    if (index === -1) return false;

    this.layout.widgets.splice(index, 1);
    return true;
  }

  updateWidgetPosition(widgetId: string, position: GridPosition): boolean {
    const widget = this.layout.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;

    // Validate new position
    if (!this.isPositionValid(position, widget.size, widgetId)) {
      return false;
    }

    widget.position = { ...position };
    return true;
  }

  updateWidgetSize(widgetId: string, size: GridSize): boolean {
    const widget = this.layout.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;

    // Validate new size
    if (!this.isPositionValid(widget.position, size, widgetId)) {
      return false;
    }

    widget.size = { ...size };
    return true;
  }

  updateWidgetConfig(widgetId: string, config: Partial<WidgetConfig>): boolean {
    const widget = this.layout.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;

    widget.config = { ...widget.config, ...config };
    return true;
  }

  moveWidget(widgetId: string, deltaX: number, deltaY: number): boolean {
    const widget = this.layout.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;

    const newPosition: GridPosition = {
      x: widget.position.x + deltaX,
      y: widget.position.y + deltaY,
    };

    return this.updateWidgetPosition(widgetId, newPosition);
  }

  resizeWidget(
    widgetId: string,
    deltaWidth: number,
    deltaHeight: number
  ): boolean {
    const widget = this.layout.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;

    const newSize: GridSize = {
      width: Math.max(1, widget.size.width + deltaWidth),
      height: Math.max(1, widget.size.height + deltaHeight),
    };

    return this.updateWidgetSize(widgetId, newSize);
  }

  setGridDimensions(columns: number, rows: number): void {
    this.layout.gridColumns = Math.max(1, columns);
    this.layout.gridRows = Math.max(1, rows);
  }

  validate(): LayoutValidationResult {
    const errors: string[] = [];

    // Check for overlapping widgets
    for (let i = 0; i < this.layout.widgets.length; i++) {
      const widgetA = this.layout.widgets[i];

      // Check bounds
      if (widgetA.position.x < 0 || widgetA.position.y < 0) {
        errors.push(`Widget ${widgetA.id} has negative position`);
      }

      if (
        widgetA.position.x + widgetA.size.width > this.layout.gridColumns ||
        widgetA.position.y + widgetA.size.height > this.layout.gridRows
      ) {
        errors.push(`Widget ${widgetA.id} extends beyond grid bounds`);
      }

      // Check overlaps
      for (let j = i + 1; j < this.layout.widgets.length; j++) {
        const widgetB = this.layout.widgets[j];
        if (this.widgetsOverlap(widgetA, widgetB)) {
          errors.push(`Widgets ${widgetA.id} and ${widgetB.id} overlap`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  serialize(): string {
    return JSON.stringify(this.layout);
  }

  deserialize(data: string): DashboardLayout {
    const parsed = JSON.parse(data) as DashboardLayout;
    this.layout = {
      id: parsed.id,
      name: parsed.name,
      widgets: parsed.widgets,
      gridColumns: parsed.gridColumns || DEFAULT_GRID_COLUMNS,
      gridRows: parsed.gridRows || DEFAULT_GRID_ROWS,
    };
    return this.getLayout();
  }

  clear(): void {
    this.layout.widgets = [];
  }

  // Helper methods

  private isPositionValid(
    position: GridPosition,
    size: GridSize,
    excludeWidgetId?: string
  ): boolean {
    // Check bounds
    if (position.x < 0 || position.y < 0) return false;
    if (position.x + size.width > this.layout.gridColumns) return false;
    if (position.y + size.height > this.layout.gridRows) return false;

    // Check overlaps with other widgets
    for (const widget of this.layout.widgets) {
      if (widget.id === excludeWidgetId) continue;

      const testWidget: Widget = {
        id: "test",
        type: "metric",
        title: "test",
        position,
        size,
        config: {},
      };

      if (this.widgetsOverlap(testWidget, widget)) {
        return false;
      }
    }

    return true;
  }

  private widgetsOverlap(a: Widget, b: Widget): boolean {
    const aRight = a.position.x + a.size.width;
    const aBottom = a.position.y + a.size.height;
    const bRight = b.position.x + b.size.width;
    const bBottom = b.position.y + b.size.height;

    return !(
      aRight <= b.position.x ||
      a.position.x >= bRight ||
      aBottom <= b.position.y ||
      a.position.y >= bBottom
    );
  }

  private findNextAvailablePosition(size: GridSize): GridPosition {
    // Scan grid row by row to find first available position
    for (let y = 0; y <= this.layout.gridRows - size.height; y++) {
      for (let x = 0; x <= this.layout.gridColumns - size.width; x++) {
        const position: GridPosition = { x, y };
        if (this.isPositionValid(position, size)) {
          return position;
        }
      }
    }

    // If no position found, return origin (will overlap)
    return { x: 0, y: 0 };
  }
}

// Factory functions

export function createLayout(options?: Partial<DashboardLayout>): LayoutSystem {
  return new LayoutSystem(options);
}

export function createWidget(
  type: WidgetType,
  title: string,
  position: GridPosition,
  size: GridSize,
  config?: WidgetConfig
): Omit<Widget, "id"> {
  return {
    type,
    title,
    position,
    size,
    config: config || {},
  };
}

// Preset layouts

export function createDefaultSalesLayout(): LayoutSystem {
  const layout = new LayoutSystem({
    name: "Sales Dashboard",
    gridColumns: 12,
    gridRows: 8,
  });

  layout.addWidget({
    type: "metric",
    title: "Total Revenue",
    position: { x: 0, y: 0 },
    size: { width: 3, height: 2 },
    config: { dataSource: "revenue" },
  });

  layout.addWidget({
    type: "metric",
    title: "Deals Won",
    position: { x: 3, y: 0 },
    size: { width: 3, height: 2 },
    config: { dataSource: "deals" },
  });

  layout.addWidget({
    type: "metric",
    title: "Conversion Rate",
    position: { x: 6, y: 0 },
    size: { width: 3, height: 2 },
    config: { dataSource: "conversion" },
  });

  layout.addWidget({
    type: "metric",
    title: "Pipeline Value",
    position: { x: 9, y: 0 },
    size: { width: 3, height: 2 },
    config: { dataSource: "pipeline" },
  });

  layout.addWidget({
    type: "chart",
    title: "Revenue Trend",
    position: { x: 0, y: 2 },
    size: { width: 8, height: 4 },
    config: {
      dataSource: "revenue_trend",
      visualization: { chartType: "line", animate: true },
    },
  });

  layout.addWidget({
    type: "table",
    title: "Top Performers",
    position: { x: 8, y: 2 },
    size: { width: 4, height: 4 },
    config: { dataSource: "top_performers" },
  });

  layout.addWidget({
    type: "activity",
    title: "Recent Activity",
    position: { x: 0, y: 6 },
    size: { width: 12, height: 2 },
    config: { dataSource: "activity" },
  });

  return layout;
}
