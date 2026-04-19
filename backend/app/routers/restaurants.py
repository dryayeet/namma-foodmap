from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, exists

from ..database import get_db
from ..models import Restaurant, Mention, ScrapeRun
from ..schemas import RestaurantOut, RestaurantDetail, MentionOut, StatsOut

router = APIRouter(prefix="/api", tags=["restaurants"])


def _parse_bbox(bbox: Optional[str]):
    if not bbox:
        return None
    parts = bbox.split(",")
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail="bbox must be lng1,lat1,lng2,lat2")
    try:
        lng1, lat1, lng2, lat2 = map(float, parts)
    except ValueError:
        raise HTTPException(status_code=400, detail="bbox values must be floats")
    return (min(lng1, lng2), min(lat1, lat2), max(lng1, lng2), max(lat1, lat2))


@router.get("/restaurants", response_model=List[RestaurantOut])
def list_restaurants(
    q: Optional[str] = Query(None, description="Free-text search across name, cuisine, area, dish tags, and mention snippets"),
    cuisine: Optional[str] = None,
    price: Optional[int] = Query(None, ge=1, le=4),
    hype: Optional[str] = Query(None, pattern="^(trending|overhyped|underrated|neutral)$"),
    min_mentions: Optional[int] = Query(None, ge=0),
    bbox: Optional[str] = None,
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    query = db.query(Restaurant)
    if q:
        like = f"%{q.strip()}%"
        mention_hit = (
            db.query(Mention.id)
            .filter(Mention.restaurant_id == Restaurant.id)
            .filter(Mention.text_snippet.ilike(like))
            .exists()
        )
        query = query.filter(or_(
            Restaurant.name.ilike(like),
            Restaurant.cuisine.ilike(like),
            Restaurant.area.ilike(like),
            Restaurant.tags.ilike(like),
            mention_hit,
        ))
    if cuisine:
        query = query.filter(Restaurant.cuisine.ilike(f"%{cuisine}%"))
    if price is not None:
        query = query.filter(Restaurant.price_tier == price)
    if hype:
        query = query.filter(Restaurant.hype_category == hype)
    if min_mentions is not None:
        query = query.filter(Restaurant.mention_count >= min_mentions)
    box = _parse_bbox(bbox)
    if box:
        lng_min, lat_min, lng_max, lat_max = box
        query = query.filter(
            Restaurant.lng >= lng_min, Restaurant.lng <= lng_max,
            Restaurant.lat >= lat_min, Restaurant.lat <= lat_max,
        )
    return query.order_by(desc(Restaurant.hype_score)).limit(limit).all()


@router.get("/restaurants.geojson")
def restaurants_geojson(db: Session = Depends(get_db)):
    rows = db.query(Restaurant).all()
    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [r.lng, r.lat]},
            "properties": {
                "id": r.id,
                "name": r.name,
                "cuisine": r.cuisine,
                "price_tier": r.price_tier,
                "area": r.area,
                "mention_count": r.mention_count,
                "avg_sentiment": r.avg_sentiment,
                "hype_score": r.hype_score,
                "hype_category": r.hype_category,
            },
        }
        for r in rows
    ]
    return {"type": "FeatureCollection", "features": features}


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantDetail)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    mentions = (
        db.query(Mention)
        .filter(Mention.restaurant_id == r.id)
        .order_by(desc(Mention.created_utc))
        .limit(10)
        .all()
    )
    data = RestaurantDetail.model_validate(r).model_dump()
    data["recent_mentions"] = [MentionOut.model_validate(m).model_dump() for m in mentions]
    return data


@router.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db)):
    total_restaurants = db.query(func.count(Restaurant.id)).scalar() or 0
    total_mentions = db.query(func.count(Mention.id)).scalar() or 0
    last_run = db.query(ScrapeRun).order_by(desc(ScrapeRun.started_at)).first()
    by_cat = dict(
        db.query(Restaurant.hype_category, func.count(Restaurant.id))
        .group_by(Restaurant.hype_category)
        .all()
    )
    return StatsOut(
        total_restaurants=total_restaurants,
        total_mentions=total_mentions,
        last_scrape=last_run.started_at if last_run else None,
        trending_count=by_cat.get("trending", 0),
        overhyped_count=by_cat.get("overhyped", 0),
        underrated_count=by_cat.get("underrated", 0),
    )
