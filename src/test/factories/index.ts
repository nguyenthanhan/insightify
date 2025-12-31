import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

/**
 * Factory interface for generating test data
 */
export interface Factory<T> {
  build(overrides?: Partial<T>): T;
  buildList(count: number, overrides?: Partial<T>): T[];
}

/**
 * Create a factory for generating test data
 *
 * @example
 * ```typescript
 * const userFactory = createFactory({
 *   id: () => uuidv4(),
 *   name: 'Test User',
 *   email: 'test@example.com',
 * });
 *
 * const user = userFactory.build({ name: 'Custom Name' });
 * const users = userFactory.buildList(5);
 * ```
 */
export function createFactory<T extends Record<string, unknown>>(
  defaults: T | (() => T),
  schema?: z.ZodSchema<T>
): Factory<T> {
  const getDefaults = (): T => {
    if (typeof defaults === "function") {
      return (defaults as () => T)();
    }
    // Deep clone to avoid mutation
    return JSON.parse(JSON.stringify(defaults));
  };

  return {
    build(overrides?: Partial<T>): T {
      const base = getDefaults();
      const result = { ...base, ...overrides } as T;

      // Validate against schema if provided
      if (schema) {
        const validation = schema.safeParse(result);
        if (!validation.success) {
          throw new Error(
            `Factory validation failed: ${validation.error.message}`
          );
        }
        return validation.data;
      }

      return result;
    },

    buildList(count: number, overrides?: Partial<T>): T[] {
      return Array.from({ length: count }, () => this.build(overrides));
    },
  };
}

// ============================================
// Pre-built factories for common types
// ============================================

/**
 * User schema and factory
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "user", "viewer"]),
  createdAt: z.number(),
});

export type User = z.infer<typeof UserSchema>;

export const userFactory = createFactory<User>(
  () => ({
    id: uuidv4(),
    name: "Test User",
    email: "test@example.com",
    role: "user",
    createdAt: Date.now(),
  }),
  UserSchema
);

/**
 * Metric schema and factory
 */
export const MetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  change: z.number(),
  trend: z.enum(["up", "down", "stable"]),
  unit: z.string().optional(),
});

export type Metric = z.infer<typeof MetricSchema>;

export const metricFactory = createFactory<Metric>(
  () => ({
    id: uuidv4(),
    name: "Test Metric",
    value: Math.floor(Math.random() * 10000),
    change: Math.random() * 20 - 10,
    trend: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as
      | "up"
      | "down"
      | "stable",
    unit: "$",
  }),
  MetricSchema
);

/**
 * Activity schema and factory
 */
export const ActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["create", "update", "delete", "view"]),
  userId: z.string().uuid(),
  resourceId: z.string(),
  resourceType: z.string(),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;

export const activityFactory = createFactory<Activity>(
  () => ({
    id: uuidv4(),
    type: "create",
    userId: uuidv4(),
    resourceId: uuidv4(),
    resourceType: "document",
    timestamp: Date.now(),
    metadata: {},
  }),
  ActivitySchema
);

/**
 * Chart Data Point schema and factory
 */
export const ChartDataPointSchema = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number(),
  label: z.string().optional(),
});

export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;

export const chartDataPointFactory = createFactory<ChartDataPoint>(
  () => ({
    x: new Date().toISOString().split("T")[0],
    y: Math.floor(Math.random() * 1000),
    label: "Data Point",
  }),
  ChartDataPointSchema
);

/**
 * Notification schema and factory
 */
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(["info", "warning", "success", "error"]),
  read: z.boolean(),
  timestamp: z.number(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const notificationFactory = createFactory<Notification>(
  () => ({
    id: uuidv4(),
    title: "Test Notification",
    message: "This is a test notification message.",
    severity: "info",
    read: false,
    timestamp: Date.now(),
  }),
  NotificationSchema
);

/**
 * Error Log Entry factory (matches errorLogger types)
 */
export const ErrorLogEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }),
  componentStack: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export type ErrorLogEntry = z.infer<typeof ErrorLogEntrySchema>;

export const errorLogEntryFactory = createFactory<ErrorLogEntry>(
  () => ({
    id: uuidv4(),
    timestamp: Date.now(),
    error: {
      name: "Error",
      message: "Test error message",
      stack: "Error: Test\n  at test.js:1:1",
    },
    componentStack: "at TestComponent",
    context: { testKey: "testValue" },
  }),
  ErrorLogEntrySchema
);
