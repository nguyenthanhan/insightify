import React, { useState, useMemo } from "react";
import { cn } from "../../lib/utils/cn";

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  selectable?: boolean;
  onRowSelect?: (rows: T[]) => void;
  loading?: boolean;
  glassmorphism?: boolean;
  className?: string;
}

export interface SortConfig<T> {
  key: keyof T;
  direction: "asc" | "desc";
}

/**
 * Premium Data Table with sorting, filtering, pagination
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  sortable = true,
  filterable = false,
  paginated = true,
  pageSize = 10,
  selectable = false,
  onRowSelect,
  loading = false,
  glassmorphism = true,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Filter data
  const filteredData = useMemo(() => {
    if (!filterValue) return data;

    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        return String(value).toLowerCase().includes(filterValue.toLowerCase());
      })
    );
  }, [data, columns, filterValue]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, paginated, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: keyof T) => {
    if (!sortable) return;

    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);

    const selectedData = Array.from(newSelected).map((i) => paginatedData[i]);
    onRowSelect?.(selectedData);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    } else {
      const allIndices = new Set(paginatedData.map((_, i) => i));
      setSelectedRows(allIndices);
      onRowSelect?.(paginatedData);
    }
  };

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={pageSize} />;
  }

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        glassmorphism
          ? "glass-card"
          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      {/* Filter */}
      {filterable && (
        <div className="p-4 border-b border-white/10">
          <input
            type="text"
            placeholder="Search..."
            value={filterValue}
            onChange={(e) => {
              setFilterValue(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50">
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.size === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider",
                    sortable &&
                      col.sortable !== false &&
                      "cursor-pointer hover:bg-white/10 transition-colors"
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {sortConfig?.key === col.key && (
                      <SortIndicator direction={sortConfig.direction} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "transition-colors",
                  rowIndex % 2 === 0
                    ? "bg-white/30 dark:bg-gray-800/30"
                    : "bg-gray-50/30 dark:bg-gray-900/30",
                  "hover:bg-blue-50/50 dark:hover:bg-blue-900/20",
                  selectedRows.has(rowIndex) &&
                    "bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                )}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => handleSelectRow(rowIndex)}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

// Sort indicator component
function SortIndicator({ direction }: { direction: "asc" | "desc" }) {
  return (
    <span className="text-blue-500 animate-fade-in">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = useMemo(() => {
    const result: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
    } else {
      result.push(1);

      if (currentPage > 3) result.push("ellipsis");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) result.push(i);

      if (currentPage < totalPages - 2) result.push("ellipsis");

      result.push(totalPages);
    }

    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {pages.map((page, i) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "w-8 h-8 text-sm rounded-lg transition-all duration-200",
                currentPage === page
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "hover:bg-white/10"
              )}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// Table skeleton loader
function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="rounded-xl overflow-hidden glass-card">
      <div className="p-4 border-b border-white/10">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/50 dark:bg-gray-900/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-white/30" : "bg-gray-50/30"}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Utility functions for testing
export function sortTableData<T extends Record<string, unknown>>(
  data: T[],
  key: keyof T,
  direction: "asc" | "desc"
): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal < bVal ? -1 : 1;
    return direction === "asc" ? comparison : -comparison;
  });
}

export function filterTableData<T extends Record<string, unknown>>(
  data: T[],
  columns: TableColumn<T>[],
  filterValue: string
): T[] {
  if (!filterValue) return data;

  return data.filter((row) =>
    columns.some((col) => {
      const value = row[col.key];
      return String(value).toLowerCase().includes(filterValue.toLowerCase());
    })
  );
}

export function paginateTableData<T>(
  data: T[],
  page: number,
  pageSize: number
): T[] {
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

export function getRowAlternation(index: number): "even" | "odd" {
  return index % 2 === 0 ? "even" : "odd";
}

export default DataTable;
