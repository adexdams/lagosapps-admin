import { useState, useMemo } from "react";
import StatusBadge from "./shared/StatusBadge";
import ProductForm from "./ProductForm";
import { mockProducts, formatNaira, type MockProduct, type Portal, PORTAL_COLORS } from "../../data/adminMockData";

interface InventoryPortalProps {
  portal: Portal;
}

export default function InventoryPortal({ portal }: InventoryPortalProps) {
  const [editProduct, setEditProduct] = useState<MockProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const products = useMemo(() => {
    return mockProducts.filter((p) => {
      const matchesPortal = p.portal === portal;
      const matchesCat = !categoryFilter || p.category === categoryFilter;
      return matchesPortal && matchesCat;
    });
  }, [portal, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(mockProducts.filter((p) => p.portal === portal).map((p) => p.category));
    return Array.from(cats);
  }, [portal]);

  const portalColor = PORTAL_COLORS[portal];

  const stockBadge = (status: string) => {
    const map: Record<string, string> = {
      in_stock: "bg-primary/10 text-primary",
      low_stock: "bg-[#E65100]/10 text-[#E65100]",
      out_of_stock: "bg-error/10 text-error",
    };
    return map[status] || "";
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Category filter + Add button */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategoryFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            !categoryFilter ? "text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
          style={!categoryFilter ? { backgroundColor: portalColor } : undefined}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              categoryFilter === cat ? "text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
            style={categoryFilter === cat ? { backgroundColor: portalColor } : undefined}
          >
            {cat}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Product
        </button>
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <span className="material-symbols-outlined text-outline/30 text-[32px]">inventory_2</span>
          <p className="text-sm text-on-surface-variant">No products in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => { setEditProduct(product); setShowForm(true); }}
              className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {/* Image placeholder */}
              <div className="aspect-square bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-outline/20 text-[40px]">image</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-on-surface truncate">{product.name}</p>
                <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{product.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-extrabold text-on-surface">
                    {product.price === 0 ? "Free" : formatNaira(product.price)}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stockBadge(product.stockStatus)}`}>
                    {product.stockStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-on-surface-variant">{product.category}</span>
                  <StatusBadge status={product.active ? "active" : "inactive"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product form modal */}
      <ProductForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        product={editProduct}
        portal={portal}
      />
    </div>
  );
}
