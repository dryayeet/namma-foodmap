"use client";

import clsx from "clsx";

const PIN_ITEMS = [
  { key: "trending",   label: "Trending",   color: "#f59e0b", hint: "Popular & loved" },
  { key: "underrated", label: "Underrated", color: "#10b981", hint: "Niche gems" },
  { key: "overhyped",  label: "Overhyped",  color: "#ef4444", hint: "Popular, mixed" },
  { key: "neutral",    label: "Neutral",    color: "#64748b", hint: "Background" },
];

// Matches HeatmapLayer.HEAT_GRADIENT exactly.
const HEAT_BAR =
  "linear-gradient(90deg,#312e81 0%,#7c3aed 22%,#db2777 40%,#dc2626 58%,#f97316 74%,#facc15 88%,#fef9c3 100%)";

export function HypeLegend({
  showHeatmap,
  onToggleHeatmap,
}: {
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-[452px] z-[1000] w-64 rounded-xl bg-slate-950/92 backdrop-blur-xl border border-white/[0.09] shadow-[0_10px_48px_rgba(0,0,0,0.55)] p-3.5 text-xs space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
          Hype Pins
        </div>
        <div className="space-y-1.5">
          {PIN_ITEMS.map((i) => (
            <div key={i.key} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/90"
                style={{ background: i.color }}
              />
              <span className="font-medium text-slate-200">{i.label}</span>
              <span className="text-slate-500 truncate">· {i.hint}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Hype Density
            </div>
            <div className="text-[11px] text-slate-400 leading-tight">
              Thermal view
            </div>
          </div>
          <button
            onClick={onToggleHeatmap}
            className={clsx(
              "text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border transition",
              showHeatmap
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                : "bg-white/[0.04] text-slate-300 border-white/[0.1] hover:bg-white/[0.08]"
            )}
          >
            {showHeatmap ? "On" : "Off"}
          </button>
        </div>
        <div
          className="h-2.5 w-full rounded-full ring-1 ring-white/10"
          style={{ background: HEAT_BAR }}
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
          <span>Cool</span>
          <span>Buzzing</span>
          <span>White-hot</span>
        </div>
      </div>
    </div>
  );
}
