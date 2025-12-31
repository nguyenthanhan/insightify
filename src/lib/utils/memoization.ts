/**
 * Memoization utilities for performance optimization
 */

/**
 * Options for memoization
 */
export interface MemoOptions {
  maxSize?: number;
  keyFn?: (...args: unknown[]) => string;
}

/**
 * Create a memoized version of a function
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoOptions = {}
): T {
  const { maxSize = 100, keyFn = defaultKeyFn } = options;
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached) {
      return cached.value;
    }

    const result = fn(...args) as ReturnType<T>;

    // Evict oldest if at max size
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }

    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as T;

  return memoized;
}

function defaultKeyFn(...args: unknown[]): string {
  return JSON.stringify(args);
}

/**
 * Create a memoized selector for derived state
 */
export function createMemoizedSelector<TState, TResult>(
  selector: (state: TState) => TResult,
  equalityFn: (a: TResult, b: TResult) => boolean = Object.is
): (state: TState) => TResult {
  let lastState: TState | undefined;
  let lastResult: TResult | undefined;
  let hasResult = false;

  return (state: TState): TResult => {
    if (hasResult && lastState === state) {
      return lastResult!;
    }

    const result = selector(state);

    if (hasResult && equalityFn(result, lastResult!)) {
      return lastResult!;
    }

    lastState = state;
    lastResult = result;
    hasResult = true;
    return result;
  };
}

/**
 * Create a memoized filter function
 */
export function createMemoizedFilter<T>(
  filterFn: (item: T, criteria: unknown) => boolean
): (items: T[], criteria: unknown) => T[] {
  let lastItems: T[] | undefined;
  let lastCriteria: unknown;
  let lastResult: T[] | undefined;

  return (items: T[], criteria: unknown): T[] => {
    // Check if inputs are the same
    if (
      lastItems === items &&
      JSON.stringify(lastCriteria) === JSON.stringify(criteria) &&
      lastResult
    ) {
      return lastResult;
    }

    const result = items.filter((item) => filterFn(item, criteria));

    lastItems = items;
    lastCriteria = criteria;
    lastResult = result;

    return result;
  };
}

/**
 * Create a memoized sort function
 */
export function createMemoizedSort<T>(
  compareFn: (a: T, b: T) => number
): (items: T[]) => T[] {
  let lastItems: T[] | undefined;
  let lastResult: T[] | undefined;

  return (items: T[]): T[] => {
    if (lastItems === items && lastResult) {
      return lastResult;
    }

    const result = [...items].sort(compareFn);

    lastItems = items;
    lastResult = result;

    return result;
  };
}

/**
 * Create a memoized filter and sort function combined
 */
export function createMemoizedFilterSort<T>(
  filterFn: (item: T, criteria: unknown) => boolean,
  compareFn: (a: T, b: T) => number
): (items: T[], criteria: unknown) => T[] {
  let lastItems: T[] | undefined;
  let lastCriteria: unknown;
  let lastResult: T[] | undefined;

  return (items: T[], criteria: unknown): T[] => {
    if (
      lastItems === items &&
      JSON.stringify(lastCriteria) === JSON.stringify(criteria) &&
      lastResult
    ) {
      return lastResult;
    }

    const filtered = items.filter((item) => filterFn(item, criteria));
    const result = filtered.sort(compareFn);

    lastItems = items;
    lastCriteria = criteria;
    lastResult = result;

    return result;
  };
}

/**
 * Shallow equality check for arrays
 */
export function shallowArrayEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Deep equality check (simple implementation)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}
