"use client";

import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

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
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute right-4 top-24 z-[1000] flex flex-col items-end gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-900/10 dark:border-white/[0.09] shadow-[0_8px_24px_rgba(15,23,42,0.14)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-center text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        aria-label="Legend"
        title="Legend"
      >
        <InfoIcon />
      </button>

      <button
        onClick={onToggleHeatmap}
        className={clsx(
          "w-10 h-10 rounded-full border flex items-center justify-center transition shadow-[0_8px_24px_rgba(15,23,42,0.14)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
          showHeatmap
            ? "bg-amber-500 text-white border-amber-500 dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400"
            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-100 border-slate-900/10 dark:border-white/[0.09] hover:bg-slate-50 dark:hover:bg-slate-800"
        )}
        aria-label={showHeatmap ? "Hide heatmap" : "Show heatmap"}
        title={showHeatmap ? "Heatmap on" : "Heatmap off"}
      >
        <FlameIcon />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.16 }}
            className="w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-900/10 dark:border-white/[0.09] shadow-[0_10px_36px_rgba(15,23,42,0.18)] dark:shadow-[0_10px_36px_rgba(0,0,0,0.55)] p-3.5 text-xs space-y-3"
          >
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                Hype Pins
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
            </div>

            <div className="border-t border-slate-900/5 dark:border-white/[0.06] pt-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                Hype Density
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
