import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";

interface TierBenefit {
  id: string;
  label: string;
  measureType: "count" | "percentage" | "boolean";
  value: string;
  period: "month" | "quarter" | "year" | "lifetime";
}

interface TierConfig {
  id: string;
  name: string;
  color: string;
  annualPrice: number;
  quarterlyPrice: number;
  benefits: TierBenefit[];
}

const INITIAL_TIERS: TierConfig[] = [
  {
    id: "bronze",
    name: "Bronze",
    color: "#CD7F32",
    annualPrice: 24000,
    quarterlyPrice: 8000,
    benefits: [
      { id: "b1", label: "Free Deliveries", measureType: "count", value: "3", period: "month" },
      { id: "b2", label: "Grocery Discount", measureType: "percentage", value: "5", period: "month" },
      { id: "b3", label: "Priority Support", measureType: "boolean", value: "true", period: "lifetime" },
    ],
  },
  {
    id: "silver",
    name: "Silver",
    color: "#94A3B8",
    annualPrice: 42000,
    quarterlyPrice: 13500,
    benefits: [
      { id: "s1", label: "Free Deliveries", measureType: "count", value: "10", period: "month" },
      { id: "s2", label: "Grocery Discount", measureType: "percentage", value: "10", period: "month" },
      { id: "s3", label: "Priority Support", measureType: "boolean", value: "true", period: "lifetime" },
      { id: "s4", label: "Event Tickets Discount", measureType: "percentage", value: "15", period: "quarter" },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    color: "#D97706",
    annualPrice: 72000,
    quarterlyPrice: 22000,
    benefits: [
      { id: "g1", label: "Free Deliveries", measureType: "count", value: "Unlimited", period: "month" },
      { id: "g2", label: "Grocery Discount", measureType: "percentage", value: "20", period: "month" },
      { id: "g3", label: "Priority Support", measureType: "boolean", value: "true", period: "lifetime" },
      { id: "g4", label: "Event Tickets Discount", measureType: "percentage", value: "25", period: "quarter" },
      { id: "g5", label: "Health Checkup", measureType: "count", value: "1", period: "quarter" },
      { id: "g6", label: "Solar Maintenance Visit", measureType: "count", value: "2", period: "year" },
    ],
  },
];

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

export default function MembershipTierConfig() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tiers, setTiers] = useState<TierConfig[]>(INITIAL_TIERS);
  const [editingTier, setEditingTier] = useState<string | null>(null);

  const updateTierPrice = (tierId: string, field: "annualPrice" | "quarterlyPrice", value: string) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, [field]: parseInt(value) || 0 } : t))
    );
  };

  const updateBenefit = (tierId: string, benefitId: string, field: keyof TierBenefit, value: string) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              benefits: t.benefits.map((b) => (b.id === benefitId ? { ...b, [field]: value } : b)),
            }
          : t
      )
    );
  };

  const addBenefit = (tierId: string) => {
    const newBenefit: TierBenefit = {
      id: `${tierId}-${Date.now()}`,
      label: "New Benefit",
      measureType: "count",
      value: "1",
      period: "month",
    };
    setTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, benefits: [...t.benefits, newBenefit] } : t))
    );
  };

  const removeBenefit = (tierId: string, benefitId: string) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId ? { ...t, benefits: t.benefits.filter((b) => b.id !== benefitId) } : t
      )
    );
  };

  const handleSave = (tierName: string) => {
    toast.success(`${tierName} tier configuration saved`);
    setEditingTier(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate("/membership")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Membership
      </button>

      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Tier Configuration</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Configure pricing and benefits for each membership tier</p>
      </div>

      {/* Tier cards */}
      {tiers.map((tier) => {
        const isEditing = editingTier === tier.id;
        return (
          <div key={tier.id} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            {/* Colored header */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: `${tier.color}15` }}>
              <h3 className="text-base font-bold" style={{ color: tier.color }}>{tier.name}</h3>
              <button
                onClick={() => setEditingTier(isEditing ? null : tier.id)}
                className="text-sm font-semibold cursor-pointer transition-colors"
                style={{ color: tier.color }}
              >
                {isEditing ? "Cancel" : "Edit Benefits"}
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Pricing inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Annual Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">{"\u20A6"}</span>
                    <input
                      type="number"
                      value={tier.annualPrice}
                      onChange={(e) => updateTierPrice(tier.id, "annualPrice", e.target.value)}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Quarterly Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">{"\u20A6"}</span>
                    <input
                      type="number"
                      value={tier.quarterlyPrice}
                      onChange={(e) => updateTierPrice(tier.id, "quarterlyPrice", e.target.value)}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-2 block">Benefits</label>
                <div className="space-y-2">
                  {tier.benefits.map((benefit) => (
                    <div key={benefit.id} className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={benefit.label}
                            onChange={(e) => updateBenefit(tier.id, benefit.id, "label", e.target.value)}
                            className={`${inputClass} flex-1`}
                          />
                          <select
                            value={benefit.measureType}
                            onChange={(e) => updateBenefit(tier.id, benefit.id, "measureType", e.target.value)}
                            className="border border-[#E2E8F0] rounded-xl px-2 py-2.5 text-sm text-[#334155] bg-white outline-none cursor-pointer"
                          >
                            <option value="count">Count</option>
                            <option value="percentage">Percentage</option>
                            <option value="boolean">Boolean</option>
                          </select>
                          <input
                            type="text"
                            value={benefit.value}
                            onChange={(e) => updateBenefit(tier.id, benefit.id, "value", e.target.value)}
                            className="w-20 border border-[#E2E8F0] rounded-xl px-2 py-2.5 text-sm text-[#0F172A] outline-none"
                          />
                          <select
                            value={benefit.period}
                            onChange={(e) => updateBenefit(tier.id, benefit.id, "period", e.target.value)}
                            className="border border-[#E2E8F0] rounded-xl px-2 py-2.5 text-sm text-[#334155] bg-white outline-none cursor-pointer"
                          >
                            <option value="month">Month</option>
                            <option value="quarter">Quarter</option>
                            <option value="year">Year</option>
                            <option value="lifetime">Lifetime</option>
                          </select>
                          <button
                            onClick={() => removeBenefit(tier.id, benefit.id)}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEF2F2] cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px] text-[#DC2626]">delete</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 py-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#059669]">check_circle</span>
                          <span className="text-sm text-[#334155]">
                            {benefit.label}: {benefit.value}{benefit.measureType === "percentage" ? "%" : ""} / {benefit.period}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <button
                    onClick={() => addBenefit(tier.id)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3 cursor-pointer hover:underline"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Benefit
                  </button>
                )}
              </div>

              {/* Info text */}
              <p className="text-[12px] text-[#94A3B8]">
                Changes will apply to new subscriptions. Existing subscribers keep their current benefits until renewal.
              </p>

              {/* Save */}
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave(tier.name)}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
                >
                  Save {tier.name}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
