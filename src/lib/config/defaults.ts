import { DashboardType, UserRole, UserPreferences } from "@/types/agent";
import { ProviderConfig } from "@/lib/agent/types";

// Default provider configuration (mock mode)
export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  type: "openai",
  model: "gpt-4",
  apiKey: "", // Empty key triggers degraded mode
};

// Default user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "light",
  verbosity: "detailed",
  formats: ["text", "chart", "table", "insight"],
  dashboardType: "sales",
};

// Default dashboard type
export const DEFAULT_DASHBOARD: DashboardType = "sales";

// Default user role
export const DEFAULT_USER_ROLE: UserRole = "admin";

// Default user info for demo
export const DEFAULT_USER = {
  name: "John Doe",
  email: "john@example.com",
};

// App configuration
export const APP_CONFIG = {
  name: "Dashboard",
  subtitle: "Modern AI-Powered Analytics",
  version: "1.0.0",
};
