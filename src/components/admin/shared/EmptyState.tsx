interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-3">
      <div className="size-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-outline/30 text-[32px]">{icon}</span>
      </div>
      <h3 className="text-base font-bold text-on-surface">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm text-center">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
