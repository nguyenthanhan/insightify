import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  LayoutSystem,
  createLayout,
  createWidget,
  createDefaultSalesLayout,
} from "./layoutSystem";
import { Widget, GridPosition, GridSize, DashboardLayout } from "./types";

describe("LayoutSystem", () => {
  let layout: LayoutSystem;

  beforeEach(() => {
    layout = createLayout({
      name: "Test Layout",
      gridColumns: 12,
      gridRows: 8,
    });
  });

  describe("Initialization", () => {
    it("should create layout with default values", () => {
      const defaultLayout = createLayout();
      const result = defaultLayout.getLayout();

      expect(result.name).toBe("Default Layout");
      expect(result.gridColumns).toBe(12);
      expect(result.gridRows).toBe(8);
      expect(result.widgets).toEqual([]);
    });

    it("should create layout with custom values", () => {
      const result = layout.getLayout();

      expect(result.name).toBe("Test Layout");
      expect(result.gridColumns).toBe(12);
      expect(result.gridRows).toBe(8);
    });
  });

  describe("Widget Management", () => {
    it("should add widget to layout", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      expect(widget.id).toBeDefined();
      expect(layout.getLayout().widgets.length).toBe(1);
    });

    it("should remove widget from layout", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      const removed = layout.removeWidget(widget.id);
      expect(removed).toBe(true);
      expect(layout.getLayout().widgets.length).toBe(0);
    });

    it("should return false when removing non-existent widget", () => {
      const removed = layout.removeWidget("non-existent");
      expect(removed).toBe(false);
    });

    it("should get widget by id", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      const found = layout.getWidget(widget.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe("Test Widget");
    });
  });

  describe("Position Updates", () => {
    it("should update widget position", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      const updated = layout.updateWidgetPosition(widget.id, { x: 5, y: 3 });
      expect(updated).toBe(true);

      const found = layout.getWidget(widget.id);
      expect(found?.position).toEqual({ x: 5, y: 3 });
    });

    it("should reject position outside grid bounds", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      const updated = layout.updateWidgetPosition(widget.id, { x: 10, y: 0 });
      expect(updated).toBe(false);
    });

    it("should reject overlapping positions", () => {
      layout.addWidget({
        type: "metric",
        title: "Widget A",
        position: { x: 0, y: 0 },
        size: { width: 4, height: 2 },
        config: {},
      });

      const widgetB = layout.addWidget({
        type: "metric",
        title: "Widget B",
        position: { x: 4, y: 0 },
        size: { width: 4, height: 2 },
        config: {},
      });

      // Try to move B to overlap with A
      const updated = layout.updateWidgetPosition(widgetB.id, { x: 2, y: 0 });
      expect(updated).toBe(false);
    });

    it("should move widget by delta", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 2, y: 2 },
        size: { width: 2, height: 2 },
        config: {},
      });

      const moved = layout.moveWidget(widget.id, 3, 1);
      expect(moved).toBe(true);

      const found = layout.getWidget(widget.id);
      expect(found?.position).toEqual({ x: 5, y: 3 });
    });
  });

  describe("Size Updates", () => {
    it("should update widget size", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      const updated = layout.updateWidgetSize(widget.id, {
        width: 4,
        height: 3,
      });
      expect(updated).toBe(true);

      const found = layout.getWidget(widget.id);
      expect(found?.size).toEqual({ width: 4, height: 3 });
    });

    it("should reject size that exceeds grid bounds", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      const updated = layout.updateWidgetSize(widget.id, {
        width: 15,
        height: 2,
      });
      expect(updated).toBe(false);
    });

    it("should resize widget by delta", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      const resized = layout.resizeWidget(widget.id, 2, 1);
      expect(resized).toBe(true);

      const found = layout.getWidget(widget.id);
      expect(found?.size).toEqual({ width: 5, height: 3 });
    });
  });

  describe("Config Updates", () => {
    it("should update widget config", () => {
      const widget = layout.addWidget({
        type: "metric",
        title: "Test Widget",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: { dataSource: "old" },
      });

      const updated = layout.updateWidgetConfig(widget.id, {
        dataSource: "new",
        refreshInterval: 5000,
      });
      expect(updated).toBe(true);

      const found = layout.getWidget(widget.id);
      expect(found?.config.dataSource).toBe("new");
      expect(found?.config.refreshInterval).toBe(5000);
    });
  });

  describe("Validation", () => {
    it("should validate empty layout", () => {
      const result = layout.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should detect overlapping widgets", () => {
      // Manually create overlapping widgets by bypassing validation
      const layoutData = layout.getLayout();
      layoutData.widgets.push(
        {
          id: "a",
          type: "metric",
          title: "A",
          position: { x: 0, y: 0 },
          size: { width: 4, height: 2 },
          config: {},
        },
        {
          id: "b",
          type: "metric",
          title: "B",
          position: { x: 2, y: 0 },
          size: { width: 4, height: 2 },
          config: {},
        }
      );

      const newLayout = createLayout(layoutData);
      const result = newLayout.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("overlap"))).toBe(true);
    });
  });

  describe("Grid Dimensions", () => {
    it("should update grid dimensions", () => {
      layout.setGridDimensions(16, 10);
      const result = layout.getLayout();

      expect(result.gridColumns).toBe(16);
      expect(result.gridRows).toBe(10);
    });

    it("should enforce minimum dimensions", () => {
      layout.setGridDimensions(0, -5);
      const result = layout.getLayout();

      expect(result.gridColumns).toBe(1);
      expect(result.gridRows).toBe(1);
    });
  });

  describe("Clear", () => {
    it("should clear all widgets", () => {
      layout.addWidget({
        type: "metric",
        title: "Widget 1",
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      layout.addWidget({
        type: "chart",
        title: "Widget 2",
        position: { x: 3, y: 0 },
        size: { width: 3, height: 2 },
        config: {},
      });

      layout.clear();
      expect(layout.getLayout().widgets.length).toBe(0);
    });
  });

  describe("Preset Layouts", () => {
    it("should create default sales layout", () => {
      const salesLayout = createDefaultSalesLayout();
      const result = salesLayout.getLayout();

      expect(result.name).toBe("Sales Dashboard");
      expect(result.widgets.length).toBeGreaterThan(0);
      expect(salesLayout.validate().valid).toBe(true);
    });
  });

  describe("Helper Functions", () => {
    it("should create widget with createWidget helper", () => {
      const widget = createWidget(
        "metric",
        "Test",
        { x: 0, y: 0 },
        { width: 3, height: 2 },
        { dataSource: "test" }
      );

      expect(widget.type).toBe("metric");
      expect(widget.title).toBe("Test");
      expect(widget.config.dataSource).toBe("test");
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 19: Dashboard Layout Round-Trip**
   * **Validates: Requirements 10.5**
   */
  describe("Property: Dashboard Layout Round-Trip", () => {
    const widgetTypeArb = fc.constantFrom(
      "metric",
      "chart",
      "table",
      "activity",
      "custom"
    ) as fc.Arbitrary<"metric" | "chart" | "table" | "activity" | "custom">;

    const positionArb = (maxX: number, maxY: number) =>
      fc.record({
        x: fc.integer({ min: 0, max: maxX }),
        y: fc.integer({ min: 0, max: maxY }),
      });

    const sizeArb = (maxW: number, maxH: number) =>
      fc.record({
        width: fc.integer({ min: 1, max: maxW }),
        height: fc.integer({ min: 1, max: maxH }),
      });

    const widgetArb = fc.record({
      id: fc.uuid(),
      type: widgetTypeArb,
      title: fc.string({ minLength: 1, maxLength: 50 }),
      position: positionArb(8, 5),
      size: sizeArb(4, 3),
      config: fc.record({
        dataSource: fc.option(fc.string(), { nil: undefined }),
        refreshInterval: fc.option(fc.integer({ min: 1000, max: 60000 }), {
          nil: undefined,
        }),
      }),
    });

    const layoutArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      widgets: fc.array(widgetArb, { minLength: 0, maxLength: 3 }),
      gridColumns: fc.constant(12),
      gridRows: fc.constant(8),
    });

    it("should round-trip serialize/deserialize any valid layout", () => {
      fc.assert(
        fc.property(layoutArb, (layoutData) => {
          const system = new LayoutSystem(layoutData);
          const serialized = system.serialize();
          const deserialized = system.deserialize(serialized);

          // Check core properties match
          expect(deserialized.id).toBe(layoutData.id);
          expect(deserialized.name).toBe(layoutData.name);
          expect(deserialized.gridColumns).toBe(layoutData.gridColumns);
          expect(deserialized.gridRows).toBe(layoutData.gridRows);
          expect(deserialized.widgets.length).toBe(layoutData.widgets.length);

          // Check each widget
          for (let i = 0; i < layoutData.widgets.length; i++) {
            const original = layoutData.widgets[i];
            const restored = deserialized.widgets[i];

            expect(restored.id).toBe(original.id);
            expect(restored.type).toBe(original.type);
            expect(restored.title).toBe(original.title);
            expect(restored.position).toEqual(original.position);
            expect(restored.size).toEqual(original.size);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve layout structure through multiple round-trips", () => {
      fc.assert(
        fc.property(layoutArb, (layoutData) => {
          const system = new LayoutSystem(layoutData);

          // Multiple round-trips
          let serialized = system.serialize();
          for (let i = 0; i < 3; i++) {
            system.deserialize(serialized);
            serialized = system.serialize();
          }

          const final = JSON.parse(serialized) as DashboardLayout;

          expect(final.id).toBe(layoutData.id);
          expect(final.widgets.length).toBe(layoutData.widgets.length);

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
});
