import { useState } from "react";
import InventoryPortal from "./InventoryPortal";
import { PORTAL_COLORS, type Portal } from "../../data/adminMockData";

const PORTALS: Portal[] = ["solar", "transport", "groceries", "health", "events", "community", "logistics"];

const SHORT_LABELS: Record<Portal, string> = {
  solar: "Solar",
  transport: "Transport",
  groceries: "Groceries",
  health: "Health",
  events: "Events",
  community: "Community",
  logistics: "Logistics",
};

export default function InventoryPage() {
  const [activePortal, setActivePortal] = useState<Portal>("solar");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Inventory</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Manage products and services across all portals</p>
      </div>

      {/* Portal tab bar */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="flex overflow-x-auto">
          {PORTALS.map((portal) => {
            const isActive = portal === activePortal;
            const color = PORTAL_COLORS[portal];
            return (
              <button
                key={portal}
                onClick={() => setActivePortal(portal)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  isActive
                    ? "text-[#0F172A]"
                    : "text-[#64748B] hover:text-[#334155] border-transparent"
                }`}
                style={isActive ? { borderBottomColor: color } : undefined}
              >
                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {SHORT_LABELS[portal]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Portal content */}
      <InventoryPortal portal={activePortal} />
    </div>
  );
}
