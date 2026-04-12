import { useState } from "react";
import InventoryPortal from "./InventoryPortal";
import { PORTAL_COLORS, type Portal } from "../../data/adminMockData";

const PORTALS: { key: Portal; label: string }[] = [
  { key: "solar", label: "Solar" },
  { key: "transport", label: "Transport" },
  { key: "groceries", label: "Groceries" },
  { key: "health", label: "Health" },
  { key: "events", label: "Events" },
  { key: "community", label: "Community" },
  { key: "logistics", label: "Logistics" },
];

export default function InventoryPage() {
  const [activePortal, setActivePortal] = useState<Portal>("solar");

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Portal tab bar */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60">
        <div className="flex overflow-x-auto">
          {PORTALS.map(({ key, label }) => {
            const isActive = activePortal === key;
            return (
              <button
                key={key}
                onClick={() => setActivePortal(key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer flex-shrink-0 ${
                  isActive
                    ? "text-[#0F172A]"
                    : "text-[#94A3B8] border-transparent hover:text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
                style={isActive ? { borderBottomColor: PORTAL_COLORS[key] } : undefined}
              >
                <div className="size-2 rounded-full" style={{ backgroundColor: PORTAL_COLORS[key] }} />
                {label}
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
