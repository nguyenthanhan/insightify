import { z } from "zod";

/**
 * Schema for loading state
 */
export const LoadingStateSchema = z.object({
  id: z.string(),
  isLoading: z.boolean(),
  startTime: z.number(),
  minDuration: z.number().optional(),
});

export type LoadingState = z.infer<typeof LoadingStateSchema>;

/**
 * Configuration for LoadingCoordinator
 */
export interface LoadingCoordinatorConfig {
  defaultMinDuration?: number;
  onStateChange?: (states: LoadingState[]) => void;
}

const DEFAULT_CONFIG: Required<
  Omit<LoadingCoordinatorConfig, "onStateChange">
> = {
  defaultMinDuration: 300, // Prevent flicker for fast loads
};

/**
 * LoadingCoordinator - Coordinates multiple loading states to prevent flicker
 *
 * @example
 * ```typescript
 * const coordinator = new LoadingCoordinator({ defaultMinDuration: 500 });
 * coordinator.register('dashboard');
 * coordinator.start('dashboard');
 * // ... fetch data
 * coordinator.end('dashboard'); // Will wait for minDuration before marking as complete
 * ```
 */
export class LoadingCoordinator {
  private states: Map<string, LoadingState> = new Map();
  private pendingEnds: Map<string, NodeJS.Timeout> = new Map();
  private config: Required<Omit<LoadingCoordinatorConfig, "onStateChange">> &
    Pick<LoadingCoordinatorConfig, "onStateChange">;

  constructor(config: LoadingCoordinatorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a new loading state
   */
  register(id: string, minDuration?: number): void {
    if (!this.states.has(id)) {
      this.states.set(id, {
        id,
        isLoading: false,
        startTime: 0,
        minDuration: minDuration ?? this.config.defaultMinDuration,
      });
    }
  }

  /**
   * Start loading for a registered state
   */
  start(id: string): void {
    // Auto-register if not exists
    if (!this.states.has(id)) {
      this.register(id);
    }

    // Cancel any pending end
    const pendingEnd = this.pendingEnds.get(id);
    if (pendingEnd) {
      clearTimeout(pendingEnd);
      this.pendingEnds.delete(id);
    }

    const state = this.states.get(id)!;
    this.states.set(id, {
      ...state,
      isLoading: true,
      startTime: Date.now(),
    });

    this.notifyStateChange();
  }

  /**
   * End loading for a registered state
   * Respects minDuration to prevent flicker
   */
  end(id: string): void {
    const state = this.states.get(id);
    if (!state) return;

    const elapsed = Date.now() - state.startTime;
    const minDuration = state.minDuration ?? this.config.defaultMinDuration;
    const remaining = minDuration - elapsed;

    if (remaining > 0) {
      // Schedule the end after remaining time
      const timeout = setTimeout(() => {
        this.completeEnd(id);
        this.pendingEnds.delete(id);
      }, remaining);
      this.pendingEnds.set(id, timeout);
    } else {
      this.completeEnd(id);
    }
  }

  /**
   * Force end loading immediately (bypass minDuration)
   */
  forceEnd(id: string): void {
    const pendingEnd = this.pendingEnds.get(id);
    if (pendingEnd) {
      clearTimeout(pendingEnd);
      this.pendingEnds.delete(id);
    }
    this.completeEnd(id);
  }

  /**
   * Check if any registered state is loading
   */
  isAnyLoading(): boolean {
    for (const state of this.states.values()) {
      if (state.isLoading) return true;
    }
    // Also check pending ends (still visually loading)
    return this.pendingEnds.size > 0;
  }

  /**
   * Check if a specific state is loading
   */
  isLoading(id: string): boolean {
    const state = this.states.get(id);
    return state?.isLoading || this.pendingEnds.has(id);
  }

  /**
   * Get all loading states
   */
  getStates(): LoadingState[] {
    return Array.from(this.states.values());
  }

  /**
   * Get a specific loading state
   */
  getState(id: string): LoadingState | undefined {
    return this.states.get(id);
  }

  /**
   * Clear all states
   */
  clear(): void {
    // Clear all pending timeouts
    for (const timeout of this.pendingEnds.values()) {
      clearTimeout(timeout);
    }
    this.pendingEnds.clear();
    this.states.clear();
    this.notifyStateChange();
  }

  /**
   * Serialize states to JSON
   */
  serialize(): string {
    return JSON.stringify(this.getStates());
  }

  /**
   * Deserialize JSON to states
   */
  deserialize(json: string): LoadingState[] {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) return [];

      const validStates: LoadingState[] = [];
      for (const item of parsed) {
        const result = LoadingStateSchema.safeParse(item);
        if (result.success) {
          validStates.push(result.data);
        }
      }
      return validStates;
    } catch {
      return [];
    }
  }

  /**
   * Load states from JSON
   */
  loadFromJson(json: string): void {
    const states = this.deserialize(json);
    this.states.clear();
    for (const state of states) {
      this.states.set(state.id, state);
    }
    this.notifyStateChange();
  }

  private completeEnd(id: string): void {
    const state = this.states.get(id);
    if (state) {
      this.states.set(id, {
        ...state,
        isLoading: false,
      });
      this.notifyStateChange();
    }
  }

  private notifyStateChange(): void {
    this.config.onStateChange?.(this.getStates());
  }
}

// Singleton instance
let globalCoordinator: LoadingCoordinator | null = null;

/**
 * Get or create the global LoadingCoordinator instance
 */
export function getLoadingCoordinator(
  config?: LoadingCoordinatorConfig
): LoadingCoordinator {
  if (!globalCoordinator) {
    globalCoordinator = new LoadingCoordinator(config);
  }
  return globalCoordinator;
}

/**
 * Reset the global coordinator (useful for testing)
 */
export function resetLoadingCoordinator(): void {
  globalCoordinator?.clear();
  globalCoordinator = null;
}
