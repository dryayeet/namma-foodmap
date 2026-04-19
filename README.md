# NammaNomNom

A community-driven food discovery app for Bengaluru. It pulls chatter from `r/bangalore` and `r/bengaluru`, picks out restaurant mentions with a lightweight NLP pipeline, scores hype from mention volume plus VADER sentiment, and plots everything on a dark interactive map with a thermal heatmap and an LLM chat pane that can answer real questions like "I'm going from Yelahanka to Indiranagar, what can I eat on the way?"

```
foodmap/
├── backend/      FastAPI + SQLAlchemy (SQLite)
├── frontend/     Next.js 14 App Router, react-leaflet, Tailwind
├── scripts/      refresh_data.py (PRAW + spaCy + VADER pipeline)
├── data/         nammanomnom.db (created on first boot)
├── .env.example  template, copy to .env and fill in
└── .gitignore
```

## What's in the box

- **Dark and light base tiles** via CartoDB `dark_all` / `light_all`, toggleable from the legend. Dark keeps labels muted so heat colors pop; light makes the map feel like a proper daytime guide.
- **Snap-Map style thermal heatmap** when you're zoomed out. Intensity is driven by hype score, so a street full of trending spots glows white-hot while a solo overhyped place barely tints.
- **Zoom-aware layers**: below zoom 14 you see only the heatmap, at 14 and above the heatmap disappears and you get per-pin dots. Each pin's size, fill, and glow scale with that restaurant's hype so strong spots visually dominate.
- **Airbnb/Notion-inspired dark UI**: glass sidebar on the left with filters and a live card list, chat pane on the right, compact legend slotted between them.
- **Free-text search** across cuisine, dish tags, area names, and Reddit mention snippets. Type "biryani" and you'll surface anything tagged with it or mentioned in a seeded Reddit quote.
- **LLM chat pane** powered by Claude Haiku 4.5 via OpenRouter. The current restaurant dataset is injected into the system prompt each request, so answers are grounded in real data and can reason about Bengaluru geography for route queries.
- **Manual Reddit refresh** via a standalone script or an admin-gated endpoint. Ships with 27 seeded spots so the app works with zero credentials on day one.

## Architecture

```
refresh_data.py  ──►  SQLite  ──►  FastAPI  ──►  Next.js (Leaflet map + chat)
  (PRAW + NLP)                     /api/*
                                     │
                                     └──► OpenRouter (Claude Haiku 4.5)
```

### Hype scoring

Spec formula: `HypeScore = MentionCount * 0.6 + VaderCompound * 0.4`. In the code `MentionCount` is normalized (capped at 50 then divided by 50) so a raw integer count can't drown the sentiment signal:

```
norm = min(mention_count, 50) / 50
hype_score = 0.6 * norm + 0.4 * avg_sentiment
```

Categories (see `backend/app/services/hype.py`):

| Category   | Rule                                               |
| ---------- | -------------------------------------------------- |
| Trending   | `mention_count ≥ 10` and `avg_sentiment ≥ 0.3`     |
| Overhyped  | `mention_count ≥ 10` and `avg_sentiment < 0`       |
| Underrated | `mention_count < 10` and `avg_sentiment ≥ 0.5`     |
| Neutral    | everything else                                    |

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- Around 500 MB disk for the spaCy model plus `node_modules`

## Configuration (`.env`)

Copy the provided template and fill in what you actually need:

```bash
cp .env.example .env
```

The full set of keys (all present in `.env.example`):

```
# Reddit API (only required for a live scrape). "script" type app at
# https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=nammanomnom/0.1 by u/yourname

# Bearer token for POST /api/refresh. Pick any random string.
ADMIN_TOKEN=change-me

# SQLite file, created on first boot.
DATABASE_URL=sqlite:///./data/nammanomnom.db

# CORS origin for the Next.js dev server.
FRONTEND_ORIGIN=http://localhost:3000

# Which backend the frontend calls.
NEXT_PUBLIC_API_BASE=http://localhost:8000

# OpenRouter key for the "Ask NammaNomNom" chat pane.
# Get one at https://openrouter.ai/keys (free tier is enough for testing).
OPENROUTER_API_KEY=
LLM_MODEL=anthropic/claude-haiku-4.5
```

Notes:

- **`ADMIN_TOKEN`**: set to any string, it only guards the refresh endpoint.
- **DB path**: the SQLite file lives at `data/nammanomnom.db` by default. To override, point `DATABASE_URL` at a different path (e.g. `sqlite:///./data/your-file.db`). Relative paths resolve against the project root, so you can run `uvicorn` from any directory without breaking the connection.
- **Minimum setup**: if you just want to see the app run on seed data, you only need `ADMIN_TOKEN`, `FRONTEND_ORIGIN`, and `NEXT_PUBLIC_API_BASE`. Reddit and OpenRouter can stay blank, the scraper and chat pane will just sit disabled.

## Run it

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

First boot seeds 27 curated Bengaluru restaurants (Meghana Foods, Vidyarthi Bhavan, Toit, Rameshwaram Cafe, etc.) along with a handful of mock Reddit-style quotes per restaurant, so the UI is functional without any scraping.

Quick checks:

- API docs: <http://localhost:8000/docs>
- Sample data: <http://localhost:8000/api/restaurants>

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>. You'll see a dark map of Bengaluru with a thermal heatmap overlay, filter sidebar on the left, and the chat pane on the right.

## Using the app

- **Zoom out**: only the heatmap shows. Indiranagar and Koramangala read as deep red/orange hot zones, while outer areas like Marathahalli barely tint.
- **Zoom in to zoom level 14 or higher**: heatmap disappears, color-coded dots appear. Dot size, fill opacity, and outer glow all scale with the spot's hype score, so a heavyweight like Rameshwaram Cafe dominates while a dim neutral spot reads as a small slate dot.
- **Search**: type "biryani", "coffee", "Indiranagar" or anything else into the left pane search. Matches run across name, cuisine, area, dish tags, and the mention snippets themselves.
- **Filters**: hype category chips (trending / overhyped / underrated / neutral), price tier, and the suggestion chips below the search bar.
- **Chat (right pane)**: ask route-style questions, or anything like "best underrated cafe in Koramangala". Powered by Claude Haiku 4.5 over OpenRouter, with the full restaurant dataset injected into the system prompt on every request.
- **Heatmap on/off toggle** and a **light/dark theme toggle** both live in the legend card between the two panes. Theme choice persists via `localStorage`.
- **Collapse the chat pane**: the `›` button in its header tucks it into a thin tab on the right edge.

## Refreshing data from Reddit

Two options, both do the same work.

### A. Run the script directly

```bash
python scripts/refresh_data.py
```

You'll see log lines like:

```
INFO refresh: scanning r/bangalore
INFO refresh: scanning r/bengaluru
INFO refresh: found 42 new mentions across 17 restaurants
INFO refresh: scrape run #1 complete: 500 posts, 42 mentions
```

### B. Hit the admin endpoint

```bash
curl -X POST http://localhost:8000/api/refresh \
     -H "Authorization: Bearer <your ADMIN_TOKEN>"
```

Returns `{"status":"started","run_id":N}`. The scrape runs in a background subprocess. Hit the same endpoint again only after it finishes (check `ScrapeRun.status` via the DB or reload `/api/restaurants` to see updated counts).

Rate limits (from PRAW):

- OAuth authenticated requests: 60 per minute.
- Any single Reddit listing returns at most 1000 items.
- `prawcore.exceptions.TooManyRequests` is caught and retried with exponential backoff inside `iter_texts()`.

## API reference

| Method | Path                          | Purpose                                            |
|--------|-------------------------------|----------------------------------------------------|
| GET    | `/api/restaurants`            | List + filters (`q`, `cuisine`, `price`, `hype`, `min_mentions`, `bbox`) |
| GET    | `/api/restaurants/{id}`       | Detail plus last 10 mentions                       |
| GET    | `/api/restaurants.geojson`    | FeatureCollection for map overlays                 |
| GET    | `/api/stats`                  | Totals plus last scrape timestamp                  |
| POST   | `/api/refresh`                | Trigger scrape (Bearer `ADMIN_TOKEN`)              |
| POST   | `/api/ask`                    | LLM Q&A via OpenRouter. Body: `{ "messages": [{role, content}, ...] }` |
| GET    | `/api/health`                 | `{"status":"ok"}`                                  |

## Design notes

- **Why `PhraseMatcher` and not trained NER?** `en_core_web_sm` is 12 MB and doesn't tag restaurant names reliably. Training a custom NER needs labeled data and roughly a gigabyte of RAM. A PhraseMatcher seeded from the existing list (plus ORG fallback from spaCy's default NER) works well for the 4 to 5 GB target box and is trivial to extend.
- **Why SQLite with plain `Float` columns, not PostGIS?** A single-file DB keeps the footprint small. Every geo filter in the app is bounding-box SQL, which a B-tree index on `(lat, lng)` handles easily at tens of thousands of rows.
- **Why dynamic import for `MapView`?** Leaflet touches `window` on import. Under Next.js SSR this would throw "window is undefined." `dynamic(() => import('./MapView'), { ssr: false })` is the standard mitigation.
- **Why CartoDB `dark_all` instead of Google Maps?** Google's Terms of Use forbid any tile access outside their SDK. CartoDB offers a free, no-key dark-tile set that looks very close to Google's dark theme.
- **Why inject the whole restaurant list in the LLM system prompt?** The dataset is small (dozens of rows). Grounding beats retrieval at this size and guarantees answers stay inside the known data.

## License

MIT, see code.
