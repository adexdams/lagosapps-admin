import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";

/* ── Types ────────────────────────────────────────────────────────────────── */

type MeasureType = "count" | "percentage" | "unlimited" | "text";
type BenefitPeriod = "per month" | "per quarter" | "per year";

interface Benefit {
  id: string;
  label: string;
  measureType: MeasureType;
  measureValue: string;
  period: BenefitPeriod;
}

interface TierConfig {
  name: string;
  tier: string;
  annualPrice: string;
  quarterlyPrice: string;
  benefits: Benefit[];
}

/* ── Benefit ID generator ─────────────────────────────────────────────────── */

let benefitIdCounter = 0;
function nextBenefitId(): string {
  benefitIdCounter += 1;
  return `ben-${benefitIdCounter}`;
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const TIER_COLORS: Record<string, string> = {
  bronze: "#8D6E63",
  silver: "#78909C",
  gold: "#F9A825",
};

const TIER_ICONS: Record<string, string> = {
  bronze: "shield",
  silver: "workspace_premium",
  gold: "diamond",
};

/* ── Select chevron SVG (used for dropdowns) ─────────────────────────────── */

const SELECT_CLASSES =
  "border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none bg-white pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-no-repeat";

const INPUT_CLASSES =
  "border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white";

/* ── Default tier data ────────────────────────────────────────────────────── */

const defaultTiers: TierConfig[] = [
  {
    name: "Bronze",
    tier: "bronze",
    annualPrice: "15000",
    quarterlyPrice: "5000",
    benefits: [
      { id: nextBenefitId(), label: "Free delivery", measureType: "count", measureValue: "3", period: "per month" },
      { id: nextBenefitId(), label: "Grocery discount", measureType: "percentage", measureValue: "5", period: "per month" },
      { id: nextBenefitId(), label: "Priority support", measureType: "text", measureValue: "Email", period: "per year" },
    ],
  },
  {
    name: "Silver",
    tier: "silver",
    annualPrice: "28000",
    quarterlyPrice: "8000",
    benefits: [
      { id: nextBenefitId(), label: "Free delivery", measureType: "count", measureValue: "10", period: "per month" },
      { id: nextBenefitId(), label: "Grocery discount", measureType: "percentage", measureValue: "10", period: "per month" },
      { id: nextBenefitId(), label: "Solar discount", measureType: "percentage", measureValue: "5", period: "per month" },
      { id: nextBenefitId(), label: "Priority support", measureType: "text", measureValue: "Phone + Email", period: "per year" },
    ],
  },
  {
    name: "Gold",
    tier: "gold",
    annualPrice: "55000",
    quarterlyPrice: "16000",
    benefits: [
      { id: nextBenefitId(), label: "Free delivery", measureType: "unlimited", measureValue: "", period: "per month" },
      { id: nextBenefitId(), label: "All portal discount", measureType: "percentage", measureValue: "15", period: "per month" },
      { id: nextBenefitId(), label: "Exclusive events", measureType: "unlimited", measureValue: "", period: "per year" },
      { id: nextBenefitId(), label: "Dedicated support", measureType: "text", measureValue: "24/7", period: "per year" },
      { id: nextBenefitId(), label: "Early access", measureType: "text", measureValue: "All products", period: "per year" },
    ],
  },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatMeasure(b: Benefit): string {
  if (b.measureType === "unlimited") return "Unlimited";
  if (b.measureType === "count") return b.measureValue;
  if (b.measureType === "percentage") return `${b.measureValue}%`;
  return b.measureValue;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function MembershipTierConfig() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tiers, setTiers] = useState<TierConfig[]>(defaultTiers);
  const [editingTier, setEditingTier] = useState<number | null>(null);

  /* ---------- tier CRUD helpers ---------- */

  function updateTierField(tierIdx: number, field: "annualPrice" | "quarterlyPrice", value: string) {
    setTiers((prev) => prev.map((t, i) => (i === tierIdx ? { ...t, [field]: value } : t)));
  }

  function updateBenefit(tierIdx: number, benefitId: string, field: keyof Benefit, value: string) {
    setTiers((prev) =>
      prev.map((t, i) =>
        i === tierIdx
          ? {
              ...t,
              benefits: t.benefits.map((b) =>
                b.id === benefitId ? { ...b, [field]: value } : b,
              ),
            }
          : t,
      ),
    );
  }

  function addBenefit(tierIdx: number) {
    setTiers((prev) =>
      prev.map((t, i) =>
        i === tierIdx
          ? {
              ...t,
              benefits: [
                ...t.benefits,
                { id: nextBenefitId(), label: "", measureType: "count" as MeasureType, measureValue: "", period: "per month" as BenefitPeriod },
              ],
            }
          : t,
      ),
    );
  }

  function removeBenefit(tierIdx: number, benefitId: string) {
    setTiers((prev) =>
      prev.map((t, i) =>
        i === tierIdx
          ? { ...t, benefits: t.benefits.filter((b) => b.id !== benefitId) }
          : t,
      ),
    );
  }

  function savePricing(tierIdx: number) {
    const tier = tiers[tierIdx];
    toast.success(`${tier.name} tier pricing saved`);
  }

  function saveBenefits(tierIdx: number) {
    const tier = tiers[tierIdx];
    setEditingTier(null);
    toast.success(`${tier.name} tier benefits saved`);
  }

  function cancelEditBenefits() {
    // Reset to defaults (in a real app you'd store a snapshot)
    setEditingTier(null);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate("/membership")}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Membership
      </button>

      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Tier Configuration
        </h1>
        <p className="text-[13px] text-[#64748B] mt-1">
          Configure pricing and benefits for each membership tier.
        </p>
      </div>

      {/* Tier cards — single column, stacked vertically */}
      <div className="space-y-5">
        {tiers.map((tier, tierIdx) => {
          const color = TIER_COLORS[tier.tier];
          const isEditing = editingTier === tierIdx;

          return (
            <div
              key={tier.tier}
              className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden"
            >
              {/* Card header with colored top border */}
              <div
                className="px-5 sm:px-6 py-4 border-b border-[#E8ECF1]/60"
                style={{ borderTop: `4px solid ${color}` }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: color + "18" }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color }}
                    >
                      {TIER_ICONS[tier.tier]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0F172A]">{tier.name}</h3>
                    <p className="text-[11px] text-[#94A3B8] font-medium">
                      {tier.benefits.length} benefit{tier.benefits.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 sm:px-6 py-5 space-y-5">
                {/* Pricing section — 2-column grid */}
                <div>
                  <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-3">
                    Pricing
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <div>
                      <label className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">
                        Annual Price
                      </label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] font-bold">
                          &#x20A6;
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={tier.annualPrice}
                          onChange={(e) => updateTierField(tierIdx, "annualPrice", e.target.value)}
                          className={`w-full pl-7 pr-3 ${INPUT_CLASSES}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">
                        Quarterly Price
                      </label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] font-bold">
                          &#x20A6;
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={tier.quarterlyPrice}
                          onChange={(e) => updateTierField(tierIdx, "quarterlyPrice", e.target.value)}
                          className={`w-full pl-7 pr-3 ${INPUT_CLASSES}`}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => savePricing(tierIdx)}
                    className="mt-3 px-4 py-2 text-[13px] font-bold rounded-xl cursor-pointer transition-all text-white hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: color }}
                  >
                    Save Pricing
                  </button>
                </div>

                {/* Benefits section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Benefits
                    </p>
                    {!isEditing && (
                      <button
                        onClick={() => setEditingTier(tierIdx)}
                        className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit Benefits
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    /* ── Edit mode ── */
                    <div className="space-y-2.5">
                      {tier.benefits.map((benefit) => (
                        <div
                          key={benefit.id}
                          className="rounded-xl border border-[#E8ECF1]/80 bg-[#F8FAFC] p-3 space-y-2"
                        >
                          {/* Row 1: label + delete */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Benefit label"
                              value={benefit.label}
                              onChange={(e) => updateBenefit(tierIdx, benefit.id, "label", e.target.value)}
                              className={`flex-1 ${INPUT_CLASSES}`}
                            />
                            <button
                              onClick={() => removeBenefit(tierIdx, benefit.id)}
                              className="size-9 flex-shrink-0 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                              title="Remove benefit"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>

                          {/* Row 2: measure type + value + period */}
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={benefit.measureType}
                              onChange={(e) =>
                                updateBenefit(tierIdx, benefit.id, "measureType", e.target.value)
                              }
                              className={`min-w-[110px] ${SELECT_CLASSES}`}
                            >
                              <option value="count">Count</option>
                              <option value="percentage">Percentage</option>
                              <option value="unlimited">Unlimited</option>
                              <option value="text">Text</option>
                            </select>
                            {benefit.measureType !== "unlimited" && (
                              <input
                                type="text"
                                placeholder={
                                  benefit.measureType === "count"
                                    ? "e.g. 10"
                                    : benefit.measureType === "percentage"
                                      ? "e.g. 15"
                                      : "Value"
                                }
                                value={benefit.measureValue}
                                onChange={(e) =>
                                  updateBenefit(tierIdx, benefit.id, "measureValue", e.target.value)
                                }
                                className={`flex-1 min-w-[80px] ${INPUT_CLASSES}`}
                              />
                            )}
                            <select
                              value={benefit.period}
                              onChange={(e) =>
                                updateBenefit(tierIdx, benefit.id, "period", e.target.value)
                              }
                              className={`min-w-[120px] ${SELECT_CLASSES}`}
                            >
                              <option value="per month">per month</option>
                              <option value="per quarter">per quarter</option>
                              <option value="per year">per year</option>
                            </select>
                          </div>
                        </div>
                      ))}

                      {/* Add benefit */}
                      <button
                        onClick={() => addBenefit(tierIdx)}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer mt-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Add Benefit
                      </button>

                      {/* Save / Cancel */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => saveBenefits(tierIdx)}
                          className="px-4 py-2 text-[13px] font-bold rounded-xl cursor-pointer transition-all text-white hover:opacity-90 active:scale-[0.98]"
                          style={{ backgroundColor: color }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditBenefits}
                          className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Read-only mode ── */
                    <div className="space-y-2">
                      {tier.benefits.map((benefit) => (
                        <div
                          key={benefit.id}
                          className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] border border-[#E8ECF1]/60 px-3.5 py-2.5"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-[#334155]">{benefit.label}</span>
                          </div>
                          <span className="text-[12px] font-semibold text-[#0F172A]">
                            {formatMeasure(benefit)}
                          </span>
                          <span className="text-[11px] text-[#94A3B8]">{benefit.period}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info text */}
                <p className="text-[11px] text-[#94A3B8] leading-snug">
                  Changes apply to all current and future subscribers of this tier.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
