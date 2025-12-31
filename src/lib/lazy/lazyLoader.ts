import React, { lazy, Suspense, ComponentType } from "react";
import { z } from "zod";

/**
 * Schema for chunk configuration
 */
export const ChunkConfigSchema = z.object({
  name: z.string(),
  modules: z.array(z.string()),
  priority: z.number().int(),
});

export type ChunkConfig = z.infer<typeof ChunkConfigSchema>;

/**
 * Configuration for lazy-loaded components
 */
export interface LazyComponentConfig {
  loader: () => Promise<{ default: ComponentType<unknown> }>;
  fallback?: React.ReactNode;
  preload?: boolean;
  chunkName?: string;
}

/**
 * Registry entry for lazy components
 */
interface LazyRegistryEntry {
  component: React.LazyExoticComponent<ComponentType<unknown>>;
  config: LazyComponentConfig;
  preloaded: boolean;
}

/**
 * LazyRegistry - Manages lazy-loaded components
 *
 * @example
 * ```typescript
 * const registry = new LazyRegistry();
 * registry.register('Chart', {
 *   loader: () => import('./components/Chart'),
 *   chunkName: 'chart',
 * });
 * const ChartComponent = registry.get('Chart');
 * ```
 */
export class LazyRegistry {
  private registry: Map<string, LazyRegistryEntry> = new Map();
  private chunkConfigs: ChunkConfig[] = [];

  /**
   * Register a lazy-loaded component
   */
  register(name: string, config: LazyComponentConfig): void {
    if (this.registry.has(name)) {
      return; // Already registered
    }

    const component = lazy(config.loader);

    this.registry.set(name, {
      component,
      config,
      preloaded: false,
    });

    // Track chunk config
    if (config.chunkName) {
      this.chunkConfigs.push({
        name: config.chunkName,
        modules: [name],
        priority: this.chunkConfigs.length,
      });
    }

    // Preload if configured
    if (config.preload) {
      this.preload(name);
    }
  }

  /**
   * Get a lazy-loaded component
   */
  get(name: string): React.LazyExoticComponent<ComponentType<unknown>> | null {
    const entry = this.registry.get(name);
    return entry?.component || null;
  }

  /**
   * Get component wrapped with Suspense
   */
  getWithSuspense(
    name: string,
    fallback?: React.ReactNode,
  ): React.FC<Record<string, unknown>> | null {
    const entry = this.registry.get(name);
    if (!entry) return null;

    const LazyComponent = entry.component;
    const suspenseFallback = fallback || entry.config.fallback || null;

    const WrappedComponent: React.FC<Record<string, unknown>> = (props) =>
      React.createElement(
        Suspense,
        { fallback: suspenseFallback },
        React.createElement(LazyComponent, props),
      );

    WrappedComponent.displayName = `Lazy(${name})`;
    return WrappedComponent;
  }

  /**
   * Preload a specific component
   */
  async preload(name: string): Promise<void> {
    const entry = this.registry.get(name);
    if (!entry || entry.preloaded) return;

    try {
      await entry.config.loader();
      entry.preloaded = true;
    } catch (error) {
      console.error(`Failed to preload component: ${name}`, error);
    }
  }

  /**
   * Preload all registered components
   */
  async preloadAll(): Promise<void> {
    const promises = Array.from(this.registry.keys()).map((name) =>
      this.preload(name),
    );
    await Promise.all(promises);
  }

  /**
   * Check if a component is registered
   */
  has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Get all registered component names
   */
  list(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get chunk configurations
   */
  getChunkConfigs(): ChunkConfig[] {
    return [...this.chunkConfigs];
  }

  /**
   * Serialize chunk configs to JSON
   */
  serializeChunkConfigs(): string {
    return JSON.stringify(this.chunkConfigs);
  }

  /**
   * Deserialize chunk configs from JSON
   */
  deserializeChunkConfigs(json: string): ChunkConfig[] {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) return [];

      const validConfigs: ChunkConfig[] = [];
      for (const item of parsed) {
        const result = ChunkConfigSchema.safeParse(item);
        if (result.success) {
          validConfigs.push(result.data);
        }
      }
      return validConfigs;
    } catch {
      return [];
    }
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.registry.clear();
    this.chunkConfigs = [];
  }
}

// Singleton instance
let globalRegistry: LazyRegistry | null = null;

/**
 * Get or create the global LazyRegistry instance
 */
export function getLazyRegistry(): LazyRegistry {
  if (!globalRegistry) {
    globalRegistry = new LazyRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (useful for testing)
 */
export function resetLazyRegistry(): void {
  globalRegistry?.clear();
  globalRegistry = null;
}

/**
 * Helper to create a lazy component with default loading fallback
 */
export function createLazyComponent<P extends Record<string, unknown>>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode,
): React.FC<P> {
  const LazyComponent = lazy(loader) as React.LazyExoticComponent<
    ComponentType<P>
  >;

  const WrappedComponent: React.FC<P> = (props) =>
    React.createElement(
      Suspense,
      { fallback: fallback || React.createElement("div", null, "Loading...") },
      React.createElement(LazyComponent, props as any),
    );

  return WrappedComponent;
}
