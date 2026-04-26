"""HTTP endpoints for prayer leaders."""

from fastapi import APIRouter, Depends

from app.data.repository import DataRepository, get_repository
from app.models.prayer import PrayerLeader

router = APIRouter(prefix="/api/prayer-leaders", tags=["prayers"])


@router.get("", response_model=list[PrayerLeader])
def list_prayer_leaders(
    repo: DataRepository = Depends(get_repository),
) -> list[PrayerLeader]:
    """Return all prayer leaders (people who can lead Representative Prayer)."""
    return repo.prayer_leaders