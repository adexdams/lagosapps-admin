interface StatusBadgeProps {
  status: string;
  variant?: "default" | "membership" | "txn" | "notification";
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  // Order / general statuses
  completed: { bg: "#ECFDF5", text: "#059669" },
  active: { bg: "#ECFDF5", text: "#059669" },
  paid: { bg: "#ECFDF5", text: "#059669" },
  confirmed: { bg: "#ECFDF5", text: "#059669" },

  pending: { bg: "#FFF7ED", text: "#EA580C" },
  processing: { bg: "#FFF7ED", text: "#EA580C" },

  cancelled: { bg: "#FEF2F2", text: "#DC2626" },
  expired: { bg: "#FEF2F2", text: "#DC2626" },
  inactive: { bg: "#FEF2F2", text: "#DC2626" },
  failed: { bg: "#FEF2F2", text: "#DC2626" },

  // Membership tiers
  bronze: { bg: "#FDF4EF", text: "#8D6E63" },
  silver: { bg: "#F1F5F9", text: "#64748B" },
  gold: { bg: "#FFFBEB", text: "#D97706" },
  none: { bg: "#F1F5F9", text: "#94A3B8" },

  // Transaction types
  credit: { bg: "#ECFDF5", text: "#059669" },
  debit: { bg: "#FEF2F2", text: "#DC2626" },

  // Notification types
  order: { bg: "#FFF7ED", text: "#EA580C" },
  wallet: { bg: "#EFF6FF", text: "#2563EB" },
  membership: { bg: "#F5F3FF", text: "#7C3AED" },
  system: { bg: "#F1F5F9", text: "#64748B" },

  // Fulfillment
  out_of_stock: { bg: "#FEF2F2", text: "#DC2626" },

  // Service Requests
  new: { bg: "#EFF6FF", text: "#2563EB" },
  reviewing: { bg: "#FFF7ED", text: "#EA580C" },
  scheduled: { bg: "#F5F3FF", text: "#7C3AED" },
  in_progress: { bg: "#FFF7ED", text: "#EA580C" },
  declined: { bg: "#FEF2F2", text: "#DC2626" },

  // Custom orders
  under_review: { bg: "#FFF7ED", text: "#EA580C" },
  converted: { bg: "#ECFDF5", text: "#059669" },

  // Broadcast
  retracted: { bg: "#FEF2F2", text: "#DC2626" },
  draft: { bg: "#F1F5F9", text: "#94A3B8" },
  sent: { bg: "#ECFDF5", text: "#059669" },

  // Notification types (extended)
  broadcast: { bg: "#F5F3FF", text: "#7C3AED" },
};

const FALLBACK = { bg: "#F1F5F9", text: "#64748B" };

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const colors = COLOR_MAP[key] ?? FALLBACK;

  return (
    <span
      className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {status}
    </span>
  );
}
