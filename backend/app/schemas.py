from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class MentionOut(BaseModel):
    id: int
    subreddit: str
    permalink: Optional[str] = None
    text_snippet: str
    sentiment: float
    created_utc: datetime

    class Config:
        from_attributes = True


class RestaurantOut(BaseModel):
    id: int
    name: str
    slug: str
    cuisine: Optional[str] = None
    price_tier: int
    area: Optional[str] = None
    lat: float
    lng: float
    tags: Optional[str] = ""
    mention_count: int
    avg_sentiment: float
    hype_score: float
    hype_category: str
    last_updated: datetime

    class Config:
        from_attributes = True


class RestaurantDetail(RestaurantOut):
    recent_mentions: List[MentionOut] = Field(default_factory=list)


class StatsOut(BaseModel):
    total_restaurants: int
    total_mentions: int
    last_scrape: Optional[datetime] = None
    trending_count: int
    overhyped_count: int
    underrated_count: int


class RefreshResponse(BaseModel):
    status: str
    run_id: Optional[int] = None
    message: Optional[str] = None


class HealthOut(BaseModel):
    status: str
