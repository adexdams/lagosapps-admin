interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "date" | "daterange";
  options?: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  onSearch: (query: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  filters: FilterConfig[];
  onExport?: () => void;
}

export default function FilterBar({
  onSearch,
  searchPlaceholder = "Search...",
  searchValue = "",
  filters,
  onExport,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Search input */}
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <span className="material-symbols-outlined text-[#94A3B8] text-[18px]">search</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>

        {/* Filter dropdowns */}
        {filters.map((filter) => {
          if (filter.type === "select" && filter.options) {
            return (
              <select
                key={filter.key}
                value={filter.value || ""}
                onChange={(e) => filter.onChange(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-no-repeat"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            );
          }
          if (filter.type === "date") {
            return (
              <input
                key={filter.key}
                type="date"
                value={filter.value || ""}
                onChange={(e) => filter.onChange(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder={filter.label}
              />
            );
          }
          return null;
        })}

        {/* Export button */}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        )}
      </div>
    </div>
  );
}
