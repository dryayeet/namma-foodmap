"""LLM-powered Q&A endpoint.

Wraps OpenRouter -> Claude Haiku 4.5 (or any configured model) and injects
the current restaurant dataset as a system prompt so the model can ground
its recommendations in our data. Supports route-style queries like
"I'm going from Yelahanka to Indiranagar — what can I eat on the way?"
"""
from __future__ import annotations

import os
from typing import List, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Restaurant

router = APIRouter(prefix="/api", tags=["chat"])

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_HISTORY = 20


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AskRequest(BaseModel):
    messages: List[ChatMessage]


class AskResponse(BaseModel):
    content: str


def _build_system_prompt(db: Session) -> str:
    rows = (
        db.query(Restaurant)
        .order_by(desc(Restaurant.hype_score))
        .limit(80)
        .all()
    )
    lines = []
    for r in rows:
        lines.append(
            f"- {r.name} | cuisine: {r.cuisine or '—'} | area: {r.area or '—'} "
            f"| hype: {r.hype_category} (score {r.hype_score:.2f}, "
            f"{r.mention_count} mentions, sentiment {r.avg_sentiment:+.2f}) "
            f"| tags: {r.tags or '—'}"
        )
    data_block = "\n".join(lines)

    return (
        "You are NammaNomNom, a community-driven food guide for Bengaluru. "
        "Answer questions about where to eat using ONLY the restaurants in "
        "the dataset below. For route-based questions (e.g. \"going from "
        "Yelahanka to Indiranagar, what's on the way?\") reason about "
        "Bengaluru geography (Yelahanka is far north; Hebbal and Hennur are "
        "north; Malleshwaram and Basavanagudi are central-west; MG Road, "
        "Residency Road, Lavelle Road, UB City are the central CBD; "
        "Indiranagar and Koramangala are central-east; Whitefield, "
        "Marathahalli, Brookefield are far east) and recommend 2 to 5 spots "
        "roughly along or near the route.\n\n"
        "Rules:\n"
        "- Keep it tight. Max 2 to 5 recommendations unless the user asks for more.\n"
        "- For each pick use the format: **Name** (area, cuisine), then one short "
        "reason that references concrete data (mentions, sentiment, tags, hype category).\n"
        "- Never invent restaurants. If nothing fits, just say so honestly.\n"
        "- Warm, local tone, like a Bangalorean friend rather than a corporate chatbot. "
        "Use markdown (bullets, bold) but no headings.\n"
        "- Write like a real person, not an AI. Keep sentences short and natural. "
        "Avoid stock AI phrases like \"delve into\", \"in essence\", \"it is worth "
        "noting\", \"a testament to\", \"journey\", \"navigate the landscape\", or "
        "\"unlock\".\n"
        "- IMPORTANT: never use em dashes (the \u2014 character). Use commas, "
        "parentheses, colons, or just split into two sentences instead. Regular "
        "hyphens in compound words are fine.\n\n"
        "RESTAURANT DATA:\n"
        f"{data_block}"
    )


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest, db: Session = Depends(get_db)) -> AskResponse:
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENROUTER_API_KEY not configured. Add it to .env and restart the backend.",
        )
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages[] is required")
    if req.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="last message must be from the user")

    model = os.getenv("LLM_MODEL", "anthropic/claude-haiku-4.5")
    history = [{"role": m.role, "content": m.content} for m in req.messages[-MAX_HISTORY:]]
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": _build_system_prompt(db)}] + history,
        "temperature": 0.5,
        "max_tokens": 700,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        # OpenRouter recommends these for attribution / routing.
        "HTTP-Referer": os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
        "X-Title": "NammaNomNom",
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {e}")

    if resp.status_code >= 400:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"OpenRouter error: {resp.text[:400]}",
        )

    data = resp.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        raise HTTPException(status_code=502, detail=f"Malformed OpenRouter response: {e}")

    return AskResponse(content=content.strip())
