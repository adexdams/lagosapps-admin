export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2.5 flex-1 min-w-0 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <span className="material-symbols-outlined text-[18px] text-[#94A3B8] flex-shrink-0">
            search
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none min-w-0"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#334155] bg-white outline-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Export button */}
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
