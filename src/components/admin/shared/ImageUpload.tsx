import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../hooks/useToast";

interface Props {
  /** Supabase Storage bucket id, e.g. "products", "avatars", "email-assets" */
  bucket: string;
  /** Callback fired once a public URL is available (after successful upload) */
  onUploaded: (url: string) => void;
  /** Current image URL (shows as preview). Pass null to clear. */
  value: string | null;
  /** Callback when user removes the image (clears the preview) */
  onRemove?: () => void;
  /** Max file size in MB. Default 5. */
  maxSizeMb?: number;
  /** Optional path prefix inside the bucket (e.g. "banners" or a user id) */
  pathPrefix?: string;
  /** Height of the upload area / preview. Default "h-32". */
  heightClass?: string;
  /** Label text inside the drop zone */
  label?: string;
  /** Additional className for the container */
  className?: string;
  /** Disable the input (e.g. while parent is saving) */
  disabled?: boolean;
}

/**
 * Reusable image uploader: drag-and-drop or click to upload, preview with
 * remove button, uploads to Supabase Storage, returns public URL.
 *
 * Used by ProductForm, EmailTemplatesPage (global logo + per-template banner),
 * Settings (admin avatar), and potentially anywhere else images are needed.
 */
export default function ImageUpload({
  bucket,
  onUploaded,
  value,
  onRemove,
  maxSizeMb = 5,
  pathPrefix = "",
  heightClass = "h-32",
  label = "Drag and drop or click to upload",
  className = "",
  disabled = false,
}: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Image must be under ${maxSizeMb}MB`);
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = pathPrefix ? `${pathPrefix}/${filename}` : filename;

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
    else onUploaded("");
  };

  if (value) {
    return (
      <div className={className}>
        <div className={`relative bg-[#F8FAFC] rounded-xl overflow-hidden border border-[#E8ECF1] ${heightClass}`}>
          <img src={value} alt="Upload" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="absolute top-2 right-2 size-7 bg-white rounded-lg shadow flex items-center justify-center cursor-pointer hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
            title="Remove image"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          className="mt-2 px-3 py-1.5 border border-[#E2E8F0] text-[#334155] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#F1F5F9] transition-all disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Replace image"}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={disabled ? undefined : handleDrop}
        onClick={() => !disabled && !uploading && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl ${heightClass} flex flex-col items-center justify-center text-center transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${isDragging ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:border-[#94A3B8]"}`}
      >
        {uploading ? (
          <>
            <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-[#64748B] mt-2">Uploading…</p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[28px] text-[#94A3B8]">add_photo_alternate</span>
            <p className="text-sm text-[#64748B] mt-1">{label}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">PNG, JPG, WEBP up to {maxSizeMb}MB</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
