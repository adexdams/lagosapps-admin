import { useState, useRef, useEffect } from "react";
import Modal from "../ui/Modal";
import { useToast } from "../../hooks/useToast";
import { supabase } from "../../lib/supabase";
import { getCategories, createProduct, updateProduct, deleteProduct } from "../../lib/api";
import { PORTAL_LABELS, type Portal } from "../../data/adminMockData";

// The shape InventoryPortal passes in — superset of DB and mock shapes
export interface ProductFormRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string; // legacy mock shape (name)
  category_id?: string | null;
  stock: number;
  low_stock_threshold?: number;
  status?: "active" | "inactive" | "out_of_stock"; // mock
  is_active?: boolean; // db
  image_url?: string | null;
}

interface ProductFormProps {
  portal: Portal;
  product: ProductFormRecord | null;
  onClose: () => void;
  onSaved?: () => void; // parent refetches after success
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";

function computeStockStatus(stock: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= threshold) return "low_stock";
  return "in_stock";
}

export default function ProductForm({ portal, product, onClose, onSaved }: ProductFormProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
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
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load categories for this portal
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
      // Default category if creating new and we have options
      if (!isEditing && !categoryId && rows.length > 0) {
        setCategoryId(rows[0].id);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal]);

  const qty = parseInt(quantity) || 0;
  const thresh = parseInt(threshold) || 10;

  const stockColor = qty === 0 ? "#DC2626" : qty <= thresh ? "#EA580C" : "#059669";
  const stockLabel = qty === 0 ? "Out of Stock" : qty <= thresh ? "Low Stock" : "In Stock";

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) pickFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) pickFile(file);
  };

  const pickFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return imagePreview; // keep existing URL if no new file
    const ext = imageFile.name.split(".").pop() ?? "png";
    const path = `${portal}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("products").upload(path, imageFile, { upsert: false });
    if (upErr) {
      toast.error(`Image upload failed: ${upErr.message}`);
      return null;
    }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Product name is required"); return; }
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum < 0) { toast.error("Valid price is required"); return; }

    setSaving(true);

    const imageUrl = await uploadImageIfNeeded();

    const stock = qty;
    const lowStockThreshold = thresh;
    const stockStatus = computeStockStatus(stock, lowStockThreshold);

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
      image_url: imageUrl,
    };

    const { error } = isEditing
      ? await updateProduct(product!.id, payload)
      : await createProduct(payload);

    setSaving(false);

    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success(isEditing ? "Product updated" : "Product created");
    onSaved?.();
    onClose();
  }

  async function handleDelete() {
    if (!product) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await deleteProduct(product.id);
    setDeleting(false);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success("Product deleted");
    onSaved?.();
    onClose();
  }

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? "Edit Product" : `New ${PORTAL_LABELS[portal]} Product`} size="md">
      <div className="space-y-5">
        {/* Image upload */}
        <div>
          <label className={labelClass}>Product Image</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:border-[#94A3B8]"
            }`}
          >
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-24 rounded-lg object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                  className="absolute -top-2 -right-2 size-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[32px] text-[#94A3B8]">upload_file</span>
                <p className="text-sm text-[#64748B] mt-1">Drag and drop or click to upload</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">PNG, JPG, WEBP up to 5MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${inputClass} pl-7`}
                placeholder="0"
              />
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
              <span className="ml-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${stockColor}15`, color: stockColor }}>
                {stockLabel}
              </span>
            </label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Low Stock Threshold</label>
            <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-[13px] font-semibold text-[#0F172A]">Active</span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
              isActive ? "bg-primary" : "bg-[#E2E8F0]"
            }`}
          >
            <div className={`size-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E8ECF1]/60">
          {/* Delete (only when editing) */}
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
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
