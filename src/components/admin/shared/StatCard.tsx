interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
}

export default function StatCard({ label, value, icon, color, trend, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all relative ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Trend pill — top right */}
      {trend && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
              trend.positive
                ? "bg-[#ECFDF5] text-[#059669]"
                : "bg-[#FEF2F2] text-[#DC2626]"
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {trend.positive ? "arrow_upward" : "arrow_downward"}
            </span>
            {trend.value}
          </span>
        </div>
      )}

      {/* Icon */}
      <div
        className="size-9 sm:size-10 md:size-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 md:mb-4"
        style={{ backgroundColor: `${color}14` }}
      >
        <span
          className="material-symbols-outlined text-[20px] sm:text-[22px] md:text-[26px]"
          style={{ color }}
        >
          {icon}
        </span>
      </div>

      {/* Value */}
      <p className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-none mb-0.5 sm:mb-1">
        {value}
      </p>

      {/* Label */}
      <p className="text-[11px] sm:text-[13px] text-[#64748B] font-medium">{label}</p>
    </div>
  );
}
