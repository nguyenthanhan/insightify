import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { NavigationSystem, KeyboardShortcut } from "./navigationSystem";

describe("NavigationSystem", () => {
  let system: NavigationSystem;

  beforeEach(() => {
    system = new NavigationSystem();
  });

  describe("Shortcut Registration", () => {
    it("should register shortcut", () => {
      const action = vi.fn();
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action,
        enabled: true,
        category: "Test",
      });

      expect(system.getShortcuts().length).toBe(1);
    });

    it("should unregister shortcut by id", () => {
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action: vi.fn(),
        enabled: true,
        category: "Test",
      });

      const removed = system.unregisterShortcut("test");
      expect(removed).toBe(true);
      expect(system.getShortcuts().length).toBe(0);
    });

    it("should return false when unregistering non-existent shortcut", () => {
      const removed = system.unregisterShortcut("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("Shortcut Execution", () => {
    it("should execute shortcut by id", () => {
      const action = vi.fn();
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action,
        enabled: true,
        category: "Test",
      });

      const executed = system.executeShortcut("test");
      expect(executed).toBe(true);
      expect(action).toHaveBeenCalledTimes(1);
    });

    it("should not execute disabled shortcut", () => {
      const action = vi.fn();
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action,
        enabled: false,
        category: "Test",
      });

      const executed = system.executeShortcut("test");
      expect(executed).toBe(false);
      expect(action).not.toHaveBeenCalled();
    });

    it("should return false for non-existent shortcut", () => {
      const executed = system.executeShortcut("non-existent");
      expect(executed).toBe(false);
    });
  });

  describe("Enable/Disable", () => {
    it("should enable shortcut", () => {
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action: vi.fn(),
        enabled: false,
        category: "Test",
      });

      system.enableShortcut("test");
      const shortcuts = system.getShortcuts();
      expect(shortcuts[0].enabled).toBe(true);
    });

    it("should disable shortcut", () => {
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action: vi.fn(),
        enabled: true,
        category: "Test",
      });

      system.disableShortcut("test");
      const shortcuts = system.getShortcuts();
      expect(shortcuts[0].enabled).toBe(false);
    });

    it("should enable/disable entire system", () => {
      expect(system.isEnabled()).toBe(true);

      system.setEnabled(false);
      expect(system.isEnabled()).toBe(false);

      system.setEnabled(true);
      expect(system.isEnabled()).toBe(true);
    });
  });

  describe("Event Matching", () => {
    it("should match keyboard event to shortcut", () => {
      const action = vi.fn();
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action,
        enabled: true,
        category: "Test",
      });

      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
      });

      const match = system.matchEvent(event);
      expect(match).not.toBeNull();
      expect(match?.shortcut.id).toBe("test");
    });

    it("should not match when system is disabled", () => {
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action: vi.fn(),
        enabled: true,
        category: "Test",
      });

      system.setEnabled(false);

      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
      });

      const match = system.matchEvent(event);
      expect(match).toBeNull();
    });

    it("should not match disabled shortcut", () => {
      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test shortcut",
        action: vi.fn(),
        enabled: false,
        category: "Test",
      });

      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
      });

      const match = system.matchEvent(event);
      expect(match).toBeNull();
    });
  });

  describe("Categories", () => {
    it("should group shortcuts by category", () => {
      system.registerShortcut({
        id: "nav1",
        key: "k",
        modifiers: ["meta"],
        description: "Nav 1",
        action: vi.fn(),
        enabled: true,
        category: "Navigation",
      });

      system.registerShortcut({
        id: "nav2",
        key: "j",
        modifiers: ["meta"],
        description: "Nav 2",
        action: vi.fn(),
        enabled: true,
        category: "Navigation",
      });

      system.registerShortcut({
        id: "help1",
        key: "?",
        modifiers: ["shift"],
        description: "Help",
        action: vi.fn(),
        enabled: true,
        category: "Help",
      });

      const categories = system.getShortcutsByCategory();
      expect(categories["Navigation"].length).toBe(2);
      expect(categories["Help"].length).toBe(1);
    });
  });

  describe("Formatting", () => {
    it("should format shortcut for display", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test",
        action: vi.fn(),
        enabled: true,
        category: "Test",
      };

      const formatted = system.formatShortcut(shortcut);
      // Should contain the key
      expect(formatted.toLowerCase()).toContain("k");
    });
  });

  describe("Subscription", () => {
    it("should notify listeners on shortcut changes", () => {
      const listener = vi.fn();
      system.subscribe(listener);

      system.registerShortcut({
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test",
        action: vi.fn(),
        enabled: true,
        category: "Test",
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should unsubscribe listener", () => {
      const listener = vi.fn();
      const unsubscribe = system.subscribe(listener);

      system.registerShortcut({
        id: "test1",
        key: "k",
        modifiers: ["meta"],
        description: "Test 1",
        action: vi.fn(),
        enabled: true,
        category: "Test",
      });

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      system.registerShortcut({
        id: "test2",
        key: "j",
        modifiers: ["meta"],
        description: "Test 2",
        action: vi.fn(),
        enabled: true,
        category: "Test",
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 26: Keyboard Shortcut Execution**
   * **Validates: Requirements 15.1**
   */
  describe("Property: Keyboard Shortcut Execution", () => {
    const keyArb = fc.constantFrom(
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0"
    );

    const modifiersArb = fc.subarray(
      ["ctrl", "alt", "shift", "meta"] as const,
      { minLength: 0, maxLength: 3 }
    );

    it("should execute registered shortcut exactly once per trigger", () => {
      fc.assert(
        fc.property(keyArb, modifiersArb, (key, modifiers) => {
          const testSystem = new NavigationSystem();
          let executionCount = 0;

          testSystem.registerShortcut({
            id: "test",
            key,
            modifiers: modifiers as Array<"ctrl" | "alt" | "shift" | "meta">,
            description: "Test",
            action: () => {
              executionCount++;
            },
            enabled: true,
            category: "Test",
          });

          // Execute the shortcut
          testSystem.executeShortcut("test");

          // Should have executed exactly once
          return executionCount === 1;
        }),
        { numRuns: 100 }
      );
    });

    it("should not execute when shortcut is disabled", () => {
      fc.assert(
        fc.property(keyArb, modifiersArb, (key, modifiers) => {
          const testSystem = new NavigationSystem();
          let executionCount = 0;

          testSystem.registerShortcut({
            id: "test",
            key,
            modifiers: modifiers as Array<"ctrl" | "alt" | "shift" | "meta">,
            description: "Test",
            action: () => {
              executionCount++;
            },
            enabled: false, // Disabled
            category: "Test",
          });

          // Try to execute
          testSystem.executeShortcut("test");

          // Should not have executed
          return executionCount === 0;
        }),
        { numRuns: 100 }
      );
    });
  });
});
