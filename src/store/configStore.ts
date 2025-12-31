import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DashboardType, UserRole, UserPreferences } from "@/types/agent";
import { ProviderConfig } from "@/lib/agent/types";

// Default provider config (mock mode)
const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  type: "openai",
  model: "gpt-4",
  apiKey: "", // Empty key triggers degraded mode
};

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "light",
  verbosity: "detailed",
  formats: ["text", "chart", "table", "insight"],
  dashboardType: "sales",
};

interface ConfigState {
  currentDashboard: DashboardType;
  userRole: UserRole;
  userPreferences: UserPreferences;
  providerConfig: ProviderConfig;
}

interface ConfigActions {
  setDashboard: (dashboard: DashboardType) => void;
  setUserRole: (role: UserRole) => void;
  setTheme: (theme: "light" | "dark") => void;
  setProviderConfig: (config: ProviderConfig) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export type ConfigStore = ConfigState & ConfigActions;

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentDashboard: "sales",
      userRole: "admin",
      userPreferences: DEFAULT_USER_PREFERENCES,
      providerConfig: DEFAULT_PROVIDER_CONFIG,

      // Actions
      setDashboard: (dashboard: DashboardType) => {
        set({
          currentDashboard: dashboard,
          userPreferences: {
            ...get().userPreferences,
            dashboardType: dashboard,
          },
        });
      },

      setUserRole: (role: UserRole) => {
        set({ userRole: role });
      },

      setTheme: (theme: "light" | "dark") => {
        set({
          userPreferences: {
            ...get().userPreferences,
            theme,
          },
        });

        // Apply theme to document
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      setProviderConfig: (config: ProviderConfig) => {
        set({ providerConfig: config });
      },

      updatePreferences: (prefs: Partial<UserPreferences>) => {
        set({
          userPreferences: {
            ...get().userPreferences,
            ...prefs,
          },
        });
      },
    }),
    {
      name: "config-store",
      partialize: (state) => ({
        currentDashboard: state.currentDashboard,
        userPreferences: state.userPreferences,
        providerConfig: state.providerConfig,
      }),
      merge: (persistedState: unknown, currentState) => {
        const persisted = persistedState as Partial<ConfigState>;
        const mergedState = {
          ...currentState,
          ...persisted,
        };

        // Ensure dashboardType exists in userPreferences
        if (
          mergedState.userPreferences &&
          !mergedState.userPreferences.dashboardType
        ) {
          mergedState.userPreferences.dashboardType =
            mergedState.currentDashboard || "sales";
        }

        return mergedState;
      },
    },
  ),
);

export default useConfigStore;
