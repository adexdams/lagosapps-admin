import { useState, useEffect, useCallback, useMemo } from "react";
import ProductForm, { type ProductFormRecord } from "./ProductForm";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { getProducts } from "../../lib/api";
import { formatNaira, PORTAL_COLORS, type Portal } from "../../data/adminMockData";

interface InventoryPortalProps {
  portal: Portal;
}

// Shape returned by getProducts() — includes joined category
interface DbProduct {
  id: string;
  portal_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  low_stock_threshold: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  is_active: boolean;
  image_url: string | null;
  product_categories: { name: string; slug: string } | null;
}

export default function InventoryPortal({ portal }: InventoryPortalProps) {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getProducts(portal);
    setLoading(false);
    if (error) {
      toast.error(`Failed to load products: ${error.message}`);
      return;
    }
    setProducts((data as DbProduct[]) ?? []);
  }, [portal, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const cats = new Set(
      products
        .map((p) => p.product_categories?.name)
        .filter((c): c is string => !!c)
    );
    return ["all", ...Array.from(cats), ...(products.some((p) => !p.category_id) ? ["Uncategorized"] : [])];
  }, [products]);

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return products;
    if (selectedCategory === "Uncategorized") return products.filter((p) => !p.category_id);
    return products.filter((p) => p.product_categories?.name === selectedCategory);
  }, [products, selectedCategory]);

  const portalColor = PORTAL_COLORS[portal];

  const handleOpenForm = (product?: DbProduct) => {
    setEditingProduct(product ?? null);
    setShowForm(true);
  };

  const stockBadge = (product: DbProduct) => {
    if (product.stock === 0) return <StatusBadge status="out_of_stock" />;
    if (product.stock <= product.low_stock_threshold)
      return (
        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap bg-[#FFF7ED] text-[#EA580C]">
          Low Stock ({product.stock})
        </span>
      );
    return (
      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap bg-[#ECFDF5] text-[#059669]">
        In Stock ({product.stock})
      </span>
    );
  };

  // Map DB product to the shape ProductForm expects
  const toFormRecord = (p: DbProduct): ProductFormRecord => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    category_id: p.category_id,
    stock: p.stock,
    low_stock_threshold: p.low_stock_threshold,
    is_active: p.is_active,
    image_url: p.image_url,
  });

  return (
    <div className="space-y-4">
      {/* Filter + Add button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile: dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="sm:hidden border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] bg-white outline-none focus:border-primary cursor-pointer flex-1"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
          ))}
        </select>

        {/* Desktop: pill buttons */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all flex-shrink-0 ${
                selectedCategory === cat ? "text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
              }`}
              style={selectedCategory === cat ? { backgroundColor: portalColor } : undefined}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <div className="flex-1 hidden sm:block" />
        <button
          onClick={() => handleOpenForm()}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-[#E8ECF1]/60 overflow-hidden animate-pulse">
              <div className="h-36 bg-[#F1F5F9]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[#F1F5F9] rounded w-3/4" />
                <div className="h-3 bg-[#F1F5F9] rounded w-full" />
                <div className="h-5 bg-[#F1F5F9] rounded w-1/2 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#94A3B8]">
          <p className="text-sm">No products in this category</p>
          <button
            onClick={() => handleOpenForm()}
            className="mt-3 text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            Add the first one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              onClick={() => handleOpenForm(product)}
              className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {/* Image */}
              <div className="h-36 bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[40px] text-[#94A3B8]">image</span>
                )}
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-[#0F172A] truncate">{product.name}</h4>
                <p className="text-[12px] text-[#64748B] mt-0.5 line-clamp-2">{product.description}</p>
                <p className="text-base font-extrabold text-[#0F172A] mt-2">{formatNaira(product.price)}</p>
                <div className="flex items-center justify-between mt-3">
                  {stockBadge(product)}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${product.is_active ? "text-[#059669]" : "text-[#DC2626]"}`}>
                    <span className={`size-1.5 rounded-full ${product.is_active ? "bg-[#059669]" : "bg-[#DC2626]"}`} />
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <ProductForm
          portal={portal}
          product={editingProduct ? toFormRecord(editingProduct) : null}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSaved={fetchProducts}
        />
      )}
    </div>
  );
}
