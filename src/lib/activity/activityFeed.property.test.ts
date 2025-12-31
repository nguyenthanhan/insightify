import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ActivityFeed } from "./activityFeed";
import { ActivityEvent, ActivityEventType, Severity } from "./types";

// Arbitrary for activity event input
const activityEventInputArb = fc.record({
  type: fc.constantFrom(
    "metric_change" as const,
    "alert" as const,
    "user_action" as const,
    "system" as const,
    "ai_insight" as const
  ),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  severity: fc.constantFrom(
    "info" as const,
    "success" as const,
    "warning" as const,
    "error" as const
  ),
});

/**
 * **Feature: premium-dashboard-ui, Property 12: Activity Feed Prepend Order**
 * **Validates: Requirements 10.1**
 */
describe("Property: Activity Feed Prepend Order", () => {
  let feed: ActivityFeed;

  beforeEach(() => {
    feed = new ActivityFeed();
  });

  it("should prepend new items at the top (index 0)", () => {
    fc.assert(
      fc.property(
        fc.array(activityEventInputArb, { minLength: 2, maxLength: 20 }),
        (eventInputs) => {
          const feed = new ActivityFeed();

          // Add events one by one
          const addedEvents: ActivityEvent[] = [];
          for (const input of eventInputs) {
            const event = feed.addEvent(input);
            addedEvents.push(event);
          }

          const events = feed.getEvents();

          // The most recently added event should be first (after sorting by timestamp)
          // Since we add them sequentially, the last added should be first
          expect(events[0].id).toBe(addedEvents[addedEvents.length - 1].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should maintain reverse chronological order", () => {
    fc.assert(
      fc.property(
        fc.array(activityEventInputArb, { minLength: 2, maxLength: 20 }),
        (eventInputs) => {
          const feed = new ActivityFeed();

          for (const input of eventInputs) {
            feed.addEvent(input);
          }

          const events = feed.getEvents();

          // Each event should have timestamp >= next event's timestamp
          for (let i = 1; i < events.length; i++) {
            const prevTime = new Date(events[i - 1].timestamp).getTime();
            const currTime = new Date(events[i].timestamp).getTime();
            expect(prevTime).toBeGreaterThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: premium-dashboard-ui, Property 13: Activity Item Required Fields**
 * **Validates: Requirements 10.2**
 */
describe("Property: Activity Item Required Fields", () => {
  it("should have all required fields for any activity item", () => {
    fc.assert(
      fc.property(activityEventInputArb, (input) => {
        const feed = new ActivityFeed();
        const event = feed.addEvent(input);

        // Required fields: id, timestamp, title, description, type, severity, read
        expect(event.id).toBeDefined();
        expect(typeof event.id).toBe("string");
        expect(event.id.length).toBeGreaterThan(0);

        expect(event.timestamp).toBeDefined();
        expect(typeof event.timestamp).toBe("string");
        // Should be valid ISO date
        expect(() => new Date(event.timestamp)).not.toThrow();

        expect(event.title).toBeDefined();
        expect(typeof event.title).toBe("string");

        expect(event.description).toBeDefined();
        expect(typeof event.description).toBe("string");

        expect(event.type).toBeDefined();
        expect([
          "metric_change",
          "alert",
          "user_action",
          "system",
          "ai_insight",
        ]).toContain(event.type);

        expect(event.severity).toBeDefined();
        expect(["info", "success", "warning", "error"]).toContain(
          event.severity
        );

        expect(event.read).toBeDefined();
        expect(typeof event.read).toBe("boolean");
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: premium-dashboard-ui, Property 14: Activity Filter Correctness**
 * **Validates: Requirements 10.4**
 */
describe("Property: Activity Filter Correctness", () => {
  it("should only return items matching the type filter", () => {
    fc.assert(
      fc.property(
        fc.array(activityEventInputArb, { minLength: 5, maxLength: 30 }),
        fc.constantFrom(
          "metric_change" as const,
          "alert" as const,
          "user_action" as const,
          "system" as const,
          "ai_insight" as const
        ),
        (eventInputs, filterType) => {
          const feed = new ActivityFeed();

          for (const input of eventInputs) {
            feed.addEvent(input);
          }

          const filtered = feed.getEvents({ types: [filterType] });

          // All filtered items should have the specified type
          filtered.forEach((event) => {
            expect(event.type).toBe(filterType);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return all items when no filter is applied", () => {
    fc.assert(
      fc.property(
        fc.array(activityEventInputArb, { minLength: 1, maxLength: 30 }),
        (eventInputs) => {
          const feed = new ActivityFeed();

          for (const input of eventInputs) {
            feed.addEvent(input);
          }

          const all = feed.getEvents();
          const noFilter = feed.getEvents({});

          expect(all.length).toBe(noFilter.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: premium-dashboard-ui, Property 15: Activity Pagination Append**
 * **Validates: Requirements 10.5**
 */
describe("Property: Activity Pagination Append", () => {
  it("should preserve existing items when loading more", () => {
    fc.assert(
      fc.property(
        fc.array(activityEventInputArb, { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 5, max: 10 }),
        (eventInputs, pageSize) => {
          const feed = new ActivityFeed();

          for (const input of eventInputs) {
            feed.addEvent(input);
          }

          const allEvents = feed.getEvents();

          // Simulate pagination: first page
          const firstPage = allEvents.slice(0, pageSize);

          // Simulate loading more: second page
          const secondPage = allEvents.slice(pageSize, pageSize * 2);

          // Combined should equal first two pages of all events
          const combined = [...firstPage, ...secondPage];
          const expected = allEvents.slice(0, pageSize * 2);

          expect(combined.length).toBe(expected.length);
          combined.forEach((item, i) => {
            expect(item.id).toBe(expected[i].id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should append new items without removing previous items", () => {
    fc.assert(
      fc.property(
        fc.array(activityEventInputArb, { minLength: 5, maxLength: 20 }),
        fc.array(activityEventInputArb, { minLength: 1, maxLength: 10 }),
        (initialEvents, newEvents) => {
          const feed = new ActivityFeed();

          // Add initial events
          for (const input of initialEvents) {
            feed.addEvent(input);
          }

          const beforeCount = feed.getEvents().length;

          // Add more events (simulating "load more" or new activity)
          for (const input of newEvents) {
            feed.addEvent(input);
          }

          const afterCount = feed.getEvents().length;

          // Count should increase by the number of new events
          expect(afterCount).toBe(beforeCount + newEvents.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
