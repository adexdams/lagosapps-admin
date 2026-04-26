import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { useToast } from "../../hooks/useToast";
import { getCategories, createProduct, updateProduct, deleteProduct, logAudit } from "../../lib/api";
import { PORTAL_LABELS, type Portal } from "../../data/adminMockData";
import ImageUpload from "./shared/ImageUpload";

export interface ProductFormRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  category_id?: string | null;
  stock: number;
  low_stock_threshold?: number;
  status?: "active" | "inactive" | "out_of_stock";
  is_active?: boolean;
  member_covered?: boolean;
  image_url?: string | null;
  metadata?: Record<string, unknown>;
}

interface ProductFormProps {
  portal: Portal;
  product: ProductFormRecord | null;
  onClose: () => void;
  onSaved?: () => void;
}

interface Category { id: string; name: string; slug: string; }

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";
const smallLabelClass = "text-[12px] font-semibold text-[#334155] mb-1 block";

function computeStockStatus(stock: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= threshold) return "low_stock";
  return "in_stock";
}

// ── Portal-specific metadata shapes ─────────────────────────

interface SolarMeta {
  wattage?: number;
  brand?: string;
  battery_type?: "gel" | "lithium" | "";
}
interface TransportMeta {
  vehicle_type?: string;
  pickup_hours?: string;
  note?: string;
  mainland_price?: number;
  island_price?: number;
  outskirts_price?: number;
  abeokuta_price?: number;
  ibadan_price?: number;
}
interface HealthMeta { coming_soon?: boolean; }
interface EventsMeta {
  capacity?: number;
  location?: string;
  amenities?: string[];
  event_categories?: string[];
}
interface LogisticsMeta { store?: string; }

export default function ProductForm({ portal, product, onClose, onSaved }: ProductFormProps) {
  const toast = useToast();
  const isEditing = !!product;

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? "");
  const [quantity, setQuantity] = useState(product?.stock?.toString() ?? "0");
  const [threshold, setThreshold] = useState((product?.low_stock_threshold ?? 10).toString());
  const [isActive, setIsActive] = useState(
    product?.is_active ?? (product?.status ? product.status === "active" : true)
  );
  const [memberCovered, setMemberCovered] = useState(product?.member_covered ?? false);
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Portal metadata (initialized from existing product or defaults)
  const initialMeta = (product?.metadata ?? {}) as Record<string, unknown>;
  const [solarMeta, setSolarMeta] = useState<SolarMeta>({
    wattage: (initialMeta.wattage as number) ?? undefined,
    brand: (initialMeta.brand as string) ?? "",
    battery_type: (initialMeta.battery_type as "gel" | "lithium" | "") ?? "",
  });
  const [transportMeta, setTransportMeta] = useState<TransportMeta>({
    vehicle_type: (initialMeta.vehicle_type as string) ?? "",
    pickup_hours: (initialMeta.pickup_hours as string) ?? "",
    note: (initialMeta.note as string) ?? "",
    mainland_price: (initialMeta.mainland_price as number) ?? undefined,
    island_price: (initialMeta.island_price as number) ?? undefined,
    outskirts_price: (initialMeta.outskirts_price as number) ?? undefined,
    abeokuta_price: (initialMeta.abeokuta_price as number) ?? undefined,
    ibadan_price: (initialMeta.ibadan_price as number) ?? undefined,
  });
  const [healthMeta, setHealthMeta] = useState<HealthMeta>({
    coming_soon: (initialMeta.coming_soon as boolean) ?? false,
  });
  const [eventsMeta, setEventsMeta] = useState<EventsMeta>({
    capacity: (initialMeta.capacity as number) ?? undefined,
    location: (initialMeta.location as string) ?? "",
    amenities: (initialMeta.amenities as string[]) ?? [],
    event_categories: (initialMeta.event_categories as string[]) ?? [],
  });
  const [logisticsMeta, setLogisticsMeta] = useState<LogisticsMeta>({
    store: (initialMeta.store as string) ?? "",
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [newEventCategory, setNewEventCategory] = useState("");

  // Load categories
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await getCategories(portal);
      if (cancelled) return;
      if (error) {
        toast.error(`Failed to load categories: ${error.message}`);
        return;
      }
      const rows = (data as Category[]) ?? [];
      setCategories(rows);
      if (!isEditing && !categoryId && rows.length > 0) setCategoryId(rows[0].id);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal]);

  const qty = parseInt(quantity) || 0;
  const thresh = parseInt(threshold) || 10;
  const stockColor = qty === 0 ? "#DC2626" : qty <= thresh ? "#EA580C" : "#059669";
  const stockLabel = qty === 0 ? "Out of Stock" : qty <= thresh ? "Low Stock" : "In Stock";

  function buildMetadata(): Record<string, unknown> {
    switch (portal) {
      case "solar":
        return {
          ...(solarMeta.wattage != null && { wattage: solarMeta.wattage }),
          ...(solarMeta.brand && { brand: solarMeta.brand }),
          ...(solarMeta.battery_type && { battery_type: solarMeta.battery_type }),
        };
      case "transport":
        return {
          ...(transportMeta.vehicle_type && { vehicle_type: transportMeta.vehicle_type }),
          ...(transportMeta.pickup_hours && { pickup_hours: transportMeta.pickup_hours }),
          ...(transportMeta.note && { note: transportMeta.note }),
          ...(transportMeta.mainland_price != null && { mainland_price: transportMeta.mainland_price }),
          ...(transportMeta.island_price != null && { island_price: transportMeta.island_price }),
          ...(transportMeta.outskirts_price != null && { outskirts_price: transportMeta.outskirts_price }),
          ...(transportMeta.abeokuta_price != null && { abeokuta_price: transportMeta.abeokuta_price }),
          ...(transportMeta.ibadan_price != null && { ibadan_price: transportMeta.ibadan_price }),
        };
      case "health":
        return healthMeta.coming_soon ? { coming_soon: true } : {};
      case "events":
        return {
          ...(eventsMeta.capacity != null && { capacity: eventsMeta.capacity }),
          ...(eventsMeta.location && { location: eventsMeta.location }),
          ...(eventsMeta.amenities && eventsMeta.amenities.length > 0 && { amenities: eventsMeta.amenities }),
          ...(eventsMeta.event_categories && eventsMeta.event_categories.length > 0 && { event_categories: eventsMeta.event_categories }),
        };
      case "logistics":
        return logisticsMeta.store ? { store: logisticsMeta.store } : {};
      default:
        return {};
    }
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Product name is required"); return; }
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum < 0) { toast.error("Valid price is required"); return; }

    setSaving(true);

    const stock = qty;
    const lowStockThreshold = thresh;
    const stockStatus = computeStockStatus(stock, lowStockThreshold);
    const metadata = buildMetadata();

    const payload = {
      portal_id: portal,
      category_id: categoryId || null,
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      stock,
      low_stock_threshold: lowStockThreshold,
      stock_status: stockStatus,
      is_active: isActive,
      member_covered: memberCovered,
      image_url: imageUrl,
      metadata,
    };

    if (isEditing) {
      const oldValues = {
        name: product!.name,
        price: product!.price,
        stock: product!.stock,
        is_active: product!.is_active,
        category_id: product!.category_id,
      };
      const { error } = await updateProduct(product!.id, payload);
      setSaving(false);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      await logAudit({
        action: "product.update",
        entity_type: "product",
        entity_id: product!.id,
        old_values: oldValues,
        new_values: { name: payload.name, price: payload.price, stock: payload.stock, is_active: payload.is_active, category_id: payload.category_id },
      });
      toast.success("Product updated");
    } else {
      const { data, error } = await createProduct(payload);
      setSaving(false);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      const newId = (data as { id?: string })?.id;
      await logAudit({
        action: "product.create",
        entity_type: "product",
        entity_id: newId,
        new_values: { name: payload.name, portal_id: payload.portal_id, price: payload.price },
      });
      toast.success("Product created");
    }

    onSaved?.();
    onClose();
  }

  async function handleDelete() {
    if (!product) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await deleteProduct(product.id);
    setDeleting(false);
    if (error) { toast.error(`Delete failed: ${error.message}`); return; }
    await logAudit({
      action: "product.delete",
      entity_type: "product",
      entity_id: product.id,
      old_values: { name: product.name, price: product.price },
    });
    toast.success("Product deleted");
    onSaved?.();
    onClose();
  }

  // ── Tag input helpers ──
  function addAmenity() {
    if (!newAmenity.trim()) return;
    setEventsMeta((m) => ({ ...m, amenities: [...(m.amenities ?? []), newAmenity.trim()] }));
    setNewAmenity("");
  }
  function removeAmenity(idx: number) {
    setEventsMeta((m) => ({ ...m, amenities: (m.amenities ?? []).filter((_, i) => i !== idx) }));
  }
  function addEventCategory() {
    if (!newEventCategory.trim()) return;
    setEventsMeta((m) => ({ ...m, event_categories: [...(m.event_categories ?? []), newEventCategory.trim()] }));
    setNewEventCategory("");
  }
  function removeEventCategory(idx: number) {
    setEventsMeta((m) => ({ ...m, event_categories: (m.event_categories ?? []).filter((_, i) => i !== idx) }));
  }

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? "Edit Product" : `New ${PORTAL_LABELS[portal]} Product`} size="md">
      <div className="space-y-5">
        {/* Image upload */}
        <div>
          <label className={labelClass}>Product Image</label>
          <ImageUpload
            bucket="products"
            pathPrefix={portal}
            value={imageUrl}
            onUploaded={setImageUrl}
            onRemove={() => setImageUrl(null)}
            disabled={saving || deleting}
          />
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Product name" />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Brief description..." />
        </div>

        {/* Price + Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={labelClass}>Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">{"\u20A6"}</span>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={`${inputClass} pl-7`} placeholder="0" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity + Threshold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={labelClass}>
              Quantity Available
              <span className="ml-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${stockColor}15`, color: stockColor }}>{stockLabel}</span>
            </label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Low Stock Threshold</label>
            <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* ─── Portal-specific metadata ─── */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3 border border-[#E8ECF1]">
          <p className="text-[13px] font-bold text-[#0F172A]">{PORTAL_LABELS[portal].split(",")[0]} details</p>

          {portal === "solar" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={smallLabelClass}>Wattage</label>
                <div className="relative">
                  <input type="number" value={solarMeta.wattage ?? ""} onChange={(e) => setSolarMeta({ ...solarMeta, wattage: e.target.value ? Number(e.target.value) : undefined })} className={`${inputClass} pr-9`} placeholder="650" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#94A3B8]">W</span>
                </div>
              </div>
              <div>
                <label className={smallLabelClass}>Brand</label>
                <input type="text" value={solarMeta.brand ?? ""} onChange={(e) => setSolarMeta({ ...solarMeta, brand: e.target.value })} className={inputClass} placeholder="SMS, Growatt…" />
              </div>
              <div>
                <label className={smallLabelClass}>Battery Type</label>
                <select value={solarMeta.battery_type ?? ""} onChange={(e) => setSolarMeta({ ...solarMeta, battery_type: e.target.value as "gel" | "lithium" | "" })} className={`${inputClass} cursor-pointer`}>
                  <option value="">N/A</option>
                  <option value="gel">Gel</option>
                  <option value="lithium">Lithium</option>
                </select>
              </div>
            </div>
          )}

          {portal === "transport" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={smallLabelClass}>Vehicle Type</label>
                  <input type="text" value={transportMeta.vehicle_type ?? ""} onChange={(e) => setTransportMeta({ ...transportMeta, vehicle_type: e.target.value })} className={inputClass} placeholder="Sedan, SUV, Bus…" />
                </div>
                <div>
                  <label className={smallLabelClass}>Pickup Hours</label>
                  <input type="text" value={transportMeta.pickup_hours ?? ""} onChange={(e) => setTransportMeta({ ...transportMeta, pickup_hours: e.target.value })} className={inputClass} placeholder="7 AM – 11 AM" />
                </div>
              </div>
              <div>
                <label className={smallLabelClass}>Zone Pricing (₦)</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(["mainland", "island", "outskirts", "abeokuta", "ibadan"] as const).map((zone) => (
                    <div key={zone}>
                      <label className="text-[10px] font-semibold text-[#94A3B8] uppercase mb-0.5 block">{zone}</label>
                      <input
                        type="number"
                        value={(transportMeta[`${zone}_price` as keyof TransportMeta] as number | undefined) ?? ""}
                        onChange={(e) => setTransportMeta({ ...transportMeta, [`${zone}_price`]: e.target.value ? Number(e.target.value) : undefined })}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className={smallLabelClass}>Note</label>
                <input type="text" value={transportMeta.note ?? ""} onChange={(e) => setTransportMeta({ ...transportMeta, note: e.target.value })} className={inputClass} placeholder="3-day minimum for non-members" />
              </div>
            </>
          )}

          {portal === "health" && (
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-[13px] font-semibold text-[#334155]">Coming Soon</p>
                <p className="text-[11px] text-[#94A3B8]">Hide from purchase but show as preview</p>
              </div>
              <button
                type="button"
                onClick={() => setHealthMeta({ coming_soon: !healthMeta.coming_soon })}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${healthMeta.coming_soon ? "bg-primary" : "bg-[#E2E8F0]"}`}
              >
                <div className={`size-5 bg-white rounded-full shadow transition-transform ${healthMeta.coming_soon ? "translate-x-5" : ""}`} />
              </button>
            </div>
          )}

          {portal === "events" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={smallLabelClass}>Capacity</label>
                  <input type="number" value={eventsMeta.capacity ?? ""} onChange={(e) => setEventsMeta({ ...eventsMeta, capacity: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} placeholder="50" />
                </div>
                <div>
                  <label className={smallLabelClass}>Location</label>
                  <input type="text" value={eventsMeta.location ?? ""} onChange={(e) => setEventsMeta({ ...eventsMeta, location: e.target.value })} className={inputClass} placeholder="Ikeja, Lagos" />
                </div>
              </div>

              <div>
                <label className={smallLabelClass}>Amenities</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(eventsMeta.amenities ?? []).map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-[#EFF6FF] text-[#1E40AF] font-semibold">
                      {a}
                      <button type="button" onClick={() => removeAmenity(i)} className="cursor-pointer hover:text-red-600">
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())} className={`${inputClass} flex-1`} placeholder="Projector, WiFi, AC…" />
                  <button type="button" onClick={addAmenity} className="px-3 py-2 text-xs font-semibold bg-primary text-white rounded-lg cursor-pointer hover:brightness-[0.92]">Add</button>
                </div>
              </div>

              <div>
                <label className={smallLabelClass}>Event Categories</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(eventsMeta.event_categories ?? []).map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-[#F5F3FF] text-[#7C3AED] font-semibold">
                      {c}
                      <button type="button" onClick={() => removeEventCategory(i)} className="cursor-pointer hover:text-red-600">
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newEventCategory} onChange={(e) => setNewEventCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEventCategory())} className={`${inputClass} flex-1`} placeholder="Wedding, Conference, Birthday…" />
                  <button type="button" onClick={addEventCategory} className="px-3 py-2 text-xs font-semibold bg-primary text-white rounded-lg cursor-pointer hover:brightness-[0.92]">Add</button>
                </div>
              </div>
            </>
          )}

          {portal === "logistics" && (
            <div>
              <label className={smallLabelClass}>Supported Store</label>
              <input type="text" value={logisticsMeta.store ?? ""} onChange={(e) => setLogisticsMeta({ store: e.target.value })} className={inputClass} placeholder="Amazon, eBay, Shein…" />
            </div>
          )}

          {portal === "groceries" && <p className="text-[12px] text-[#94A3B8]">No portal-specific fields needed. Category handles grouping.</p>}
          {portal === "community" && <p className="text-[12px] text-[#94A3B8]">No portal-specific fields needed. Category handles grouping.</p>}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-[13px] font-semibold text-[#0F172A]">Active</span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${isActive ? "bg-primary" : "bg-[#E2E8F0]"}`}
          >
            <div className={`size-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Member covered toggle */}
        <div className="flex items-center justify-between py-2 border-t border-[#E8ECF1]/60">
          <div>
            <span className="text-[13px] font-semibold text-[#0F172A]">Member Covered</span>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Included in membership — no charge at checkout</p>
          </div>
          <button
            onClick={() => setMemberCovered(!memberCovered)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${memberCovered ? "bg-primary" : "bg-[#E2E8F0]"}`}
          >
            <div className={`size-5 bg-white rounded-full shadow transition-transform ${memberCovered ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E8ECF1]/60">
          <div>
            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={deleting || saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={saving || deleting} className="px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || deleting} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all disabled:opacity-50">
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
