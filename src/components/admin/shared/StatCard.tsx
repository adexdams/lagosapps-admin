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
      className={`bg-white rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all relative ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Trend pill — top right */}
      {trend && (
        <div className="absolute top-4 right-4">
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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
        className="size-10 sm:size-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4"
        style={{ backgroundColor: `${color}14` }}
      >
        <span
          className="material-symbols-outlined text-[22px] sm:text-[26px]"
          style={{ color }}
        >
          {icon}
        </span>
      </div>

      {/* Value */}
      <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-none mb-1">
        {value}
      </p>

      {/* Label */}
      <p className="text-[13px] text-[#64748B] font-medium">{label}</p>
    </div>
  );
}
