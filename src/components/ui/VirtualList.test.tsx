import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import { VirtualList } from "./VirtualList";

describe("VirtualList", () => {
  const createItems = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: i, name: `Item ${i}` }));

  describe("basic rendering", () => {
    it("should render all items when below threshold", () => {
      const items = createItems(10);
      render(
        <VirtualList
          items={items}
          itemHeight={50}
          threshold={50}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      // All items should be rendered
      expect(screen.getByText("Item 0")).toBeInTheDocument();
      expect(screen.getByText("Item 9")).toBeInTheDocument();
    });

    it("should have list role", () => {
      const items = createItems(10);
      render(
        <VirtualList
          items={items}
          itemHeight={50}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("should render items with listitem role", () => {
      const items = createItems(5);
      render(
        <VirtualList
          items={items}
          itemHeight={50}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBe(5);
    });
  });

  describe("virtualization", () => {
    it("should virtualize when above threshold", () => {
      const items = createItems(100);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          threshold={50}
          containerHeight={200}
          overscan={2}
          renderItem={(item) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
        />
      );

      // Should not render all 100 items
      const renderedItems = container.querySelectorAll(
        '[data-testid^="item-"]'
      );
      expect(renderedItems.length).toBeLessThan(100);
    });

    it("should render items within visible range plus overscan", () => {
      const items = createItems(100);
      const containerHeight = 200;
      const itemHeight = 50;
      const overscan = 2;

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={itemHeight}
          threshold={50}
          containerHeight={containerHeight}
          overscan={overscan}
          renderItem={(item) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
        />
      );

      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const maxRendered = visibleCount + overscan * 2;

      const renderedItems = container.querySelectorAll(
        '[data-testid^="item-"]'
      );
      expect(renderedItems.length).toBeLessThanOrEqual(maxRendered);
    });
  });

  describe("scroll behavior", () => {
    it("should update visible items on scroll", () => {
      const items = createItems(100);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          threshold={50}
          containerHeight={200}
          overscan={1}
          renderItem={(item) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
        />
      );

      const scrollContainer = container.querySelector('[role="list"]')!;

      // Initially, first items should be visible
      expect(
        container.querySelector('[data-testid="item-0"]')
      ).toBeInTheDocument();

      // Scroll down
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });

      // After scrolling, different items should be visible
      // Item 10 should now be in view (500 / 50 = 10)
      expect(
        container.querySelector('[data-testid="item-10"]')
      ).toBeInTheDocument();
    });
  });

  describe("custom key function", () => {
    it("should use custom key function", () => {
      const items = createItems(10);
      render(
        <VirtualList
          items={items}
          itemHeight={50}
          renderItem={(item) => <div>{item.name}</div>}
          getItemKey={(item) => `custom-${item.id}`}
        />
      );

      // Should render without errors
      expect(screen.getByText("Item 0")).toBeInTheDocument();
    });
  });

  /**
   * **Feature: code-optimization, Property 6: Virtualization Render Count**
   * **Validates: Requirements 6.1**
   *
   * For any list with more than the virtualization threshold items,
   * the number of rendered DOM elements SHALL be less than or equal to
   * the visible window size plus overscan, not the total item count.
   */
  describe("Property 6: Virtualization Render Count", () => {
    it("should render fewer items than total when virtualized", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 60, max: 500 }), // Total items (above threshold)
          fc.integer({ min: 100, max: 500 }), // Container height
          fc.integer({ min: 20, max: 100 }), // Item height
          fc.integer({ min: 1, max: 5 }), // Overscan
          (totalItems, containerHeight, itemHeight, overscan) => {
            const items = Array.from({ length: totalItems }, (_, i) => ({
              id: i,
              name: `Item ${i}`,
            }));

            const { container } = render(
              <VirtualList
                items={items}
                itemHeight={itemHeight}
                threshold={50}
                containerHeight={containerHeight}
                overscan={overscan}
                renderItem={(item) => (
                  <div data-testid={`item-${item.id}`}>{item.name}</div>
                )}
              />
            );

            const renderedItems = container.querySelectorAll(
              '[data-testid^="item-"]'
            );
            const visibleCount = Math.ceil(containerHeight / itemHeight);
            const maxExpected = visibleCount + overscan * 2;

            // Rendered items should be less than or equal to max expected
            expect(renderedItems.length).toBeLessThanOrEqual(maxExpected);
            // And definitely less than total items
            expect(renderedItems.length).toBeLessThan(totalItems);

            // Cleanup
            container.remove();
          }
        ),
        { numRuns: 50 } // Reduced runs due to DOM operations
      );
    });

    it("should render all items when below threshold (property)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 49 }), // Total items (below threshold of 50)
          (totalItems) => {
            const items = Array.from({ length: totalItems }, (_, i) => ({
              id: i,
              name: `Item ${i}`,
            }));

            const { container } = render(
              <VirtualList
                items={items}
                itemHeight={50}
                threshold={50}
                containerHeight={400}
                renderItem={(item) => (
                  <div data-testid={`item-${item.id}`}>{item.name}</div>
                )}
              />
            );

            const renderedItems = container.querySelectorAll(
              '[data-testid^="item-"]'
            );

            // All items should be rendered
            expect(renderedItems.length).toBe(totalItems);

            // Cleanup
            container.remove();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe("accessibility", () => {
    it("should have aria-rowcount when virtualized", () => {
      const items = createItems(100);
      render(
        <VirtualList
          items={items}
          itemHeight={50}
          threshold={50}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      const list = screen.getByRole("list");
      expect(list).toHaveAttribute("aria-rowcount", "100");
    });

    it("should have aria-rowindex on items when virtualized", () => {
      const items = createItems(100);
      render(
        <VirtualList
          items={items}
          itemHeight={50}
          threshold={50}
          containerHeight={200}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      const listItems = screen.getAllByRole("listitem");
      // First visible item should have aria-rowindex
      expect(listItems[0]).toHaveAttribute("aria-rowindex");
    });
  });
});
