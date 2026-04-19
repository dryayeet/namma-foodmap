export type HypeCategory = "trending" | "overhyped" | "underrated" | "neutral";

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  cuisine: string | null;
  price_tier: number;
  area: string | null;
  lat: number;
  lng: number;
  tags: string | null;
  mention_count: number;
  avg_sentiment: number;
  hype_score: number;
  hype_category: HypeCategory;
  last_updated: string;
}

export interface Mention {
  id: number;
  subreddit: string;
  permalink: string | null;
  text_snippet: string;
  sentiment: number;
  created_utc: string;
}

export interface RestaurantDetail extends Restaurant {
  recent_mentions: Mention[];
}

export interface Stats {
  total_restaurants: number;
  total_mentions: number;
  last_scrape: string | null;
  trending_count: number;
  overhyped_count: number;
  underrated_count: number;
}

export interface Filters {
  q?: string;
  cuisine?: string;
  price?: number;
  hype?: HypeCategory;
  min_mentions?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
