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
      className={`bg-white rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5" : "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div
          className="size-10 sm:size-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + "14" }}
        >
          <span className="material-symbols-outlined text-[22px] sm:text-[26px]" style={{ color }}>
            {icon}
          </span>
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
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
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        <p className="text-[13px] text-[#64748B] font-medium">{label}</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
