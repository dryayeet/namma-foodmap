"use client";

import { useEffect, useState } from "react";
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
    <aside className="absolute top-0 left-0 z-[1001] h-screen w-[440px] max-w-[90vw] bg-white/92 dark:bg-slate-950/92 backdrop-blur-xl border-r border-slate-900/10 dark:border-white/[0.09] shadow-[0_10px_48px_rgba(15,23,42,0.18)] dark:shadow-[0_10px_48px_rgba(0,0,0,0.55)] flex flex-col">
      <header className="px-5 pt-5 pb-4 border-b border-slate-900/5 dark:border-white/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_10px_2px_rgba(250,204,21,0.55)]" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            NammaNomNom
          </h1>
          <span className="text-xs text-slate-500 ml-auto">Bengaluru</span>
        </motion.div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
          Reddit-driven, sentiment-scored. Where the community actually eats.
        </p>
        {stats && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Stat label="Places" value={stats.total_restaurants} />
            <Stat label="Mentions" value={stats.total_mentions} />
            <Stat label="Trending" value={stats.trending_count} accent />
          </div>
        )}
      </header>

      <div className="px-4 py-3 space-y-2.5 border-b border-slate-900/5 dark:border-white/[0.06]">
        <div className="relative">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search cuisine, dish, or area…"
            className="w-full text-sm pl-9 pr-8 py-2.5 rounded-lg bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:bg-slate-900/[0.06] dark:focus:bg-white/[0.06] focus:border-amber-500/50 dark:focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition"
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

        <div className="flex gap-1 overflow-x-auto scrollbar-thin -mx-1 px-1 pb-0.5">
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
                    : "bg-slate-900/[0.04] dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-900/10 dark:border-white/[0.08] hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 flex-wrap pt-1">
          {HYPES.map((h) => (
            <button
              key={h}
              onClick={() => toggleHype(h)}
              className={clsx(
                "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold transition",
                filters.hype === h
                  ? HYPE_CHIP_ACTIVE[h]
                  : "bg-slate-900/[0.03] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-900/10 dark:border-white/[0.08] hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {h}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {PRICES.map((p) => (
            <button
              key={p}
              onClick={() => togglePrice(p)}
              className={clsx(
                "text-xs px-3 py-1 rounded-full border font-semibold transition",
                filters.price === p
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                  : "bg-slate-900/[0.03] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-900/10 dark:border-white/[0.08] hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {"$".repeat(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1.5">
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

      <div className="px-4 py-2.5 border-t border-slate-900/5 dark:border-white/[0.06] text-[10px] text-slate-500 flex items-center justify-between">
        <span>{restaurants.length} results</span>
        <span className="text-slate-400 dark:text-slate-600">NammaNomNom v0.1</span>
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
    <div
      className={clsx(
        "rounded-lg px-2 py-1.5 text-center border",
        accent
          ? "bg-amber-400/15 border-amber-500/30 dark:bg-amber-400/10 dark:border-amber-400/30"
          : "bg-slate-900/[0.03] dark:bg-white/[0.03] border-slate-900/10 dark:border-white/[0.06]"
      )}
    >
      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</div>
      <div className={clsx("font-bold text-sm mt-0.5", accent ? "text-amber-600 dark:text-amber-300" : "text-slate-900 dark:text-slate-100")}>
        {value}
      </div>
    </div>
  );
}
