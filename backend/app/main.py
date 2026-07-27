from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import bible, hymns, prayers, creeds, presentations
from app.presenter import router as presenter_router
from app.core.config import settings
from app.data.repository import get_repository


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs at startup (before yield) and shutdown (after yield)."""
    # Startup: warm the data repository so the first request isn't slow
    print("[startup] Loading data...")
    get_repository()
    print("[startup] Ready")
    yield
    # Shutdown: nothing to clean up for now
    print("[shutdown] Goodbye")


app = FastAPI(
    title=settings.api_title,
    description="Backend API for generating church service presentations",
    version=settings.api_version,
    lifespan=lifespan,
)

# CORS — let the frontend (Vite on port 5173) call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Church PowerPoint Generator API is running"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "Good to go!"}


# Register routers
app.include_router(hymns.router)
app.include_router(bible.router)
app.include_router(creeds.router)
app.include_router(prayers.router)
app.include_router(presentations.router)
app.include_router(presenter_router.router)

# 12,"Hear Our Praises","
# May our homes be 
# filled with dancing,
# May our streets be 
# filled with joy;
# May injustice bow to Jesus
# As the people turn to pray.

# From the mountains to the valleys,
# Hear our praises rise to You.
# From the heavens to the nations,
# Hear our singing fill the air.

# May Your light shine in the darkness
# As we walk before the cross;
# May Your glory fill the whole earth
# As the water o'er the seas.

# From the mountains to the valleys,
# Hear our praises rise to You.
# From the heavens to the nations,
# Hear our singing fill the air.

# Hallelujah, hallelujah,
# Hallelujah, hallelujah,
# Hallelujah!
# "