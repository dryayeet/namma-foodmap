"""Seed the SQLite DB with a curated list of Bengaluru restaurants so the
app is functional immediately without needing a scrape run.

Each entry includes hand-verified lat/lng, cuisine, price tier, dish tags,
and a plausible community mention_count / avg_sentiment so the hype
categories are visible on first boot. A handful of mock Mention rows per
restaurant are also inserted so /api/restaurants/{id} has quotes to
display and the free-text search can match against them.
"""
import random
from datetime import datetime, timedelta
from slugify import slugify
from sqlalchemy.orm import Session

from .models import Restaurant, Mention
from .services.hype import recompute

SEED_RESTAURANTS = [
    # name, cuisine, price_tier, area, lat, lng, mentions, sentiment, tags
    ("Meghana Foods",        "Andhra",        2, "Residency Road", 12.9716, 77.6050, 48,  0.55, "biryani,kabab,prawns,rice"),
    ("Truffles",             "American",      2, "Koramangala",    12.9352, 77.6245, 42,  0.62, "burger,steak,fries,milkshake"),
    ("CTR (Central Tiffin Room)", "South Indian", 1, "Malleshwaram", 13.0030, 77.5700, 30, 0.72, "benne dosa,idli,filter coffee"),
    ("Vidyarthi Bhavan",     "South Indian",  1, "Basavanagudi",   12.9430, 77.5720, 28,  0.75, "masala dosa,vada,filter coffee"),
    ("Koshy's",              "Continental",   2, "St Marks Road",  12.9730, 77.6045, 22,  0.48, "breakfast,beef chilly,fish fry"),
    ("MTR 1924",             "South Indian",  2, "Lalbagh Road",   12.9530, 77.5880, 35,  0.60, "rava idli,dosa,filter coffee"),
    ("Karavalli",            "Coastal",       4, "Richmond Road",  12.9620, 77.6050, 14,  0.65, "fish curry,appam,prawns,mangalore"),
    ("The Only Place",       "Steakhouse",    3, "Museum Road",    12.9715, 77.6045, 9,   0.40, "steak,ribs,burger"),
    ("Toit Brewpub",         "Brewpub",       3, "Indiranagar",    12.9784, 77.6408, 38,  0.52, "beer,pizza,wings,craft beer"),
    ("Windmills Craftworks", "Brewpub",       4, "Whitefield",     12.9690, 77.7490, 12,  0.35, "beer,pasta,steak,jazz"),
    ("Byg Brewski",          "Brewpub",       3, "Hennur",         13.0400, 77.6400, 18,  0.25, "beer,pizza,rooftop,burger"),
    ("Nagarjuna",            "Andhra",        2, "Residency Road", 12.9706, 77.6055, 20,  0.50, "biryani,meals,andhra thali"),
    ("Hotel Empire",         "North Indian",  1, "Koramangala",    12.9352, 77.6146, 45, -0.10, "kebab,butter chicken,roti,shawarma"),
    ("Corner House",         "Ice Cream",     1, "Airlines Hotel", 12.9735, 77.6000, 33,  0.80, "ice cream,sundae,death by chocolate"),
    ("Glen's Bakehouse",     "Cafe",          2, "Indiranagar",    12.9720, 77.6410, 11,  0.45, "cake,coffee,sandwich,brownie"),
    ("Third Wave Coffee",    "Cafe",          2, "Indiranagar",    12.9750, 77.6420, 15,  0.20, "coffee,latte,cold brew,pastry"),
    ("Blue Tokai",           "Cafe",          2, "Indiranagar",    12.9780, 77.6400, 13,  0.55, "coffee,espresso,single origin,croissant"),
    ("Punjab Grill",         "North Indian",  3, "UB City",        12.9720, 77.5960, 8,  -0.05, "kebab,dal makhani,naan,tandoor"),
    ("Fatty Bao",            "Asian",         3, "Indiranagar",    12.9760, 77.6400, 16,  0.42, "bao,ramen,dimsum,asian"),
    ("Burma Burma",          "Burmese",       3, "Indiranagar",    12.9782, 77.6410, 19,  0.68, "khow suey,tea leaf salad,bun,burmese"),
    ("Chianti",              "Italian",       3, "Indiranagar",    12.9770, 77.6395, 7,   0.60, "pizza,pasta,risotto,tiramisu"),
    ("Sunny's",              "Continental",   4, "Lavelle Road",   12.9720, 77.6020, 10,  0.55, "steak,pasta,wine,brunch"),
    ("Rameshwaram Cafe",     "South Indian",  1, "Brookefield",    12.9650, 77.7180, 72,  0.65, "ghee podi idli,filter coffee,dosa"),
    ("Smoke House Deli",     "European",      3, "Indiranagar",    12.9755, 77.6388, 6,   0.30, "pizza,pasta,sandwich,brunch"),
    ("AB's Absolute Barbecues", "BBQ Buffet", 3, "Marathahalli",   12.9580, 77.7010, 25, -0.15, "barbecue,buffet,grill,starters"),
    ("Chinita Real Mexican", "Mexican",       3, "Indiranagar",    12.9765, 77.6415, 5,   0.60, "taco,burrito,nachos,margarita"),
    ("Hole In The Wall",     "Cafe",          2, "Koramangala",    12.9360, 77.6240, 14,  0.58, "breakfast,pancakes,coffee,eggs"),
]

# Reddit-style quote templates. `{dish}` is filled from per-restaurant tags.
POSITIVE_TEMPLATES = [
    "Honestly {name} is still the gold standard for {dish} in Bangalore. Never disappoints.",
    "The {dish} at {name} is unreal. Last weekend I took my parents and they wouldn't stop talking about it.",
    "{name} is criminally underrated imo. Their {dish} alone is worth the detour to {area}.",
    "Every time I'm in {area} I end up at {name} for the {dish}. Consistency is incredible.",
    "If you haven't tried the {dish} at {name} yet, do yourself a favor. Best in the city hands down.",
    "Went to {name} again yesterday for {dish}. The flavors just hit different.",
]
MIXED_TEMPLATES = [
    "{name}'s {dish} is fine I guess? Used to be better 5 years ago though.",
    "The {dish} at {name} is decent but the wait times on weekends are crazy.",
    "Hit or miss at {name} tbh. Last {dish} was good but the one before was mid.",
    "{name} is okay for a one-time visit. Their {dish} won't blow your mind.",
]
NEGATIVE_TEMPLATES = [
    "Genuinely don't get the hype around {name}. Overpriced and their {dish} is just average.",
    "{name} has gone downhill. Last time the {dish} was cold and the staff didn't care.",
    "Skip {name}. There are way better spots for {dish} within a 1 km radius.",
    "Honestly {name} is overrated. You're paying for the name, the {dish} isn't that special.",
]


def _pick_templates(sentiment: float):
    if sentiment >= 0.4:
        return POSITIVE_TEMPLATES + MIXED_TEMPLATES[:1]
    if sentiment <= -0.05:
        return NEGATIVE_TEMPLATES + MIXED_TEMPLATES
    return MIXED_TEMPLATES + POSITIVE_TEMPLATES[:2]


def _build_mentions(restaurant: Restaurant, tags: str, target_sentiment: float, count: int):
    rng = random.Random(hash(restaurant.name) & 0xFFFF)
    templates = _pick_templates(target_sentiment)
    dishes = [t.strip() for t in (tags or "").split(",") if t.strip()] or ["food"]
    mentions = []
    now = datetime.utcnow()
    for i in range(min(count, 6)):
        text = rng.choice(templates).format(
            name=restaurant.name,
            dish=rng.choice(dishes),
            area=(restaurant.area or "Bengaluru"),
        )
        sentiment = max(-1.0, min(1.0, target_sentiment + rng.uniform(-0.15, 0.15)))
        mentions.append(Mention(
            restaurant_id=restaurant.id,
            reddit_id=f"seed-{restaurant.id}-{i}",
            subreddit=rng.choice(["bangalore", "bengaluru"]),
            permalink=f"https://reddit.com/r/bangalore/comments/seed{restaurant.id}{i}",
            text_snippet=text,
            sentiment=round(sentiment, 3),
            created_utc=now - timedelta(days=rng.randint(1, 45), hours=rng.randint(0, 23)),
        ))
    return mentions


def seed_if_empty(db: Session) -> int:
    if db.query(Restaurant).count() > 0:
        return 0

    created = 0
    for name, cuisine, price, area, lat, lng, mentions, sentiment, tags in SEED_RESTAURANTS:
        r = Restaurant(
            name=name,
            slug=slugify(name),
            cuisine=cuisine,
            price_tier=price,
            area=area,
            lat=lat,
            lng=lng,
            tags=tags,
            mention_count=mentions,
            avg_sentiment=sentiment,
            last_updated=datetime.utcnow(),
        )
        recompute(r)
        db.add(r)
        created += 1

    db.flush()  # restaurants need IDs before we build mentions

    all_mentions = []
    for r, seed in zip(
        db.query(Restaurant).order_by(Restaurant.id).all(), SEED_RESTAURANTS
    ):
        _, _, _, _, _, _, mention_count, sentiment, tags = seed
        all_mentions.extend(_build_mentions(r, tags, sentiment, mention_count))

    if all_mentions:
        db.bulk_save_objects(all_mentions)

    db.commit()
    return created
