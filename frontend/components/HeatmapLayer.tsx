"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.heat";
import { useMap } from "react-leaflet";
import type { Restaurant } from "@/lib/types";

type HeatPoint = [number, number, number];

// hype_score (~[-0.4, 1.0]) -> intensity [0, 1]. The boost pushes trending
// clusters into the white-hot core of the gradient while negative/neutral
// spots fade out entirely.
function intensity(r: Restaurant): number {
  const score = r.hype_score ?? 0;
  return Math.max(0, Math.min(1, (score + 0.1) * 1.35));
}

// Snap-Map-inspired thermal gradient: deep violet at the edges flaring
// through magenta + crimson to orange, yellow, and a pale white-hot core.
// Reads as glowing "hot zones" against a dark map.
export const HEAT_GRADIENT: Record<number, string> = {
  0.1: "#312e81", // indigo-900 (faint cool halo)
  0.25: "#7c3aed", // violet-600
  0.4: "#db2777", // pink-600
  0.55: "#dc2626", // red-600
  0.7: "#f97316", // orange-500
  0.85: "#facc15", // yellow-400
  1.0: "#fef9c3", // light cream (white-hot core)
};

export function HeatmapLayer({
  restaurants,
  visible,
}: {
  restaurants: Restaurant[];
  visible: boolean;
}) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!visible || restaurants.length === 0) return;

    const points: HeatPoint[] = restaurants
      .map((r) => [r.lat, r.lng, intensity(r)] as HeatPoint)
      .filter((p) => p[2] > 0.05);

    const layer = (L as unknown as {
      heatLayer: (pts: HeatPoint[], opts: Record<string, unknown>) => L.Layer;
    }).heatLayer(points, {
      radius: 52,
      blur: 28,
      maxZoom: 17,
      minOpacity: 0.55,
      gradient: HEAT_GRADIENT,
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [restaurants, visible, map]);

  return null;
}
