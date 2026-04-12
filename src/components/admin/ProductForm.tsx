import { useState, useRef } from "react";
import Modal from "../ui/Modal";
import { useToast } from "../../hooks/useToast";
import { PORTAL_LABELS, PORTAL_CATEGORIES, type Portal, type MockProduct } from "../../data/adminMockData";

interface ProductFormProps {
  portal: Portal;
  product: MockProduct | null;
  onClose: () => void;
}

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";

export default function ProductForm({ portal, product, onClose }: ProductFormProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEditing = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? PORTAL_CATEGORIES[portal][0]);
  const [quantity, setQuantity] = useState(product?.stock?.toString() ?? "0");
  const [threshold, setThreshold] = useState("10");
  const [isActive, setIsActive] = useState(product?.status === "active" || !product);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const qty = parseInt(quantity) || 0;
  const thresh = parseInt(threshold) || 10;

  const stockColor = qty === 0 ? "#DC2626" : qty <= thresh ? "#EA580C" : "#059669";
  const stockLabel = qty === 0 ? "Out of Stock" : qty <= thresh ? "Low Stock" : "In Stock";

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!price || isNaN(Number(price))) {
      toast.error("Valid price is required");
      return;
    }
    toast.success(isEditing ? "Product updated successfully" : "Product created successfully");
    onClose();
  };

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
                  onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 size-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[32px] text-[#94A3B8]">upload_file</span>
                <p className="text-sm text-[#64748B] mt-1">Drag and drop or click to upload</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">PNG, JPG up to 5MB</p>
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
        <div className="grid grid-cols-2 gap-4">
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
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} cursor-pointer`}>
              {PORTAL_CATEGORIES[portal].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity + Threshold */}
        <div className="grid grid-cols-2 gap-4">
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
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8ECF1]/60">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
          >
            {isEditing ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
