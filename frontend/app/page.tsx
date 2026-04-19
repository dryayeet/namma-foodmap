"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import type { Filters, Restaurant, Stats } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { HypeLegend } from "@/components/HypeLegend";
import { ChatPane } from "@/components/ChatPane";
import { useTheme } from "@/lib/theme";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center text-slate-500">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const [filters, setFilters] = useState<Filters>({});
  const [focused, setFocused] = useState<Restaurant | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const { theme, toggle: toggleTheme } = useTheme();

  const listUrl = api.restaurantsUrl(filters);
  const { data: restaurants = [], isLoading } = useSWR<Restaurant[]>(listUrl, fetcher, {
    keepPreviousData: true,
  });
  const { data: stats } = useSWR<Stats>(api.statsUrl(), fetcher);

  const sortedRestaurants = useMemo(
    () => [...restaurants].sort((a, b) => b.hype_score - a.hype_score),
    [restaurants]
  );

  return (
    <main className="relative">
      <MapView
        restaurants={sortedRestaurants}
        focused={focused}
        onMarkerClick={(r) => setFocused(r)}
        showHeatmap={showHeatmap}
        theme={theme}
      />
      <Sidebar
        restaurants={sortedRestaurants}
        stats={stats}
        filters={filters}
        setFilters={setFilters}
        activeId={focused?.id ?? null}
        onSelect={(r) => setFocused(r)}
        loading={isLoading}
      />
      <ChatPane />
      <HypeLegend
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap((v) => !v)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </main>
  );
}
