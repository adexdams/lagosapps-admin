import { useState, useMemo, type ReactNode } from "react";
import EmptyState from "./EmptyState";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => ReactNode;
  hideOnMobile?: boolean;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  paginated?: boolean;
  pageSize?: number;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  emptyIcon?: string;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  paginated = true,
  pageSize = 20,
  selectable = false,
  onRowClick,
  emptyIcon = "search_off",
  emptyMessage = "No results found",
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null || bVal == null) return 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDir]);

  const totalPages = paginated ? Math.ceil(sorted.length / pageSize) : 1;
  const pageData = paginated ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pageData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageData.map((_, i) => i)));
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <EmptyState icon={emptyIcon} title="Nothing here" description={emptyMessage} />
      </div>
    );
  }

  const alignClass = (a?: "left" | "center" | "right") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFC]">
              {selectable && (
                <th className="px-4 sm:px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === pageData.length && pageData.length > 0}
                    onChange={toggleAll}
                    className="accent-primary cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider ${alignClass(col.align)} ${col.hideOnMobile ? "hidden md:table-cell" : ""} ${col.sortable ? "cursor-pointer select-none hover:text-[#0F172A]" : ""}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="material-symbols-outlined text-[13px]">
                        {sortDir === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors ${onRowClick ? "cursor-pointer" : ""} ${selected.has(rowIdx) ? "bg-primary/5" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-4 sm:px-5 py-3.5 sm:py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(rowIdx)}
                      onChange={() => toggleSelect(rowIdx)}
                      className="accent-primary cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 sm:px-5 py-3.5 sm:py-4 text-[#334155] ${alignClass(col.align)} ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between bg-[#F8FAFC] border-t border-[#F1F5F9] text-sm">
          <span className="text-[#64748B] text-[13px]">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-[#64748B]">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`size-8 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
                    page === pageNum
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-white text-[#64748B]"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-[#64748B]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
