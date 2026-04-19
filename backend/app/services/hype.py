"""Hype scoring and categorization.

Spec formula: HypeScore = MentionCount * 0.6 + VaderCompound * 0.4
We normalize MentionCount to [0, 1] (capped at 50 mentions) so that a
single raw count doesn't drown out the sentiment signal on small datasets.
The normalization threshold is exposed as a constant so it can be tuned.
"""

MENTION_CAP = 50


def compute_hype_score(mention_count: int, avg_sentiment: float) -> float:
    norm_mentions = min(mention_count, MENTION_CAP) / MENTION_CAP
    return round(0.6 * norm_mentions + 0.4 * avg_sentiment, 4)


def classify_hype(mention_count: int, avg_sentiment: float) -> str:
    if mention_count >= 10 and avg_sentiment >= 0.3:
        return "trending"
    if mention_count >= 10 and avg_sentiment < 0:
        return "overhyped"
    if mention_count < 10 and avg_sentiment >= 0.5:
        return "underrated"
    return "neutral"


def recompute(restaurant) -> None:
    restaurant.hype_score = compute_hype_score(
        restaurant.mention_count or 0,
        restaurant.avg_sentiment or 0.0,
    )
    restaurant.hype_category = classify_hype(
        restaurant.mention_count or 0,
        restaurant.avg_sentiment or 0.0,
    )
