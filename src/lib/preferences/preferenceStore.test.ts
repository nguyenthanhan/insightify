import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { PreferenceStore, UserPreferences } from "./preferenceStore";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("PreferenceStore", () => {
  let store: PreferenceStore;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    store = new PreferenceStore();
  });

  describe("Initialization", () => {
    it("should initialize with default preferences", () => {
      const prefs = store.get();
      expect(prefs.theme).toBe("system");
      expect(prefs.layout).toBe("grid");
      expect(prefs.verbosity).toBe("detailed");
    });

    it("should generate unique id", () => {
      const prefs = store.get();
      expect(prefs.id).toBeDefined();
      expect(prefs.id.length).toBeGreaterThan(0);
    });
  });

  describe("Preference Updates", () => {
    it("should update theme", () => {
      store.setTheme("dark");
      expect(store.get().theme).toBe("dark");
    });

    it("should update layout", () => {
      store.setLayout("sidebar");
      expect(store.get().layout).toBe("sidebar");
    });

    it("should update verbosity", () => {
      store.setVerbosity("brief");
      expect(store.get().verbosity).toBe("brief");
    });

    it("should update keyboard shortcuts", () => {
      store.setKeyboardShortcuts(false);
      expect(store.get().keyboardShortcutsEnabled).toBe(false);
    });

    it("should update notifications", () => {
      store.setNotifications(false);
      expect(store.get().notificationsEnabled).toBe(false);
    });

    it("should update export defaults", () => {
      store.setExportDefaults({ format: "json" });
      expect(store.get().exportDefaults.format).toBe("json");
    });

    it("should update dashboard settings", () => {
      store.setDashboardSettings({ refreshInterval: 60000 });
      expect(store.get().dashboardSettings.refreshInterval).toBe(60000);
    });

    it("should update multiple preferences at once", () => {
      store.set({
        theme: "dark",
        layout: "fullwidth",
        verbosity: "comprehensive",
      });

      const prefs = store.get();
      expect(prefs.theme).toBe("dark");
      expect(prefs.layout).toBe("fullwidth");
      expect(prefs.verbosity).toBe("comprehensive");
    });
  });

  describe("Reset", () => {
    it("should reset to default preferences", () => {
      store.setTheme("dark");
      store.setLayout("sidebar");

      store.reset();

      const prefs = store.get();
      expect(prefs.theme).toBe("system");
      expect(prefs.layout).toBe("grid");
    });
  });

  describe("Subscription", () => {
    it("should notify listeners on change", () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setTheme("dark");

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "dark" })
      );
    });

    it("should unsubscribe listener", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      store.setTheme("dark");
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.setTheme("light");
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("Serialization", () => {
    it("should serialize preferences", () => {
      store.setTheme("dark");
      const serialized = store.serialize();
      const parsed = JSON.parse(serialized);

      expect(parsed.theme).toBe("dark");
    });

    it("should deserialize preferences", () => {
      const data = JSON.stringify({
        theme: "dark",
        layout: "sidebar",
        verbosity: "brief",
      });

      store.deserialize(data);

      const prefs = store.get();
      expect(prefs.theme).toBe("dark");
      expect(prefs.layout).toBe("sidebar");
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 23: Preference Persistence Round-Trip**
   * **Validates: Requirements 13.4**
   */
  describe("Property: Preference Persistence Round-Trip", () => {
    const themeArb = fc.constantFrom("light", "dark", "system") as fc.Arbitrary<
      "light" | "dark" | "system"
    >;
    const layoutArb = fc.constantFrom(
      "grid",
      "sidebar",
      "fullwidth"
    ) as fc.Arbitrary<"grid" | "sidebar" | "fullwidth">;
    const verbosityArb = fc.constantFrom(
      "brief",
      "detailed",
      "comprehensive"
    ) as fc.Arbitrary<"brief" | "detailed" | "comprehensive">;
    const formatArb = fc.constantFrom("csv", "json", "pdf") as fc.Arbitrary<
      "csv" | "json" | "pdf"
    >;

    const preferencesArb = fc.record({
      theme: themeArb,
      themeId: fc.string({ minLength: 1, maxLength: 50 }),
      layout: layoutArb,
      verbosity: verbosityArb,
      keyboardShortcutsEnabled: fc.boolean(),
      notificationsEnabled: fc.boolean(),
      exportDefaults: fc.record({
        format: formatArb,
        includeMetadata: fc.boolean(),
      }),
      dashboardSettings: fc.record({
        refreshInterval: fc.integer({ min: 1000, max: 300000 }),
        showWelcomeMessage: fc.boolean(),
        defaultDashboard: fc.string({ minLength: 1, maxLength: 20 }),
      }),
    });

    it("should round-trip any valid preferences through serialization", () => {
      fc.assert(
        fc.property(preferencesArb, (prefs) => {
          const testStore = new PreferenceStore();
          testStore.set(prefs);

          const serialized = testStore.serialize();
          const newStore = new PreferenceStore();
          newStore.deserialize(serialized);

          const restored = newStore.get();

          // Check all preference values match
          expect(restored.theme).toBe(prefs.theme);
          expect(restored.layout).toBe(prefs.layout);
          expect(restored.verbosity).toBe(prefs.verbosity);
          expect(restored.keyboardShortcutsEnabled).toBe(
            prefs.keyboardShortcutsEnabled
          );
          expect(restored.notificationsEnabled).toBe(
            prefs.notificationsEnabled
          );
          expect(restored.exportDefaults.format).toBe(
            prefs.exportDefaults.format
          );
          expect(restored.dashboardSettings.refreshInterval).toBe(
            prefs.dashboardSettings.refreshInterval
          );

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
