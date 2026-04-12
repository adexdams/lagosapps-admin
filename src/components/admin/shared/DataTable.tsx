import { useState } from "react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  keyField?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
  selectable = false,
  onRowClick,
  actions,
  keyField = "id",
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sort
  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null || bVal == null) return 0;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageData = sorted.slice(start, start + pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pageData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageData.map((r) => String(r[keyField]))));
    }
  };

  const getAlign = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  // Page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const rangeStart = Math.max(2, safePage - 1);
      const rangeEnd = Math.min(totalPages - 1, safePage + 1);
      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#F8FAFC]">
              {selectable && (
                <th className="px-2.5 sm:px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={pageData.length > 0 && selected.size === pageData.length}
                    onChange={toggleAll}
                    className="accent-primary cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider ${getAlign(col.align)} ${
                    col.hideOnMobile ? "hidden md:table-cell" : ""
                  } ${col.sortable ? "cursor-pointer select-none hover:text-[#334155]" : ""}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortDir === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-4 sm:px-5 py-12 text-center text-[#94A3B8] text-sm"
                >
                  No data found
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => {
                const rowId = String(row[keyField]);
                return (
                  <tr
                    key={rowId || idx}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${selected.has(rowId) ? "bg-primary/[0.03]" : ""}`}
                  >
                    {selectable && (
                      <td className="px-2.5 sm:px-4 py-3 sm:py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(rowId)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleRow(rowId);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-primary cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-2.5 sm:px-4 py-3 sm:py-3.5 text-[#334155] ${getAlign(col.align)} ${
                          col.hideOnMobile ? "hidden md:table-cell" : ""
                        }`}
                      >
                        {col.render ? col.render(row) : String(row[col.key] ?? "")}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-2.5 sm:px-4 py-3 sm:py-3.5 text-right">
                        <div onClick={(e) => e.stopPropagation()}>{actions(row)}</div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-[#F8FAFC] px-4 sm:px-5 py-3 flex items-center justify-between border-t border-[#E8ECF1]/60">
          <p className="text-[12px] text-[#64748B] hidden sm:block">
            Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
          </p>

          <div className="flex items-center gap-1 mx-auto sm:mx-0">
            {/* Prev */}
            <button
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="size-8 flex items-center justify-center rounded-lg text-[#64748B] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="size-8 flex items-center justify-center text-[12px] text-[#94A3B8]">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`size-8 flex items-center justify-center rounded-lg text-[12px] font-semibold cursor-pointer transition-colors ${
                    safePage === p
                      ? "bg-primary text-white"
                      : "text-[#64748B] hover:bg-white"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="size-8 flex items-center justify-center rounded-lg text-[#64748B] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
