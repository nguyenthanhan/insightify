import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  sortTableData,
  filterTableData,
  paginateTableData,
  getRowAlternation,
  TableColumn,
} from "./DataTable";

// Test data type
interface TestRow {
  id: number;
  name: string;
  value: number;
  [key: string]: unknown;
}

// Arbitrary for test rows
const testRowArb: fc.Arbitrary<TestRow> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  value: fc.integer({ min: -1000, max: 1000 }),
});

const testColumns: TableColumn<TestRow>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "value", header: "Value" },
];

/**
 * **Feature: premium-dashboard-ui, Property 4: Table Row Alternation**
 * **Validates: Requirements 7.1**
 */
describe("Property: Table Row Alternation", () => {
  it("should alternate row colors correctly for any number of rows", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (rowCount) => {
        for (let i = 0; i < rowCount; i++) {
          const alternation = getRowAlternation(i);
          const expected = i % 2 === 0 ? "even" : "odd";
          expect(alternation).toBe(expected);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should ensure even indices have different style than odd indices", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (index) => {
        const current = getRowAlternation(index);
        const next = getRowAlternation(index + 1);

        expect(current).not.toBe(next);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: premium-dashboard-ui, Property 5: Table Sort Correctness**
 * **Validates: Requirements 7.2**
 */
describe("Property: Table Sort Correctness", () => {
  it("should sort rows in ascending order correctly", () => {
    fc.assert(
      fc.property(
        fc.array(testRowArb, { minLength: 2, maxLength: 50 }),
        (data) => {
          const sorted = sortTableData(data, "value", "asc");

          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].value as number).toBeLessThanOrEqual(
              sorted[i].value as number,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should sort rows in descending order correctly", () => {
    fc.assert(
      fc.property(
        fc.array(testRowArb, { minLength: 2, maxLength: 50 }),
        (data) => {
          const sorted = sortTableData(data, "value", "desc");

          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].value as number).toBeGreaterThanOrEqual(
              sorted[i].value as number,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should preserve data length after sorting", () => {
    fc.assert(
      fc.property(
        fc.array(testRowArb, { maxLength: 50 }),
        fc.constantFrom("asc" as const, "desc" as const),
        (data, direction) => {
          const sorted = sortTableData(data, "value", direction);
          expect(sorted.length).toBe(data.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: premium-dashboard-ui, Property 6: Table Filter Correctness**
 * **Validates: Requirements 7.3**
 */
describe("Property: Table Filter Correctness", () => {
  it("should only return rows matching the filter criteria", () => {
    fc.assert(
      fc.property(
        fc.array(testRowArb, { minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (data, filterValue) => {
          const filtered = filterTableData(data, testColumns, filterValue);

          // All filtered rows should contain the filter value in at least one column
          filtered.forEach((row) => {
            const matchesFilter = testColumns.some((col) => {
              const value = row[col.key];
              return String(value)
                .toLowerCase()
                .includes(filterValue.toLowerCase());
            });
            expect(matchesFilter).toBe(true);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return all data when filter is empty", () => {
    fc.assert(
      fc.property(fc.array(testRowArb, { maxLength: 50 }), (data) => {
        const filtered = filterTableData(data, testColumns, "");
        expect(filtered.length).toBe(data.length);
      }),
      { numRuns: 100 },
    );
  });

  it("should never return more rows than original data", () => {
    fc.assert(
      fc.property(
        fc.array(testRowArb, { maxLength: 50 }),
        fc.string({ maxLength: 20 }),
        (data, filterValue) => {
          const filtered = filterTableData(data, testColumns, filterValue);
          expect(filtered.length).toBeLessThanOrEqual(data.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: premium-dashboard-ui, Property 7: Table Pagination Correctness**
 * **Validates: Requirements 7.4**
 */
describe("Property: Table Pagination Correctness", () => {
  it("should return correct items for any page", () => {
    fc.assert(
      fc.property(
        fc.array(testRowArb, { minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 20 }),
        (data, pageSize) => {
          const totalPages = Math.ceil(data.length / pageSize);

          for (let page = 1; page <= totalPages; page++) {
            const paginated = paginateTableData(data, page, pageSize);
            const startIndex = (page - 1) * pageSize;
            const expectedLength = Math.min(pageSize, data.length - startIndex);

            expect(paginated.length).toBe(expectedLength);

            // Verify items are from correct indices
            paginated.forEach((item, i) => {
              expect(item).toEqual(data[startIndex + i]);
            });
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return empty array for page beyond data", () => {
    fc.assert(
      fc.property(
        fc.array(testRowArb, { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 10 }),
        (data, pageSize) => {
          const totalPages = Math.ceil(data.length / pageSize);
          const beyondPage = totalPages + 1;

          const paginated = paginateTableData(data, beyondPage, pageSize);
          expect(paginated.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should cover all data across all pages", () => {
    fc.assert(
      fc.property(
        fc.array(testRowArb, { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 10 }),
        (data, pageSize) => {
          const totalPages = Math.ceil(data.length / pageSize);
          let allItems: TestRow[] = [];

          for (let page = 1; page <= totalPages; page++) {
            const paginated = paginateTableData(data, page, pageSize);
            allItems = [...allItems, ...paginated];
          }

          expect(allItems.length).toBe(data.length);
          expect(allItems).toEqual(data);
        },
      ),
      { numRuns: 100 },
    );
  });
});
