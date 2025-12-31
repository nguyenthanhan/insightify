import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import {
  memoize,
  createMemoizedSelector,
  createMemoizedFilter,
  createMemoizedSort,
  createMemoizedFilterSort,
  shallowArrayEqual,
  deepEqual,
} from "./memoization";

describe("Memoization Utilities", () => {
  describe("memoize", () => {
    it("should cache function results", () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoize(fn);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should call function for different arguments", () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoize(fn);

      expect(memoized(5)).toBe(10);
      expect(memoized(10)).toBe(20);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should respect maxSize option", () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoize(fn, { maxSize: 2 });

      memoized(1);
      memoized(2);
      memoized(3); // Should evict 1

      // Call 1 again - should recalculate
      memoized(1);
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe("createMemoizedSelector", () => {
    it("should return cached result for same state", () => {
      const selector = vi.fn((state: { value: number }) => state.value * 2);
      const memoized = createMemoizedSelector(selector);

      const state = { value: 5 };
      expect(memoized(state)).toBe(10);
      expect(memoized(state)).toBe(10);
      expect(selector).toHaveBeenCalledTimes(1);
    });

    it("should recalculate for different state", () => {
      const selector = vi.fn((state: { value: number }) => state.value * 2);
      const memoized = createMemoizedSelector(selector);

      expect(memoized({ value: 5 })).toBe(10);
      expect(memoized({ value: 10 })).toBe(20);
      expect(selector).toHaveBeenCalledTimes(2);
    });

    it("should use custom equality function", () => {
      const selector = vi.fn((state: { items: number[] }) => [...state.items]);
      const memoized = createMemoizedSelector(selector, shallowArrayEqual);

      const state1 = { items: [1, 2, 3] };
      const state2 = { items: [1, 2, 3] };

      const result1 = memoized(state1);
      const result2 = memoized(state2);

      // Different state objects but same result
      expect(selector).toHaveBeenCalledTimes(2);
      expect(result1).toBe(result2); // Same reference due to equality
    });
  });

  describe("createMemoizedFilter", () => {
    it("should cache filter results", () => {
      const filterFn = vi.fn((item: number, min: number) => item >= min);
      const memoizedFilter = createMemoizedFilter(filterFn);

      const items = [1, 2, 3, 4, 5];
      const result1 = memoizedFilter(items, 3);
      const result2 = memoizedFilter(items, 3);

      expect(result1).toEqual([3, 4, 5]);
      expect(result1).toBe(result2); // Same reference
    });

    it("should recalculate for different criteria", () => {
      const filterFn = (item: number, min: number) => item >= min;
      const memoizedFilter = createMemoizedFilter(filterFn);

      const items = [1, 2, 3, 4, 5];
      const result1 = memoizedFilter(items, 3);
      const result2 = memoizedFilter(items, 4);

      expect(result1).toEqual([3, 4, 5]);
      expect(result2).toEqual([4, 5]);
      expect(result1).not.toBe(result2);
    });
  });

  describe("createMemoizedSort", () => {
    it("should cache sort results", () => {
      const compareFn = vi.fn((a: number, b: number) => a - b);
      const memoizedSort = createMemoizedSort(compareFn);

      const items = [3, 1, 4, 1, 5];
      const result1 = memoizedSort(items);
      const result2 = memoizedSort(items);

      expect(result1).toEqual([1, 1, 3, 4, 5]);
      expect(result1).toBe(result2); // Same reference
    });

    it("should not mutate original array", () => {
      const compareFn = (a: number, b: number) => a - b;
      const memoizedSort = createMemoizedSort(compareFn);

      const items = [3, 1, 4, 1, 5];
      const original = [...items];
      memoizedSort(items);

      expect(items).toEqual(original);
    });
  });

  describe("createMemoizedFilterSort", () => {
    it("should filter and sort in one pass", () => {
      const filterFn = (item: number, min: number) => item >= min;
      const compareFn = (a: number, b: number) => b - a; // Descending
      const memoized = createMemoizedFilterSort(filterFn, compareFn);

      const items = [3, 1, 4, 1, 5, 9, 2, 6];
      const result = memoized(items, 3);

      expect(result).toEqual([9, 6, 5, 4, 3]);
    });

    it("should cache combined results", () => {
      const filterFn = (item: number, min: number) => item >= min;
      const compareFn = (a: number, b: number) => a - b;
      const memoized = createMemoizedFilterSort(filterFn, compareFn);

      const items = [3, 1, 4, 1, 5];
      const result1 = memoized(items, 2);
      const result2 = memoized(items, 2);

      expect(result1).toBe(result2);
    });
  });

  /**
   * **Feature: code-optimization, Property 5: Memoization Consistency**
   * **Validates: Requirements 6.5**
   *
   * For any dataset and filter/sort operation, the memoized computation result
   * SHALL be identical to the non-memoized computation result.
   */
  describe("Property 5: Memoization Consistency", () => {
    it("memoized filter should produce same results as non-memoized", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -100, max: 100 }), {
            minLength: 0,
            maxLength: 50,
          }),
          fc.integer({ min: -100, max: 100 }),
          (items, threshold) => {
            const filterFn = (item: number, min: number) => item >= min;
            const memoizedFilter = createMemoizedFilter(filterFn);

            const memoizedResult = memoizedFilter(items, threshold);
            const directResult = items.filter((item) =>
              filterFn(item, threshold)
            );

            expect(memoizedResult).toEqual(directResult);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("memoized sort should produce same results as non-memoized", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -100, max: 100 }), {
            minLength: 0,
            maxLength: 50,
          }),
          (items) => {
            const compareFn = (a: number, b: number) => a - b;
            const memoizedSort = createMemoizedSort(compareFn);

            const memoizedResult = memoizedSort(items);
            const directResult = [...items].sort(compareFn);

            expect(memoizedResult).toEqual(directResult);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("memoized filter+sort should produce same results as non-memoized", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -100, max: 100 }), {
            minLength: 0,
            maxLength: 50,
          }),
          fc.integer({ min: -100, max: 100 }),
          (items, threshold) => {
            const filterFn = (item: number, min: number) => item >= min;
            const compareFn = (a: number, b: number) => a - b;
            const memoized = createMemoizedFilterSort(filterFn, compareFn);

            const memoizedResult = memoized(items, threshold);
            const directResult = items
              .filter((item) => filterFn(item, threshold))
              .sort(compareFn);

            expect(memoizedResult).toEqual(directResult);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("shallowArrayEqual", () => {
    it("should return true for same reference", () => {
      const arr = [1, 2, 3];
      expect(shallowArrayEqual(arr, arr)).toBe(true);
    });

    it("should return true for equal arrays", () => {
      expect(shallowArrayEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it("should return false for different arrays", () => {
      expect(shallowArrayEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it("should return false for different lengths", () => {
      expect(shallowArrayEqual([1, 2], [1, 2, 3])).toBe(false);
    });
  });

  describe("deepEqual", () => {
    it("should return true for equal primitives", () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual("a", "a")).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
    });

    it("should return true for equal objects", () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it("should return true for nested objects", () => {
      expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(
        true
      );
    });

    it("should return false for different objects", () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });
  });
});
