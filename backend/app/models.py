from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Index,
)
from sqlalchemy.orm import relationship
from .database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    cuisine = Column(String, index=True)
    price_tier = Column(Integer, default=2)  # 1..4 -> $, $$, $$$, $$$$
    area = Column(String, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    tags = Column(String, default="")  # comma-separated dish keywords (biryani, coffee, pizza, ...)

    mention_count = Column(Integer, default=0)
    avg_sentiment = Column(Float, default=0.0)
    hype_score = Column(Float, default=0.0, index=True)
    hype_category = Column(String, default="neutral", index=True)

    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    mentions = relationship("Mention", back_populates="restaurant", cascade="all, delete-orphan")


class Mention(Base):
    __tablename__ = "mentions"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True)
    reddit_id = Column(String, unique=True, nullable=False, index=True)
    subreddit = Column(String, index=True)
    permalink = Column(String)
    text_snippet = Column(Text)
    sentiment = Column(Float, default=0.0)
    created_utc = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="mentions")


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    posts_scanned = Column(Integer, default=0)
    mentions_found = Column(Integer, default=0)
    status = Column(String, default="running")  # running | success | error
    error = Column(Text, nullable=True)


Index("ix_mentions_restaurant_created", Mention.restaurant_id, Mention.created_utc.desc())
