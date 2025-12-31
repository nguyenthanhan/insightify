import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ActivityFeed, createActivityEvent } from "./activityFeed";
import { ActivityEvent, ActivityEventType, Severity } from "./types";

describe("ActivityFeed", () => {
  let feed: ActivityFeed;

  beforeEach(() => {
    feed = new ActivityFeed();
  });

  describe("Event Management", () => {
    it("should add event with generated id and timestamp", () => {
      const event = feed.addEvent({
        type: "alert",
        title: "Test Alert",
        description: "Test description",
        severity: "warning",
      });

      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.read).toBe(false);
    });

    it("should get events in reverse chronological order", () => {
      feed.addEvent(createActivityEvent("alert", "First", "First event"));
      feed.addEvent(createActivityEvent("alert", "Second", "Second event"));
      feed.addEvent(createActivityEvent("alert", "Third", "Third event"));

      const events = feed.getEvents();
      expect(events[0].title).toBe("Third");
      expect(events[1].title).toBe("Second");
      expect(events[2].title).toBe("First");
    });

    it("should remove event by id", () => {
      const event = feed.addEvent(
        createActivityEvent("alert", "Test", "Test event")
      );

      expect(feed.getEvents().length).toBe(1);
      feed.removeEvent(event.id);
      expect(feed.getEvents().length).toBe(0);
    });

    it("should clear all events", () => {
      feed.addEvent(createActivityEvent("alert", "Test 1", "Event 1"));
      feed.addEvent(createActivityEvent("alert", "Test 2", "Event 2"));

      feed.clear();
      expect(feed.getEvents().length).toBe(0);
    });
  });

  describe("Filtering", () => {
    beforeEach(() => {
      feed.addEvent(
        createActivityEvent("alert", "Alert 1", "Alert", "warning")
      );
      feed.addEvent(
        createActivityEvent("system", "System 1", "System", "info")
      );
      feed.addEvent(
        createActivityEvent("metric_change", "Metric 1", "Metric", "success")
      );
    });

    it("should filter by type", () => {
      const alerts = feed.getEvents({ types: ["alert"] });
      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe("alert");
    });

    it("should filter by severity", () => {
      const warnings = feed.getEvents({ severity: ["warning"] });
      expect(warnings.length).toBe(1);
      expect(warnings[0].severity).toBe("warning");
    });

    it("should filter by read status", () => {
      const events = feed.getEvents();
      feed.markAsRead(events[0].id);

      const unread = feed.getEvents({ read: false });
      expect(unread.length).toBe(2);

      const read = feed.getEvents({ read: true });
      expect(read.length).toBe(1);
    });
  });

  describe("Read Status", () => {
    it("should mark event as read", () => {
      const event = feed.addEvent(
        createActivityEvent("alert", "Test", "Test event")
      );

      expect(event.read).toBe(false);
      feed.markAsRead(event.id);

      const events = feed.getEvents();
      expect(events[0].read).toBe(true);
    });

    it("should mark all events as read", () => {
      feed.addEvent(createActivityEvent("alert", "Test 1", "Event 1"));
      feed.addEvent(createActivityEvent("alert", "Test 2", "Event 2"));

      expect(feed.getUnreadCount()).toBe(2);
      feed.markAllAsRead();
      expect(feed.getUnreadCount()).toBe(0);
    });

    it("should count unread events", () => {
      feed.addEvent(createActivityEvent("alert", "Test 1", "Event 1"));
      feed.addEvent(createActivityEvent("alert", "Test 2", "Event 2"));
      feed.addEvent(createActivityEvent("alert", "Test 3", "Event 3"));

      expect(feed.getUnreadCount()).toBe(3);

      const events = feed.getEvents();
      feed.markAsRead(events[0].id);
      expect(feed.getUnreadCount()).toBe(2);
    });
  });

  describe("Grouping", () => {
    it("should group events by type", () => {
      feed.addEvent(createActivityEvent("alert", "Alert 1", "Alert"));
      feed.addEvent(createActivityEvent("alert", "Alert 2", "Alert"));
      feed.addEvent(createActivityEvent("system", "System 1", "System"));

      const groups = feed.groupByType();
      expect(groups.alert.length).toBe(2);
      expect(groups.system.length).toBe(1);
      expect(groups.metric_change.length).toBe(0);
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize events", () => {
      feed.addEvent(createActivityEvent("alert", "Test 1", "Event 1"));
      feed.addEvent(createActivityEvent("system", "Test 2", "Event 2"));

      const serialized = feed.serialize();
      const newFeed = new ActivityFeed();
      newFeed.deserialize(serialized);

      expect(newFeed.getEvents().length).toBe(2);
    });
  });

  // Note: Property-based tests for chronological order and filtering
  // are in activityFeed.property.test.ts to avoid duplication
});
