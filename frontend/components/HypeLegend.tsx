"use client";

import clsx from "clsx";
import type { Theme } from "@/lib/theme";

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
  theme,
  onToggleTheme,
}: {
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-[452px] z-[1000] w-64 rounded-xl bg-white/92 dark:bg-slate-950/92 backdrop-blur-xl border border-slate-900/10 dark:border-white/[0.09] shadow-[0_10px_48px_rgba(15,23,42,0.18)] dark:shadow-[0_10px_48px_rgba(0,0,0,0.55)] p-3.5 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          Hype Pins
        </div>
        <button
          onClick={onToggleTheme}
          className="w-6 h-6 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-white/10 transition"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      <div className="space-y-1.5">
        {PIN_ITEMS.map((i) => (
          <div key={i.key} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/90 dark:ring-white/90"
              style={{ background: i.color }}
            />
            <span className="font-medium text-slate-800 dark:text-slate-200">{i.label}</span>
            <span className="text-slate-500 truncate">· {i.hint}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-900/5 dark:border-white/[0.06] pt-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Hype Density
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              Thermal view
            </div>
          </div>
          <button
            onClick={onToggleHeatmap}
            className={clsx(
              "text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border transition",
              showHeatmap
                ? "bg-amber-500 text-white border-amber-500 dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                : "bg-slate-900/[0.04] dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-900/10 dark:border-white/[0.1] hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08]"
            )}
          >
            {showHeatmap ? "On" : "Off"}
          </button>
        </div>
        <div
          className="h-2.5 w-full rounded-full ring-1 ring-slate-900/10 dark:ring-white/10"
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

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
