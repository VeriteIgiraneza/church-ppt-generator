from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Church PowerPoint Generator API",
    description="Backend API for generating church service presentations",
    version="0.1.0",
)

# CORS: allow the frontend (running on localhost:5173 with Vite) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Church PowerPoint Generator API is running"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}