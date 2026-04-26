"""HTTP endpoint for generating + downloading a service presentation."""

from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.data.repository import DataRepository, get_repository
from app.models.service import GeneratePresentationRequest
from app.services.service_builder import build_presentation

router = APIRouter(prefix="/api/presentations", tags=["presentations"])


@router.post("/generate")
def generate_presentation(
    req: GeneratePresentationRequest,
    repo: DataRepository = Depends(get_repository),
) -> FileResponse:
    """Generate a .pptx for the given service and return it as a download."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in req.service_title)
    filename = f"church_service_{safe_title}_{timestamp}.pptx"

    path = build_presentation(req, repo, filename)

    return FileResponse(
        path=str(path),
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )