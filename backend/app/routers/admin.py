import os
import sys
import subprocess
from pathlib import Path
from fastapi import APIRouter, Depends, Header, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ScrapeRun
from ..schemas import RefreshResponse

router = APIRouter(prefix="/api", tags=["admin"])


def require_admin(authorization: str = Header(default="")) -> None:
    expected = os.getenv("ADMIN_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN not configured")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if authorization.removeprefix("Bearer ").strip() != expected:
        raise HTTPException(status_code=401, detail="Invalid token")


def _run_refresh_script() -> None:
    script = Path(__file__).resolve().parents[3] / "scripts" / "refresh_data.py"
    subprocess.Popen([sys.executable, str(script)], cwd=str(script.parent.parent))


@router.post("/refresh", response_model=RefreshResponse)
def trigger_refresh(
    background_tasks: BackgroundTasks,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
):
    run = ScrapeRun(status="queued")
    db.add(run)
    db.commit()
    db.refresh(run)
    background_tasks.add_task(_run_refresh_script)
    return RefreshResponse(status="started", run_id=run.id, message="Scrape enqueued")
