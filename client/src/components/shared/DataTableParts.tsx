"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { useUrlParam } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";

/*
 * Pieces for list tables: sortable headers, a pagination footer and a bar
 * for acting on selected rows. Sort and page live in the URL with the filters.
 */

export type SortDirection = "asc" | "desc";

/** Sort column, direction and page, kept in ?sort=, ?dir= and ?page=. */
export function useTableState(defaultSort: string, pageSize = 10) {
  const [sort, setSort] = useUrlParam("sort", defaultSort);
  const [dirParam, setDir] = useUrlParam("dir", "asc");
  const [pageParam, setPage] = useUrlParam("page", "1");
  const dir: SortDirection = dirParam === "desc" ? "desc" : "asc";

  const toggleSort = (key: string) => {
    if (sort === key) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setDir("asc");
    }
    setPage("1");
  };

  /** Sorts and slices rows; pass the value to sort by for each column key. */
  const apply = <T,>(rows: T[], sortValue: (row: T, key: string) => string | number) => {
    const sorted = [...rows].sort((a, b) => {
      const x = sortValue(a, sort);
      const y = sortValue(b, sort);
      const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
      return dir === "asc" ? order : -order;
    });
    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const page = Math.min(Math.max(1, Number(pageParam) || 1), pageCount);
    return { sorted, rows: sorted.slice((page - 1) * pageSize, page * pageSize), page, pageCount, total: sorted.length };
  };

  return { sort, dir, toggleSort, setPage: (p: number) => setPage(String(p)), resetPage: () => setPage("1"), apply, pageSize };
}

interface SortableHeadProps extends React.ComponentProps<typeof TableHead> {
  label: string;
  column: string;
  sort: string;
  dir: SortDirection;
  onSort: (column: string) => void;
}

/** A column header that sorts the table when selected. */
export function SortableHead({ label, column, sort, dir, onSort, className, ...props }: SortableHeadProps) {
  const active = sort === column;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"} className={className} {...props}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
          active && "text-foreground"
        )}
      >
        {label}
        <Icon aria-hidden className={cn("size-3.5", !active && "opacity-50")} />
      </button>
    </TableHead>
  );
}

interface TablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  noun: string;
  onPage: (page: number) => void;
}

/** "Showing 11–20 of 40 students" with previous and next. */
export function TablePagination({ page, pageCount, total, pageSize, noun, onPage }: TablePaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <nav
      aria-label="Pages"
      className="flex flex-col gap-3 border-t border-border bg-muted/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {first}–{last} of {total} {noun}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft data-icon="inline-start" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPage(page + 1)} disabled={page >= pageCount}>
          Next
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
}

interface SelectionBarProps {
  count: number;
  noun: string;
  onClear: () => void;
  children: React.ReactNode;
}

/** Shown above a table while rows are selected, with actions for the selection. */
export function SelectionBar({ count, noun, onClear, children }: SelectionBarProps) {
  if (count === 0) return null;
  return (
    <div
      role="region"
      aria-label="Selected rows"
      className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-secondary px-4 py-2.5 text-secondary-foreground sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium" aria-live="polite">
        {count} {count === 1 ? noun : `${noun}s`} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X data-icon="inline-start" />
          Clear
        </Button>
      </div>
    </div>
  );
}
