import type { Restaurant, RestaurantDetail, Stats, Filters, ChatMessage } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function qs(filters: Filters): string {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.cuisine) p.set("cuisine", filters.cuisine);
  if (filters.price) p.set("price", String(filters.price));
  if (filters.hype) p.set("hype", filters.hype);
  if (filters.min_mentions != null) p.set("min_mentions", String(filters.min_mentions));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  });

export const api = {
  restaurants: (f: Filters = {}): Promise<Restaurant[]> =>
    fetcher(`${BASE}/api/restaurants${qs(f)}`),
  restaurant: (id: number): Promise<RestaurantDetail> =>
    fetcher(`${BASE}/api/restaurants/${id}`),
  stats: (): Promise<Stats> => fetcher(`${BASE}/api/stats`),
  restaurantsUrl: (f: Filters = {}) => `${BASE}/api/restaurants${qs(f)}`,
  statsUrl: () => `${BASE}/api/stats`,
  ask: async (messages: ChatMessage[]): Promise<{ content: string }> => {
    const r = await fetch(`${BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!r.ok) {
      let detail = `API ${r.status}`;
      try {
        const body = await r.json();
        if (body.detail) detail = body.detail;
      } catch {}
      throw new Error(detail);
    }
    return r.json();
  },
};
