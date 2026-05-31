/**
 * Performance monitoring and optimization utilities
 */

/**
 * Measure component render time
 */
export function measureRenderTime(
  componentName: string,
  callback: () => void,
): void {
  if (process.env.NODE_ENV === "development") {
    const start = performance.now();
    callback();
    const end = performance.now();
    console.log(
      `[Performance] ${componentName} rendered in ${(end - start).toFixed(2)}ms`,
    );
  } else {
    callback();
  }
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: any): void {
  // Send to analytics service
  if (process.env.NODE_ENV === "production") {
    // Example: Send to Google Analytics
    // gtag('event', metric.name, {
    //   value: Math.round(metric.value),
    //   metric_id: metric.id,
    //   metric_value: metric.value,
    //   metric_delta: metric.delta,
    // });

    console.log("[Web Vitals]", metric);
  }
}

/**
 * Lazy load component with retry logic
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3,
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;

        // Wait before retry (exponential backoff)
        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, i)),
          );
        }
      }
    }

    throw lastError || new Error("Failed to load component");
  });
}

/**
 * Preload component for faster navigation
 */
export function preloadComponent(componentImport: () => Promise<any>): void {
  // Start loading but don't wait
  componentImport().catch(() => {
    // Ignore errors, will retry when actually needed
  });
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get device performance tier
 */
export function getDevicePerformanceTier(): "high" | "medium" | "low" {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;

  // Check device memory (if available)
  const memory = (navigator as any).deviceMemory || 4;

  // Check connection speed
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || "4g";

  // Determine tier
  if (cores >= 8 && memory >= 8 && effectiveType === "4g") {
    return "high";
  } else if (cores >= 4 && memory >= 4) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Adaptive loading based on device performance
 */
export function shouldLoadHighQuality(): boolean {
  const tier = getDevicePerformanceTier();
  return tier === "high";
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number },
): number {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, options);
  } else {
    // Fallback to setTimeout
    return setTimeout(callback, 1) as unknown as number;
  }
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallback(id: number): void {
  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Batch DOM updates
 */
export function batchUpdates(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Memory usage monitoring (Chrome only)
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if ("memory" in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Log memory usage (development only)
 */
export function logMemoryUsage(): void {
  if (process.env.NODE_ENV === "development") {
    const memory = getMemoryUsage();
    if (memory) {
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
      console.log(
        `[Memory] Used: ${usedMB}MB / Total: ${totalMB}MB / Limit: ${limitMB}MB`,
      );
    }
  }
}

/**
 * Performance observer for long tasks
 */
export function observeLongTasks(
  callback: (entries: PerformanceEntry[]) => void,
): PerformanceObserver | null {
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ entryTypes: ["longtask"] });
      return observer;
    } catch (e) {
      // Long task API not supported
      return null;
    }
  }
  return null;
}

/**
 * Detect if running on low-end device
 */
export function isLowEndDevice(): boolean {
  const tier = getDevicePerformanceTier();
  return tier === "low";
}

// Re-export React for lazyWithRetry
import React from "react";
