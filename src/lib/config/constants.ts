import { z } from "zod";

/**
 * API Configuration Schema
 */
export const ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeout: z.number().positive(),
  retryAttempts: z.number().int().min(0).max(10),
});

/**
 * Feature Flags Schema
 */
export const FeatureFlagsSchema = z.object({
  enableAI: z.boolean(),
  enableExport: z.boolean(),
  enableThemes: z.boolean(),
  enableVirtualization: z.boolean(),
  enableErrorBoundaries: z.boolean(),
});

/**
 * Performance Configuration Schema
 */
export const PerformanceConfigSchema = z.object({
  virtualizationThreshold: z.number().int().positive(),
  lazyLoadDelay: z.number().int().min(0),
  skeletonMinDuration: z.number().int().min(0),
  memoizationCacheSize: z.number().int().positive(),
});

/**
 * Complete App Configuration Schema
 */
export const AppConfigSchema = z.object({
  api: ApiConfigSchema,
  features: FeatureFlagsSchema,
  performance: PerformanceConfigSchema,
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  api: {
    baseUrl: "https://api.example.com",
    timeout: 30000,
    retryAttempts: 3,
  },
  features: {
    enableAI: true,
    enableExport: true,
    enableThemes: true,
    enableVirtualization: true,
    enableErrorBoundaries: true,
  },
  performance: {
    virtualizationThreshold: 50,
    lazyLoadDelay: 200,
    skeletonMinDuration: 300,
    memoizationCacheSize: 100,
  },
};

/**
 * ConfigSerializer - Handles serialization and validation of app config
 */
export class ConfigSerializer {
  /**
   * Serialize config to JSON string
   */
  serialize(config: AppConfig): string {
    return JSON.stringify(config);
  }

  /**
   * Deserialize JSON string to config
   */
  deserialize(json: string): AppConfig | null {
    try {
      const parsed = JSON.parse(json);
      const result = AppConfigSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate config object
   */
  validate(config: unknown): config is AppConfig {
    return AppConfigSchema.safeParse(config).success;
  }

  /**
   * Merge partial config with defaults
   */
  merge(partial: Partial<AppConfig>): AppConfig {
    return {
      api: { ...DEFAULT_CONFIG.api, ...partial.api },
      features: { ...DEFAULT_CONFIG.features, ...partial.features },
      performance: { ...DEFAULT_CONFIG.performance, ...partial.performance },
    };
  }
}

// Singleton instance
let currentConfig: AppConfig = { ...DEFAULT_CONFIG };
const serializer = new ConfigSerializer();

/**
 * Get current app configuration
 */
export function getConfig(): AppConfig {
  return { ...currentConfig };
}

/**
 * Update app configuration
 */
export function setConfig(config: Partial<AppConfig>): void {
  currentConfig = serializer.merge(config);
}

/**
 * Reset to default configuration
 */
export function resetConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}

/**
 * Load configuration from localStorage
 */
export function loadConfigFromStorage(key = "app_config"): boolean {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const config = serializer.deserialize(stored);
      if (config) {
        currentConfig = config;
        return true;
      }
    }
  } catch {
    // Storage not available
  }
  return false;
}

/**
 * Save configuration to localStorage
 */
export function saveConfigToStorage(key = "app_config"): boolean {
  try {
    localStorage.setItem(key, serializer.serialize(currentConfig));
    return true;
  } catch {
    return false;
  }
}

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // AI Agent
  CHAT: "/api/chat",
  COMPLETIONS: "/api/completions",

  // Dashboard
  METRICS: "/api/metrics",
  CHARTS: "/api/charts",
  TABLES: "/api/tables",

  // Export
  EXPORT_CSV: "/api/export/csv",
  EXPORT_PDF: "/api/export/pdf",

  // User
  USER_PREFERENCES: "/api/user/preferences",
  USER_PROFILE: "/api/user/profile",
} as const;

/**
 * Theme Constants
 */
export const THEME_CONSTANTS = {
  TRANSITION_DURATION: 200,
  MIN_CONTRAST_RATIO: 4.5,
  STORAGE_KEY: "theme_preference",
} as const;

/**
 * Animation Constants
 */
export const ANIMATION_CONSTANTS = {
  FADE_DURATION: 150,
  SLIDE_DURATION: 200,
  SCALE_DURATION: 150,
  SKELETON_PULSE_DURATION: 1500,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ["csv", "json", "xlsx"],
} as const;

export { serializer as configSerializer };
