"""Nominatim geocoder with Bengaluru viewbox bias and 1 req/s throttle.

Nominatim's public endpoint requires a unique user-agent and enforces
~1 request/second. We wrap geopy's RateLimiter for safety.
"""
from __future__ import annotations

import logging
from typing import Optional, Tuple

from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from geopy.exc import GeocoderServiceError, GeocoderTimedOut

logger = logging.getLogger(__name__)

# Bengaluru bounding box (lng_min, lat_max, lng_max, lat_min) per Nominatim docs
BENGALURU_VIEWBOX = [(77.40, 13.15), (77.80, 12.80)]

_geolocator = Nominatim(user_agent="nammanomnom/0.1 (https://github.com/nammanomnom)")
_geocode = RateLimiter(_geolocator.geocode, min_delay_seconds=1.1, swallow_exceptions=False)


def geocode_restaurant(name: str, area: Optional[str] = None) -> Optional[Tuple[float, float]]:
    query = f"{name}, {area}, Bengaluru, India" if area else f"{name}, Bengaluru, India"
    try:
        loc = _geocode(query, viewbox=BENGALURU_VIEWBOX, bounded=True, timeout=10)
    except (GeocoderServiceError, GeocoderTimedOut) as e:
        logger.warning("geocode failed for %s: %s", query, e)
        return None
    if not loc:
        return None
    return (loc.latitude, loc.longitude)
