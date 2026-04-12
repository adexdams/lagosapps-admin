import { useState, useMemo } from "react";
import ProductForm from "./ProductForm";
import StatusBadge from "./shared/StatusBadge";
import { mockProducts, formatNaira, PORTAL_COLORS, type Portal, type MockProduct } from "../../data/adminMockData";

interface InventoryPortalProps {
  portal: Portal;
}

export default function InventoryPortal({ portal }: InventoryPortalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<MockProduct | null>(null);
  const [showForm, setShowForm] = useState(false);

  const portalProducts = useMemo(
    () => mockProducts.filter((p) => p.portal === portal),
    [portal],
  );

  const categories = useMemo(() => {
    const cats = new Set(portalProducts.map((p) => p.category));
    return ["all", ...Array.from(cats)];
  }, [portalProducts]);

  const filtered = selectedCategory === "all"
    ? portalProducts
    : portalProducts.filter((p) => p.category === selectedCategory);

  const portalColor = PORTAL_COLORS[portal];

  const handleOpenForm = (product?: MockProduct) => {
    setEditingProduct(product ?? null);
    setShowForm(true);
  };

  const stockBadge = (product: MockProduct) => {
    if (product.stock === 0) return <StatusBadge status="out_of_stock" />;
    if (product.stock <= 10) return <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap bg-[#FFF7ED] text-[#EA580C]">Low Stock ({product.stock})</span>;
    return <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap bg-[#ECFDF5] text-[#059669]">In Stock ({product.stock})</span>;
  };

  return (
    <div className="space-y-4">
      {/* Filter pills + Add button */}
      <div className="flex items-center gap-3 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all ${
              selectedCategory === cat
                ? "text-white"
                : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
            }`}
            style={selectedCategory === cat ? { backgroundColor: portalColor } : undefined}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => handleOpenForm()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Product
        </button>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#94A3B8]">No products in this category</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              onClick={() => handleOpenForm(product)}
              className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {/* Image placeholder */}
              <div className="h-36 bg-[#F1F5F9] flex items-center justify-center">
                <span className="material-symbols-outlined text-[40px] text-[#94A3B8]">image</span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-[#0F172A] truncate">{product.name}</h4>
                <p className="text-[12px] text-[#64748B] mt-0.5 line-clamp-2">{product.description}</p>
                <p className="text-base font-extrabold text-[#0F172A] mt-2">{formatNaira(product.price)}</p>
                <div className="flex items-center justify-between mt-3">
                  {stockBadge(product)}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${product.status === "active" ? "text-[#059669]" : "text-[#DC2626]"}`}>
                    <span className={`size-1.5 rounded-full ${product.status === "active" ? "bg-[#059669]" : "bg-[#DC2626]"}`} />
                    {product.status === "active" ? "Active" : "Inactive"}
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
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
