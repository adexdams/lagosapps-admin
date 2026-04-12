interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center">
      {/* Icon circle */}
      <div className="size-16 sm:size-20 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-[28px] sm:text-[34px] text-[#94A3B8]">
          {icon}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1.5">{title}</h3>

      {/* Description */}
      <p className="text-sm text-[#64748B] max-w-sm mb-6">{description}</p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
