"""NammaNomNom data refresh pipeline.

Pulls the latest ~500 posts + top-level comments from r/bangalore and
r/bengaluru, extracts restaurant mentions with a spaCy PhraseMatcher
seeded from the existing DB, scores each mention with VADER, and
upserts aggregated hype metrics.

Run standalone:
    python scripts/refresh_data.py
or via the admin endpoint:
    POST /api/refresh   (Authorization: Bearer $ADMIN_TOKEN)

Design choices:
- en_core_web_sm is intentionally small (~12 MB) for the 4 GB target.
- Default NER doesn't reliably tag restaurant names, so we use a
  PhraseMatcher seeded from the DB. ORG entities become unverified
  candidates that can be reviewed / geocoded later.
- PRAW already respects the OAuth 60 req/min limit. We additionally
  catch TooManyRequests with exponential backoff.
"""
from __future__ import annotations

import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# Make the backend package importable when running as a script.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

import praw
import prawcore
import spacy
from spacy.matcher import PhraseMatcher
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sqlalchemy.orm import Session

from app.database import SessionLocal, Base, engine  # type: ignore
from app.models import Restaurant, Mention, ScrapeRun  # type: ignore
from app.services.hype import recompute  # type: ignore

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("refresh")

SUBREDDITS = ["bangalore", "bengaluru"]
POST_LIMIT = 500


def build_reddit() -> praw.Reddit:
    missing = [k for k in ("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USER_AGENT") if not os.getenv(k)]
    if missing:
        raise SystemExit(f"Missing env vars: {missing}. Populate .env (see .env.example).")
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT"),
        ratelimit_seconds=600,
    )


def load_nlp_and_matcher(db: Session) -> Tuple[spacy.Language, PhraseMatcher, Dict[str, int]]:
    nlp = spacy.load("en_core_web_sm", disable=["lemmatizer"])
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")

    name_to_id: Dict[str, int] = {}
    patterns = []
    for r in db.query(Restaurant).all():
        name_to_id[r.name.lower()] = r.id
        patterns.append(nlp.make_doc(r.name))
        # also add common short form without parenthetical
        short = r.name.split(" (")[0]
        if short.lower() != r.name.lower():
            name_to_id[short.lower()] = r.id
            patterns.append(nlp.make_doc(short))

    if patterns:
        matcher.add("RESTAURANT", patterns)
    log.info("Loaded %d restaurant patterns", len(patterns))
    return nlp, matcher, name_to_id


def sentence_around(doc, start: int, end: int) -> str:
    for sent in doc.sents:
        if sent.start <= start and sent.end >= end:
            return sent.text.strip()
    return doc[max(0, start - 20): min(len(doc), end + 20)].text


def iter_texts(reddit: praw.Reddit, subreddit_name: str):
    """Yield (reddit_id, permalink, text, created_utc) tuples with retry."""
    backoff = 2
    while True:
        try:
            sub = reddit.subreddit(subreddit_name)
            for post in sub.new(limit=POST_LIMIT):
                body = (post.title or "") + "\n" + (post.selftext or "")
                yield post.id, f"https://reddit.com{post.permalink}", body, datetime.utcfromtimestamp(post.created_utc)
                try:
                    post.comments.replace_more(limit=0)
                    for c in post.comments.list():
                        if getattr(c, "body", None):
                            yield c.id, f"https://reddit.com{c.permalink}", c.body, datetime.utcfromtimestamp(c.created_utc)
                except prawcore.exceptions.TooManyRequests:
                    log.warning("comment fetch rate-limited; sleeping %ds", backoff)
                    time.sleep(backoff)
                    backoff = min(backoff * 2, 60)
            return
        except prawcore.exceptions.TooManyRequests:
            log.warning("listing rate-limited; sleeping %ds", backoff)
            time.sleep(backoff)
            backoff = min(backoff * 2, 120)
        except prawcore.exceptions.ResponseException as e:
            log.error("reddit response error: %s", e)
            return


def process_pipeline() -> None:
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    run = ScrapeRun(started_at=datetime.utcnow(), status="running")
    db.add(run); db.commit(); db.refresh(run)

    try:
        reddit = build_reddit()
        nlp, matcher, name_to_id = load_nlp_and_matcher(db)
        vader = SentimentIntensityAnalyzer()

        seen_reddit_ids: Set[str] = {
            rid for (rid,) in db.query(Mention.reddit_id).all()
        }
        agg: Dict[int, List[float]] = {}   # restaurant_id -> [sentiments]
        new_mentions: List[Mention] = []
        posts_scanned = 0

        for sub_name in SUBREDDITS:
            log.info("scanning r/%s", sub_name)
            for reddit_id, permalink, text, created_utc in iter_texts(reddit, sub_name):
                posts_scanned += 1
                if reddit_id in seen_reddit_ids:
                    continue
                if not text or len(text) < 8:
                    continue

                doc = nlp(text[:5000])  # cap per-text cost
                matches = matcher(doc)
                if not matches:
                    continue

                hit_ids: Set[int] = set()
                for _, s, e in matches:
                    span_text = doc[s:e].text.lower()
                    rid = name_to_id.get(span_text)
                    if rid is None:
                        continue
                    if rid in hit_ids:
                        continue
                    hit_ids.add(rid)
                    sentence = sentence_around(doc, s, e)
                    compound = vader.polarity_scores(sentence)["compound"]
                    agg.setdefault(rid, []).append(compound)
                    new_mentions.append(Mention(
                        restaurant_id=rid,
                        reddit_id=reddit_id,
                        subreddit=sub_name,
                        permalink=permalink,
                        text_snippet=sentence[:500],
                        sentiment=compound,
                        created_utc=created_utc,
                    ))
                    seen_reddit_ids.add(reddit_id)

        log.info("found %d new mentions across %d restaurants", len(new_mentions), len(agg))

        # Persist new mentions (batched).
        if new_mentions:
            db.bulk_save_objects(new_mentions)

        # Update restaurant aggregates.
        for rid, compounds in agg.items():
            r = db.query(Restaurant).filter(Restaurant.id == rid).first()
            if not r:
                continue
            old_total = (r.avg_sentiment or 0.0) * (r.mention_count or 0)
            new_count = (r.mention_count or 0) + len(compounds)
            r.avg_sentiment = (old_total + sum(compounds)) / max(new_count, 1)
            r.mention_count = new_count
            recompute(r)
            r.last_updated = datetime.utcnow()

        run.posts_scanned = posts_scanned
        run.mentions_found = len(new_mentions)
        run.status = "success"
        run.finished_at = datetime.utcnow()
        db.commit()
        log.info("scrape run #%d complete: %s posts, %s mentions",
                 run.id, run.posts_scanned, run.mentions_found)

    except Exception as e:
        log.exception("refresh failed")
        run.status = "error"
        run.error = str(e)[:1000]
        run.finished_at = datetime.utcnow()
        db.commit()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    process_pipeline()
