import { v4 as uuidv4 } from "uuid";
import { safeStorage } from "@/lib/utils/sanitize";

export interface UserPreferences {
  id: string;
  theme: "light" | "dark" | "system";
  themeId: string;
  layout: "grid" | "sidebar" | "fullwidth";
  verbosity: "brief" | "detailed" | "comprehensive";
  keyboardShortcutsEnabled: boolean;
  notificationsEnabled: boolean;
  exportDefaults: {
    format: "csv" | "json" | "pdf";
    includeMetadata: boolean;
  };
  dashboardSettings: {
    refreshInterval: number;
    showWelcomeMessage: boolean;
    defaultDashboard: string;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  id: "",
  theme: "system",
  themeId: "default-light",
  layout: "grid",
  verbosity: "detailed",
  keyboardShortcutsEnabled: true,
  notificationsEnabled: true,
  exportDefaults: {
    format: "csv",
    includeMetadata: true,
  },
  dashboardSettings: {
    refreshInterval: 30000,
    showWelcomeMessage: true,
    defaultDashboard: "sales",
  },
};

const STORAGE_KEY = "dashboard-preferences-v1";

export class PreferenceStore {
  private preferences: UserPreferences;
  private listeners: Set<(prefs: UserPreferences) => void> = new Set();
  private storageAvailable: boolean;

  constructor() {
    this.storageAvailable = this.checkStorageAvailable();
    this.preferences = this.loadFromStorage() || {
      ...DEFAULT_PREFERENCES,
      id: uuidv4(),
    };
  }

  get(): UserPreferences {
    return { ...this.preferences };
  }

  set(updates: Partial<UserPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...updates,
    };
    this.saveToStorage();
    this.notifyListeners();
    this.syncAcrossTabs();
  }

  setTheme(theme: "light" | "dark" | "system"): void {
    this.set({ theme });
  }

  setThemeId(themeId: string): void {
    this.set({ themeId });
  }

  setLayout(layout: "grid" | "sidebar" | "fullwidth"): void {
    this.set({ layout });
  }

  setVerbosity(verbosity: "brief" | "detailed" | "comprehensive"): void {
    this.set({ verbosity });
  }

  setKeyboardShortcuts(enabled: boolean): void {
    this.set({ keyboardShortcutsEnabled: enabled });
  }

  setNotifications(enabled: boolean): void {
    this.set({ notificationsEnabled: enabled });
  }

  setExportDefaults(
    defaults: Partial<UserPreferences["exportDefaults"]>,
  ): void {
    this.set({
      exportDefaults: {
        ...this.preferences.exportDefaults,
        ...defaults,
      },
    });
  }

  setDashboardSettings(
    settings: Partial<UserPreferences["dashboardSettings"]>,
  ): void {
    this.set({
      dashboardSettings: {
        ...this.preferences.dashboardSettings,
        ...settings,
      },
    });
  }

  reset(): void {
    this.preferences = {
      ...DEFAULT_PREFERENCES,
      id: uuidv4(),
    };
    this.saveToStorage();
    this.notifyListeners();
  }

  subscribe(listener: (prefs: UserPreferences) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Serialization
  serialize(): string {
    return JSON.stringify(this.preferences);
  }

  deserialize(data: string): UserPreferences {
    const parsed = JSON.parse(data) as UserPreferences;
    this.preferences = {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
    this.saveToStorage();
    this.notifyListeners();
    return this.get();
  }

  private loadFromStorage(): UserPreferences | null {
    if (!this.storageAvailable) return null;

    const stored = safeStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn("Failed to parse preferences from storage:", e);
      }
    }
    return null;
  }

  private saveToStorage(): void {
    if (!this.storageAvailable) return;

    const success = safeStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.preferences),
    );
    if (!success) {
      console.warn("Failed to save preferences: storage quota exceeded");
    }
  }

  private checkStorageAvailable(): boolean {
    if (typeof window === "undefined") return false;

    const test = "__storage_test__";
    const success = safeStorage.setItem(test, test);
    if (success) {
      safeStorage.removeItem(test);
    }
    return success;
  }

  private notifyListeners(): void {
    const prefs = this.get();
    this.listeners.forEach((listener) => listener(prefs));
  }

  private syncAcrossTabs(): void {
    if (typeof window === "undefined") return;

    // Dispatch storage event for other tabs
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: JSON.stringify(this.preferences),
      }),
    );
  }

  // Listen for changes from other tabs
  setupTabSync(): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.preferences = JSON.parse(e.newValue);
          this.notifyListeners();
        } catch (err) {
          console.warn("Failed to sync preferences from other tab:", err);
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}

// Singleton instance
let preferenceStoreInstance: PreferenceStore | null = null;

export function getPreferenceStore(): PreferenceStore {
  if (!preferenceStoreInstance) {
    preferenceStoreInstance = new PreferenceStore();
  }
  return preferenceStoreInstance;
}
