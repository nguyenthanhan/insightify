/**
 * Async test utilities for waiting on state changes
 */

/**
 * Wait for a condition to be true
 *
 * @example
 * ```typescript
 * await waitFor(() => element.textContent === 'Loaded');
 * ```
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await sleep(interval);
  }

  throw new Error(`waitFor timed out after ${timeout}ms`);
}

/**
 * Wait for a value to change
 *
 * @example
 * ```typescript
 * const newValue = await waitForChange(() => store.getState().count, 0);
 * ```
 */
export async function waitForChange<T>(
  getValue: () => T,
  initialValue: T,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentValue = getValue();
    if (currentValue !== initialValue) {
      return currentValue;
    }
    await sleep(interval);
  }

  throw new Error(`waitForChange timed out after ${timeout}ms`);
}

/**
 * Wait for loading to complete
 *
 * @example
 * ```typescript
 * await waitForLoadingComplete(() => store.getState().isLoading);
 * ```
 */
export async function waitForLoadingComplete(
  getLoadingState: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 10000, interval = 50 } = options;
  const startTime = Date.now();

  // First, wait for loading to start (if not already loading)
  let hasStartedLoading = getLoadingState();

  while (!hasStartedLoading && Date.now() - startTime < timeout / 2) {
    await sleep(interval);
    hasStartedLoading = getLoadingState();
  }

  // Then wait for loading to complete
  while (getLoadingState() && Date.now() - startTime < timeout) {
    await sleep(interval);
  }

  if (getLoadingState()) {
    throw new Error(`waitForLoadingComplete timed out after ${timeout}ms`);
  }
}

/**
 * Wait for an element to appear in the DOM
 *
 * @example
 * ```typescript
 * const element = await waitForElement(() => document.querySelector('.my-class'));
 * ```
 */
export async function waitForElement<T extends Element>(
  getElement: () => T | null,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = getElement();
    if (element) return element;
    await sleep(interval);
  }

  throw new Error(`waitForElement timed out after ${timeout}ms`);
}

/**
 * Wait for an element to be removed from the DOM
 *
 * @example
 * ```typescript
 * await waitForElementRemoved(() => document.querySelector('.loading'));
 * ```
 */
export async function waitForElementRemoved(
  getElement: () => Element | null,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = getElement();
    if (!element) return;
    await sleep(interval);
  }

  throw new Error(`waitForElementRemoved timed out after ${timeout}ms`);
}

/**
 * Wait for a specific number of items
 *
 * @example
 * ```typescript
 * await waitForCount(() => document.querySelectorAll('.item').length, 5);
 * ```
 */
export async function waitForCount(
  getCount: () => number,
  expectedCount: number,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const count = getCount();
    if (count === expectedCount) return;
    await sleep(interval);
  }

  const finalCount = getCount();
  throw new Error(
    `waitForCount timed out after ${timeout}ms. Expected ${expectedCount}, got ${finalCount}`
  );
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Run a function and measure its execution time
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}
