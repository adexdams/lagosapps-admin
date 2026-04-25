import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import {
  getMembershipTiers,
  updateMembershipTier,
  updateMembershipTierBenefit,
  createMembershipTierBenefit,
  deleteMembershipTierBenefit,
  logAudit,
} from "../../lib/api";

interface TierBenefit {
  id: string;
  tier_id: string;
  label: string;
  benefit_key: string;
  limit_count: number | null;
  limit_period: "month" | "quarter" | "year" | null;
  sort_order: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface TierConfig {
  id: string;
  name: string;
  color: string;
  annual_price: number;
  quarterly_price: number;
  benefits: TierBenefit[];
}

function labelToKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "benefit";
}

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

export default function MembershipTierConfig() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await getMembershipTiers();
      if (data) {
        setTiers(
          (data as Array<{
            id: string; name: string; color: string;
            annual_price: number; quarterly_price: number;
            membership_tier_benefits?: TierBenefit[];
          }>).map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            annual_price: t.annual_price,
            quarterly_price: t.quarterly_price,
            benefits: (t.membership_tier_benefits ?? []).map((b) => ({ ...b })),
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const updatePrice = (tierId: string, field: "annual_price" | "quarterly_price", value: string) => {
    setTiers((prev) =>
      prev.map((t) => t.id === tierId ? { ...t, [field]: parseFloat(value) || 0 } : t)
    );
  };

  const updateBenefit = (tierId: string, benefitId: string, field: keyof TierBenefit, value: unknown) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? { ...t, benefits: t.benefits.map((b) => b.id === benefitId ? { ...b, [field]: value } : b) }
          : t
      )
    );
  };

  const addBenefit = (tierId: string) => {
    const newBenefit: TierBenefit = {
      id: `new-${Date.now()}`,
      tier_id: tierId,
      label: "New Benefit",
      benefit_key: `benefit_${Date.now()}`,
      limit_count: 1,
      limit_period: "month",
      sort_order: 99,
      isNew: true,
    };
    setTiers((prev) =>
      prev.map((t) => t.id === tierId ? { ...t, benefits: [...t.benefits, newBenefit] } : t)
    );
  };

  const removeBenefit = (tierId: string, benefitId: string) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              benefits: t.benefits.map((b) =>
                b.id === benefitId ? { ...b, isDeleted: true } : b
              ),
            }
          : t
      )
    );
  };

  const handleSave = async (tier: TierConfig) => {
    setSaving(tier.id);

    const { error: priceErr } = await updateMembershipTier(tier.id, {
      annual_price: tier.annual_price,
      quarterly_price: tier.quarterly_price,
    });

    if (priceErr) { toast.error(`Failed to save ${tier.name} prices`); setSaving(null); return; }

    // Save benefit changes
    const benefitErrors: string[] = [];
    for (const b of tier.benefits) {
      if (b.isDeleted && !b.isNew) {
        const { error } = await deleteMembershipTierBenefit(b.id);
        if (error) benefitErrors.push(b.label);
      } else if (b.isNew && !b.isDeleted) {
        const { error } = await createMembershipTierBenefit({
          tier_id: tier.id,
          label: b.label,
          benefit_key: labelToKey(b.label),
          limit_count: b.limit_period ? (b.limit_count ?? null) : null,
          limit_period: b.limit_period ?? null,
          sort_order: b.sort_order,
        });
        if (error) benefitErrors.push(b.label);
      } else if (!b.isDeleted && !b.isNew) {
        const { error } = await updateMembershipTierBenefit(b.id, {
          label: b.label,
          benefit_key: labelToKey(b.label),
          limit_count: b.limit_period ? (b.limit_count ?? null) : null,
          limit_period: b.limit_period ?? null,
        });
        if (error) benefitErrors.push(b.label);
      }
    }

    logAudit({
      action: "membership_tier.update",
      entity_type: "membership_tier",
      entity_id: tier.id,
      new_values: { annual_price: tier.annual_price, quarterly_price: tier.quarterly_price },
    });

    if (benefitErrors.length > 0) {
      toast.error(`Prices saved, but some benefits failed: ${benefitErrors.join(", ")}`);
    } else {
      toast.success(`${tier.name} tier saved`);
    }

    // Refresh to get clean server state
    const { data } = await getMembershipTiers();
    if (data) {
      setTiers(
        (data as Array<{
          id: string; name: string; color: string;
          annual_price: number; quarterly_price: number;
          membership_tier_benefits?: TierBenefit[];
        }>).map((t) => ({
          id: t.id, name: t.name, color: t.color,
          annual_price: t.annual_price, quarterly_price: t.quarterly_price,
          benefits: (t.membership_tier_benefits ?? []).map((b) => ({ ...b })),
        }))
      );
    }

    setEditingTier(null);
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[#94A3B8]">Loading tier configuration...</div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="flex gap-6 items-start">
        {/* Sticky sidebar nav */}
        <nav className="hidden lg:flex flex-col gap-1 w-40 flex-shrink-0 sticky top-20 self-start">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => document.getElementById(`tier-${tier.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#334155] transition-all text-left cursor-pointer"
            >
              <span className="size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tier.color }} />
              {tier.name}
            </button>
          ))}
        </nav>

        {/* Tier cards */}
        <div className="flex-1 space-y-6 min-w-0">
      {tiers.map((tier) => {
        const isEditing = editingTier === tier.id;
        const isSaving = saving === tier.id;
        const visibleBenefits = tier.benefits.filter((b) => !b.isDeleted);

        return (
          <div key={tier.id} id={`tier-${tier.id}`} className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden scroll-mt-24">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Annual Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">₦</span>
                    <input
                      type="number"
                      value={tier.annual_price}
                      onChange={(e) => updatePrice(tier.id, "annual_price", e.target.value)}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Quarterly Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">₦</span>
                    <input
                      type="number"
                      value={tier.quarterly_price}
                      onChange={(e) => updatePrice(tier.id, "quarterly_price", e.target.value)}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-2 block">Benefits</label>
                <div className="space-y-2">
                  {visibleBenefits.map((benefit) => (
                    <div key={benefit.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={benefit.label}
                            onChange={(e) => updateBenefit(tier.id, benefit.id, "label", e.target.value)}
                            className={`${inputClass} flex-1`}
                            placeholder="Benefit label"
                          />
                          <input
                            type="number"
                            value={benefit.limit_count ?? ""}
                            onChange={(e) => updateBenefit(tier.id, benefit.id, "limit_count", e.target.value ? parseInt(e.target.value) : null)}
                            className="w-20 border border-[#E2E8F0] rounded-xl px-2 py-2.5 text-sm text-[#0F172A] outline-none"
                            placeholder="∞"
                            min="1"
                          />
                          <select
                            value={benefit.limit_period ?? ""}
                            onChange={(e) => updateBenefit(tier.id, benefit.id, "limit_period", e.target.value || null)}
                            className="border border-[#E2E8F0] rounded-xl px-2 py-2.5 text-sm text-[#334155] bg-white outline-none cursor-pointer"
                          >
                            <option value="">No period</option>
                            <option value="month">per Month</option>
                            <option value="quarter">per Quarter</option>
                            <option value="year">per Year</option>
                          </select>
                          <button
                            onClick={() => removeBenefit(tier.id, benefit.id)}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEF2F2] cursor-pointer transition-colors flex-shrink-0"
                          >
                            <span className="material-symbols-outlined text-[16px] text-[#DC2626]">delete</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 py-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#059669]">check_circle</span>
                          <span className="text-sm text-[#334155]">
                            {benefit.label}
                            {benefit.limit_count ? ` · ${benefit.limit_count}/${benefit.limit_period}` : " · Unlimited"}
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

              <p className="text-[12px] text-[#94A3B8]">
                Price changes take effect immediately for the user-facing app. Benefits apply to new subscriptions only.
              </p>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave(tier)}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : `Save ${tier.name}`}
                </button>
              </div>
            </div>
          </div>
        );
      })}
        </div>{/* end tier cards */}
      </div>{/* end flex row */}
    </div>
  );
}
