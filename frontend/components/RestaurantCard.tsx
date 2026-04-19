"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { Restaurant } from "@/lib/types";

const CATEGORY_CHIP: Record<string, string> = {
  trending:   "bg-amber-500/15 text-amber-300 border-amber-400/30",
  overhyped:  "bg-red-500/15 text-red-300 border-red-400/30",
  underrated: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  neutral:    "bg-white/5 text-slate-400 border-white/10",
};

export function RestaurantCard({
  r,
  onClick,
  active,
}: {
  r: Restaurant;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={onClick}
      className={clsx(
        "w-full text-left rounded-xl border p-3 transition-all",
        active
          ? "bg-white/10 border-amber-400/40 ring-1 ring-amber-400/30"
          : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-100 truncate">{r.name}</div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {r.cuisine ?? "—"} · {r.area ?? "Bengaluru"} · {"$".repeat(r.price_tier)}
          </div>
        </div>
        <span
          className={clsx(
            "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-semibold shrink-0",
            CATEGORY_CHIP[r.hype_category] ?? CATEGORY_CHIP.neutral
          )}
        >
          {r.hype_category}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
        <span>🔥 {r.mention_count}</span>
        <span className="text-slate-500">· sentiment {r.avg_sentiment.toFixed(2)}</span>
        <span className="ml-auto font-semibold text-slate-200">
          {r.hype_score.toFixed(2)}
        </span>
      </div>
    </motion.button>
  );
}
