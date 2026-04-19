"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import type { Filters, HypeCategory, Restaurant, Stats } from "@/lib/types";
import { RestaurantCard } from "./RestaurantCard";

const HYPES: HypeCategory[] = ["trending", "overhyped", "underrated", "neutral"];
const PRICES = [1, 2, 3, 4];
const DISH_SUGGESTIONS = [
  "biryani",
  "pizza",
  "coffee",
  "dosa",
  "burger",
  "kebab",
  "ice cream",
  "pasta",
  "beer",
];

const HYPE_CHIP_ACTIVE: Record<HypeCategory, string> = {
  trending:   "bg-amber-500 text-white border-amber-500 dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400",
  overhyped:  "bg-red-500 text-white border-red-500 dark:bg-red-400 dark:text-slate-950 dark:border-red-400",
  underrated: "bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:border-emerald-400",
  neutral:    "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white",
};

export function Sidebar({
  restaurants,
  stats,
  filters,
  setFilters,
  activeId,
  onSelect,
  loading,
}: {
  restaurants: Restaurant[];
  stats?: Stats;
  filters: Filters;
  setFilters: (f: Filters) => void;
  activeId: number | null;
  onSelect: (r: Restaurant) => void;
  loading: boolean;
}) {
  const [searchDraft, setSearchDraft] = useState(filters.q ?? "");
  const cardStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.q ?? "") !== searchDraft) {
        setFilters({ ...filters, q: searchDraft || undefined });
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const toggleHype = (h: HypeCategory) =>
    setFilters({ ...filters, hype: filters.hype === h ? undefined : h });
  const togglePrice = (p: number) =>
    setFilters({ ...filters, price: filters.price === p ? undefined : p });
  const applySuggestion = (term: string) => {
    setSearchDraft(term);
    setFilters({ ...filters, q: term });
  };

  return (
    <aside className="absolute bottom-0 left-0 right-0 z-[1001] bg-white/92 dark:bg-slate-950/92 backdrop-blur-xl border-t border-slate-900/10 dark:border-white/[0.09] shadow-[0_-10px_48px_rgba(15,23,42,0.18)] dark:shadow-[0_-10px_48px_rgba(0,0,0,0.55)]">
      {/* Row 1: stats + search + filters */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 flex-wrap border-b border-slate-900/5 dark:border-white/[0.06]">
        {stats && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Stat label="Places" value={stats.total_restaurants} />
            <Stat label="Mentions" value={stats.total_mentions} />
            <Stat label="Trending" value={stats.trending_count} accent />
          </div>
        )}

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search cuisine, dish, or area…"
            className="w-full text-sm pl-9 pr-8 py-2 rounded-full bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:bg-slate-900/[0.06] dark:focus:bg-white/[0.06] focus:border-amber-500/50 dark:focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          {searchDraft && (
            <button
              onClick={() => {
                setSearchDraft("");
                setFilters({ ...filters, q: undefined });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-900/10 dark:hover:bg-white/10"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-thin shrink">
          {DISH_SUGGESTIONS.map((d) => {
            const isActive = (filters.q ?? "").toLowerCase() === d;
            return (
              <button
                key={d}
                onClick={() => applySuggestion(d)}
                className={clsx(
                  "text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full border transition",
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                    : "bg-slate-900/[0.04] dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-900/10 dark:border-white/[0.08] hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08]"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 ml-auto">
          {HYPES.map((h) => (
            <button
              key={h}
              onClick={() => toggleHype(h)}
              className={clsx(
                "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold transition",
                filters.hype === h
                  ? HYPE_CHIP_ACTIVE[h]
                  : "bg-slate-900/[0.03] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-900/10 dark:border-white/[0.08] hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08]"
              )}
            >
              {h}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {PRICES.map((p) => (
            <button
              key={p}
              onClick={() => togglePrice(p)}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-full border font-semibold transition",
                filters.price === p
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                  : "bg-slate-900/[0.03] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-900/10 dark:border-white/[0.08] hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08]"
              )}
            >
              {"$".repeat(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: horizontally scrolling cards */}
      <div className="relative">
        <div
          ref={cardStripRef}
          className="flex gap-2 overflow-x-auto scrollbar-thin px-4 py-3"
        >
          {loading && (
            <div className="text-xs text-slate-500 px-1 py-2">Loading…</div>
          )}
          {!loading && restaurants.length === 0 && (
            <div className="text-xs text-slate-500 px-1 py-2">No matches.</div>
          )}
          {restaurants.map((r) => (
            <RestaurantCard
              key={r.id}
              r={r}
              active={activeId === r.id}
              onClick={() => onSelect(r)}
            />
          ))}
        </div>
        <div className="absolute bottom-0 right-4 text-[10px] text-slate-400 dark:text-slate-600 pb-1">
          {restaurants.length} results · NammaNomNom v0.1
        </div>
      </div>
    </aside>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-lg px-2.5 py-1.5 text-center border min-w-[64px]",
        accent
          ? "bg-amber-400/15 border-amber-500/30 dark:bg-amber-400/10 dark:border-amber-400/30"
          : "bg-slate-900/[0.03] dark:bg-white/[0.03] border-slate-900/10 dark:border-white/[0.06]"
      )}
    >
      <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">{label}</div>
      <div className={clsx("font-bold text-sm leading-tight", accent ? "text-amber-600 dark:text-amber-300" : "text-slate-900 dark:text-slate-100")}>
        {value}
      </div>
    </motion.div>
  );
}
