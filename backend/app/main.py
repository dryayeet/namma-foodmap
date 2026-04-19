import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .routers import restaurants, admin, ask
from .schemas import HealthOut
from .seed import seed_if_empty

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("nammanomnom")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        created = seed_if_empty(db)
        if created:
            log.info("Seeded %d restaurants", created)
    yield


app = FastAPI(title="NammaNomNom API", version="0.1.0", lifespan=lifespan)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(restaurants.router)
app.include_router(admin.router)
app.include_router(ask.router)


@app.get("/api/health", response_model=HealthOut, tags=["health"])
def health():
    return HealthOut(status="ok")
