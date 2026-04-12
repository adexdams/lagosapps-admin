import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useToast } from "../../hooks/useToast";
import StatusBadge from "./shared/StatusBadge";
import type { MockProduct, Portal } from "../../data/adminMockData";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: MockProduct | null;
  portal: Portal;
}

const CATEGORIES: Record<Portal, string[]> = {
  solar: ["Panels", "Inverters", "Batteries", "Controllers"],
  transport: ["Vehicles"],
  groceries: ["Drinks", "Cereals", "Snacks", "Canned", "Staples", "Household"],
  health: ["Services", "Medical Tests", "Supplies"],
  events: ["Venues", "Coverage Services", "Event Types"],
  community: ["Courses", "Impact Areas", "Volunteer Areas", "Sponsorships", "Donations"],
  logistics: ["Delivery"],
};

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";

function computeStockStatus(qty: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (qty === 0) return "out_of_stock";
  if (qty <= threshold) return "low_stock";
  return "in_stock";
}

export default function ProductForm({ isOpen, onClose, product, portal }: ProductFormProps) {
  const toast = useToast();
  const isEdit = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [quantity, setQuantity] = useState(isEdit ? 25 : 0);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [active, setActive] = useState(product?.active ?? true);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stockStatus = computeStockStatus(quantity, lowStockThreshold);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!category) {
      toast.error("Category is required");
      return;
    }
    toast.success(isEdit ? `"${name}" updated successfully` : `"${name}" created successfully`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Product" : "Add Product"} size="md">
      <div className="space-y-5">
        {/* Portal badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#64748B]">Portal:</span>
          <StatusBadge status={portal} />
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Product name"
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Brief description"
          />
        </div>

        {/* Price + Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#64748B] font-bold">
                ₦
              </span>
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
            <label className={labelClass}>Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Select category</option>
              {CATEGORIES[portal].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className={labelClass}>Product Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInputChange}
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-[#E2E8F0] hover:border-[#94A3B8] bg-[#F8FAFC]"
              }`}
            >
              <span className="material-symbols-outlined text-[32px] text-[#94A3B8]">
                cloud_upload
              </span>
              <p className="text-sm text-[#334155] font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-[#94A3B8]">PNG, JPG up to 2MB</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC]">
              <img
                src={imagePreview}
                alt="Preview"
                className="size-[100px] rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A] truncate">
                  {imageFile?.name ?? "Uploaded image"}
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ""}
                </p>
                <button
                  type="button"
                  onClick={removeImage}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quantity + Threshold + Auto Status */}
        <div>
          <label className={`${labelClass} mb-2`}>Stock Management</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-[#64748B] mb-1 block">
                Quantity Available *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className={inputClass}
                  placeholder="0"
                />
                {/* Auto status badge */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <StatusBadge status={stockStatus} />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#64748B] mb-1 block">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min={1}
                value={lowStockThreshold}
                onChange={(e) =>
                  setLowStockThreshold(Math.max(1, parseInt(e.target.value) || 1))
                }
                className={inputClass}
                placeholder="10"
              />
            </div>
          </div>
          {/* Status indicator bar */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className={`size-2 rounded-full ${
                stockStatus === "in_stock"
                  ? "bg-[#059669]"
                  : stockStatus === "low_stock"
                    ? "bg-[#EA580C]"
                    : "bg-[#DC2626]"
              }`}
            />
            <span className="text-[12px] text-[#64748B]">
              {stockStatus === "in_stock" && (
                <>
                  <span className="font-semibold text-[#059669]">In Stock</span> — {quantity} units available
                  (threshold: {lowStockThreshold})
                </>
              )}
              {stockStatus === "low_stock" && (
                <>
                  <span className="font-semibold text-[#EA580C]">Low Stock</span> — Only {quantity} units left
                  (below threshold of {lowStockThreshold})
                </>
              )}
              {stockStatus === "out_of_stock" && (
                <span className="font-semibold text-[#DC2626]">Out of Stock — No units available</span>
              )}
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1.5">
            Status auto-updates based on quantity vs threshold. Stock reduces automatically after each sale.
          </p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#0F172A]">Active</span>
          <button
            onClick={() => setActive(!active)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
              active ? "bg-primary" : "bg-[#E2E8F0]"
            }`}
          >
            <div
              className={`size-5 bg-white rounded-full shadow transition-transform ${
                active ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[#E8ECF1] pt-4 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{isEdit ? "Save Changes" : "Create Product"}</Button>
        </div>
      </div>
    </Modal>
  );
}
