"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

/* DataTable — the one table in the platform.
 *
 * Every admin listing renders through this: users, payments, journey requests,
 * advisors, announcements. Columns are described, not marked up, so a screen
 * that wants a different order or an extra cell changes an array instead of a
 * block of <td>s.
 *
 * What it owns: the sticky header, the rounded rows, the hover state, the
 * horizontal scroll on narrow screens, the loading skeleton and the empty
 * state. What it deliberately does not own: fetching, filtering, searching and
 * pagination. Those already live in the pages, they already work, and moving
 * them in here would be the functional change this table is meant to avoid.
 *
 * Sorting is opt-in per column and stays client-side over the rows it is
 * given, so a page that sorts on the server can simply not set `sortable`. */

export type Column<T> = {
  /** Stable identity for the column; also the sort key. */
  key: string;
  header: ReactNode;
  /** Cell renderer. Given the row, returns whatever should sit in the cell. */
  cell: (row: T) => ReactNode;
  /** Value used for client-side sorting. Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  width?: number | string;
  align?: "left" | "right" | "center";
  /** Hidden below 900px, for columns that are context rather than content. */
  secondary?: boolean;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Whole-row activation. Rows become buttons for the keyboard when set. */
  onRowClick?: (row: T) => void;
  /** Marks a row as current, e.g. the conversation open beside the table. */
  isRowActive?: (row: T) => boolean;
  loading?: boolean;
  /** Skeleton row count while loading. */
  skeletonRows?: number;
  empty?: ReactNode;
  /** Rendered under the last row: pagination, totals, anything the page owns. */
  footer?: ReactNode;
  /** Caps the scroll height so the sticky header has something to stick to. */
  maxHeight?: number | string;
  className?: string;
  style?: CSSProperties;
};

export function DataTable<T>({
  columns, rows, rowKey, onRowClick, isRowActive, loading, skeletonRows = 6,
  empty, footer, maxHeight, className = "", style,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const read = col.sortValue;
    // A copy: the caller's array is theirs, and mutating it would fight React.
    return [...rows].sort((a, b) => {
      const x = read(a), y = read(b);
      const cmp = typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key: string) => {
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  };

  const colCount = columns.length;

  return (
    <div className={`ds-table-wrap ${className}`.trim()} style={style}>
      {/* The scroller is what overflows, so the page never scrolls sideways. */}
      <div className="ds-table-scroll" style={maxHeight ? { maxHeight } : undefined}>
        <table className="ds-table">
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const canSort = Boolean(c.sortValue);
                return (
                  <th
                    key={c.key}
                    className={`${c.secondary ? "secondary " : ""}${c.align === "right" ? "right" : c.align === "center" ? "center" : ""}`.trim() || undefined}
                    style={c.width ? { width: c.width } : undefined}
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {canSort ? (
                      <button type="button" className={`ds-th-sort${active ? " active" : ""}`} onClick={() => toggleSort(c.key)}>
                        {c.header}
                        {active
                          ? (sort.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)
                          : <ChevronsUpDown size={13} className="ds-th-hint" />}
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={`sk-${i}`} className="ds-tr-skeleton">
                  {columns.map((c) => (
                    <td key={c.key} className={c.secondary ? "secondary" : undefined}>
                      {/* Staggered so the block reads as loading, not as frozen. */}
                      <span className="ds-skel" style={{ animationDelay: `${i * 70}ms`, width: `${55 + ((i + c.key.length) % 4) * 12}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr className="ds-tr-empty">
                <td colSpan={colCount}>{empty ?? <span className="ds-table-empty">Nothing to show yet.</span>}</td>
              </tr>
            ) : (
              sorted.map((row) => {
                const active = isRowActive?.(row) ?? false;
                return (
                  <tr
                    key={rowKey(row)}
                    className={`${onRowClick ? "clickable " : ""}${active ? "active" : ""}`.trim() || undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    // A clickable row must be reachable and activatable without a mouse.
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    onKeyDown={onRowClick ? (e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); }
                    } : undefined}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`${c.secondary ? "secondary " : ""}${c.align === "right" ? "right" : c.align === "center" ? "center" : ""}`.trim() || undefined}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer && <div className="ds-table-foot">{footer}</div>}
    </div>
  );
}
