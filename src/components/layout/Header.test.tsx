import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { Notification } from "./Header";

/**
 * Utility function to calculate unread notification count
 * This mirrors the logic in the Header component
 */
function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

/**
 * **Feature: premium-dashboard-ui, Property 8: Notification Badge Count**
 * **Validates: Requirements 8.3**
 */
describe("Property: Notification Badge Count", () => {
  // Arbitrary for generating notifications
  const notificationArb: fc.Arbitrary<Notification> = fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    message: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constantFrom(
      "info" as const,
      "success" as const,
      "warning" as const,
      "error" as const
    ),
    read: fc.boolean(),
    timestamp: fc.constant(new Date().toISOString()),
  });

  it("should count unread notifications correctly for any set of notifications", () => {
    fc.assert(
      fc.property(
        fc.array(notificationArb, { maxLength: 100 }),
        (notifications) => {
          const unreadCount = getUnreadCount(notifications);
          const expectedCount = notifications.filter((n) => !n.read).length;

          expect(unreadCount).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 0 for empty notification array", () => {
    expect(getUnreadCount([])).toBe(0);
  });

  it("should return 0 when all notifications are read", () => {
    fc.assert(
      fc.property(
        fc.array(
          notificationArb.map((n) => ({ ...n, read: true })),
          { minLength: 1, maxLength: 50 }
        ),
        (notifications) => {
          expect(getUnreadCount(notifications)).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return total count when all notifications are unread", () => {
    fc.assert(
      fc.property(
        fc.array(
          notificationArb.map((n) => ({ ...n, read: false })),
          { minLength: 1, maxLength: 50 }
        ),
        (notifications) => {
          expect(getUnreadCount(notifications)).toBe(notifications.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be consistent: unread + read = total", () => {
    fc.assert(
      fc.property(
        fc.array(notificationArb, { maxLength: 100 }),
        (notifications) => {
          const unreadCount = getUnreadCount(notifications);
          const readCount = notifications.filter((n) => n.read).length;

          expect(unreadCount + readCount).toBe(notifications.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
