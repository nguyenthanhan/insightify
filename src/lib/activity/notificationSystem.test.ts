import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { NotificationSystem } from "./notificationSystem";
import { Severity } from "./types";

describe("NotificationSystem", () => {
  let system: NotificationSystem;

  beforeEach(() => {
    vi.useFakeTimers();
    system = new NotificationSystem();
  });

  afterEach(() => {
    vi.useRealTimers();
    system.clear();
  });

  describe("Show Notifications", () => {
    it("should show notification and return id", () => {
      const id = system.show({
        title: "Test",
        message: "Test message",
        severity: "info",
      });

      expect(id).toBeDefined();
      expect(system.getActive().length).toBe(1);
    });

    it("should auto-dismiss after duration", () => {
      system.show({
        title: "Test",
        message: "Test message",
        severity: "info",
        duration: 3000,
      });

      expect(system.getActive().length).toBe(1);

      vi.advanceTimersByTime(3000);

      expect(system.getActive().length).toBe(0);
    });

    it("should not auto-dismiss when duration is 0", () => {
      system.show({
        title: "Test",
        message: "Test message",
        severity: "error",
        duration: 0,
      });

      vi.advanceTimersByTime(10000);

      expect(system.getActive().length).toBe(1);
    });
  });

  describe("Dismiss Notifications", () => {
    it("should dismiss notification by id", () => {
      const id = system.show({
        title: "Test",
        message: "Test message",
        severity: "info",
        duration: 0,
      });

      expect(system.getActive().length).toBe(1);
      system.dismiss(id);
      expect(system.getActive().length).toBe(0);
    });

    it("should dismiss all notifications", () => {
      system.show({
        title: "Test 1",
        message: "Message 1",
        severity: "info",
        duration: 0,
      });
      system.show({
        title: "Test 2",
        message: "Message 2",
        severity: "warning",
        duration: 0,
      });
      system.show({
        title: "Test 3",
        message: "Message 3",
        severity: "error",
        duration: 0,
      });

      expect(system.getActive().length).toBe(3);
      system.dismissAll();
      expect(system.getActive().length).toBe(0);
    });
  });

  describe("Unread Count", () => {
    it("should count active notifications", () => {
      system.show({
        title: "Test 1",
        message: "Message 1",
        severity: "info",
        duration: 0,
      });
      system.show({
        title: "Test 2",
        message: "Message 2",
        severity: "warning",
        duration: 0,
      });

      expect(system.getUnreadCount()).toBe(2);

      const notifications = system.getActive();
      system.dismiss(notifications[0].id);

      expect(system.getUnreadCount()).toBe(1);
    });
  });

  describe("Subscription", () => {
    it("should notify listeners on changes", () => {
      const listener = vi.fn();
      system.subscribe(listener);

      system.show({
        title: "Test",
        message: "Message",
        severity: "info",
        duration: 0,
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ title: "Test" })])
      );
    });

    it("should unsubscribe listener", () => {
      const listener = vi.fn();
      const unsubscribe = system.subscribe(listener);

      system.show({
        title: "Test 1",
        message: "Message",
        severity: "info",
        duration: 0,
      });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      system.show({
        title: "Test 2",
        message: "Message",
        severity: "info",
        duration: 0,
      });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 22: Notification Badge Count**
   * **Validates: Requirements 12.4**
   */
  describe("Property: Notification Badge Count", () => {
    const severityArb = fc.constantFrom(
      "info",
      "warning",
      "success",
      "error"
    ) as fc.Arbitrary<Severity>;

    const notificationArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }),
      message: fc.string({ minLength: 1, maxLength: 100 }),
      severity: severityArb,
      duration: fc.constant(0), // Don't auto-dismiss for testing
    });

    it("should have badge count equal to number of active notifications", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArb, { minLength: 0, maxLength: 20 }),
          fc.array(fc.integer({ min: 0, max: 19 }), {
            minLength: 0,
            maxLength: 10,
          }),
          (notifications, dismissIndices) => {
            const testSystem = new NotificationSystem();

            // Show all notifications
            const ids: string[] = [];
            for (const config of notifications) {
              ids.push(testSystem.show(config));
            }

            // Dismiss some notifications
            const uniqueDismissIndices = [...new Set(dismissIndices)].filter(
              (i) => i < ids.length
            );
            for (const index of uniqueDismissIndices) {
              testSystem.dismiss(ids[index]);
            }

            // Badge count should equal active notifications
            const expectedCount =
              notifications.length - uniqueDismissIndices.length;
            const actualCount = testSystem.getUnreadCount();

            testSystem.clear();
            return actualCount === expectedCount;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
