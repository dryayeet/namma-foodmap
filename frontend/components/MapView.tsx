"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Restaurant } from "@/lib/types";
import { HeatmapLayer } from "./HeatmapLayer";
import type { Theme } from "@/lib/theme";

const CATEGORY_COLOR: Record<string, string> = {
  trending: "#f59e0b",
  overhyped: "#ef4444",
  underrated: "#10b981",
  neutral: "#64748b",
};

// Zoom threshold: below this, show heatmap; at/above, show pins.
const PIN_ZOOM = 14;

// Per-restaurant visual intensity in [0.4, 1.0]. Drives pin fill opacity,
// size, and glow so a Rameshwaram Cafe with 72 mentions and +0.65 sentiment
// reads louder than a single-mention neutral spot.
function pinIntensity(r: Restaurant): number {
  const m = Math.min(1, (r.mention_count ?? 0) / 50);
  const s = r.avg_sentiment ?? 0;
  switch (r.hype_category) {
    case "trending": {
      const sn = Math.max(0, Math.min(1, (s - 0.2) / 0.6));
      return 0.55 + 0.3 * sn + 0.15 * m;
    }
    case "overhyped": {
      const neg = Math.min(1, Math.abs(Math.min(0, s)) / 0.5);
      return 0.5 + 0.3 * neg + 0.2 * m;
    }
    case "underrated": {
      const sn = Math.max(0, Math.min(1, (s - 0.3) / 0.5));
      return 0.55 + 0.45 * sn;
    }
    default:
      return 0.4 + 0.15 * m;
  }
}

function pinIcon(r: Restaurant, theme: Theme) {
  const color = CATEGORY_COLOR[r.hype_category] ?? CATEGORY_COLOR.neutral;
  const intensity = pinIntensity(r);
  const size = Math.round(14 + intensity * 10); // 14..24 px
  const pct = Math.round(intensity * 100);
  const mixBase = theme === "dark" ? "#0b1220" : "#f8fafc";
  const fill = `color-mix(in srgb, ${color} ${pct}%, ${mixBase})`;
  const glowAlpha = Math.round(intensity * 90)
    .toString(16)
    .padStart(2, "0");
  const glowRadius = Math.round(6 + intensity * 16);
  const ringShadow =
    theme === "dark"
      ? "0 0 0 1px rgba(0,0,0,0.6),0 3px 10px rgba(0,0,0,0.55)"
      : "0 0 0 1px rgba(15,23,42,0.15),0 3px 10px rgba(15,23,42,0.18)";

  const style = [
    `width:${size}px`,
    `height:${size}px`,
    `background:${fill}`,
    `box-shadow:0 0 ${glowRadius}px ${color}${glowAlpha},${ringShadow}`,
  ].join(";");

  return L.divIcon({
    className: "",
    html: `<div class="hype-pin" style="${style}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
}

function FlyTo({ target }: { target: Restaurant | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), {
        duration: 0.9,
      });
    }
  }, [target, map]);
  return null;
}

function ZoomAwareLayers({
  restaurants,
  showHeatmap,
  onMarkerClick,
  theme,
}: {
  restaurants: Restaurant[];
  showHeatmap: boolean;
  onMarkerClick?: (r: Restaurant) => void;
  theme: Theme;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => {
      map.off("zoomend", onZoom);
    };
  }, [map]);

  const pinsVisible = zoom >= PIN_ZOOM;
  const heatVisible = showHeatmap && !pinsVisible;

  return (
    <>
      <HeatmapLayer restaurants={restaurants} visible={heatVisible} />
      {pinsVisible &&
        restaurants.map((r) => (
          <Marker
            key={`${r.id}-${theme}`}
            position={[r.lat, r.lng]}
            icon={pinIcon(r, theme)}
            eventHandlers={{ click: () => onMarkerClick?.(r) }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 mt-0.5">
                  {r.cuisine ?? "—"} · {r.area ?? ""} · {"$".repeat(r.price_tier)}
                </div>
                <div className="text-xs">
                  <span
                    className="font-semibold capitalize"
                    style={{ color: CATEGORY_COLOR[r.hype_category] }}
                  >
                    {r.hype_category}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {" · "}hype {r.hype_score.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {r.mention_count} mentions · sentiment {r.avg_sentiment.toFixed(2)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  );
}

export default function MapView({
  restaurants,
  focused,
  onMarkerClick,
  showHeatmap,
  theme,
}: {
  restaurants: Restaurant[];
  focused: Restaurant | null;
  onMarkerClick?: (r: Restaurant) => void;
  showHeatmap: boolean;
  theme: Theme;
}) {
  const tileUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={12}
      scrollWheelZoom
      className="h-screen w-screen"
    >
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
        subdomains="abcd"
        maxZoom={20}
      />
      <ZoomAwareLayers
        restaurants={restaurants}
        showHeatmap={showHeatmap}
        onMarkerClick={onMarkerClick}
        theme={theme}
      />
      <FlyTo target={focused} />
    </MapContainer>
  );
}
