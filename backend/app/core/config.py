from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve paths relative to the backend/ directory (parent of app/)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application configuration.

    Values can be overridden by environment variables or a .env file.
    Example: setting CORS_ORIGIN=http://example.com in .env will override
    the default below.
    """

    # API
    api_title: str = "Church PowerPoint Generator API"
    api_version: str = "0.1.0"
    cors_origin: str = "http://localhost:5173"

    # Filesystem paths
    backend_dir: Path = BACKEND_DIR
    data_dir: Path = BACKEND_DIR / "data"
    templates_dir: Path = BACKEND_DIR / "templates"
    output_dir: Path = BACKEND_DIR / "output"

    # Data files
    hymns_file: Path = BACKEND_DIR / "data" / "hymns.csv"
    bible_file: Path = BACKEND_DIR / "data" / "bible.csv"
    creeds_file: Path = BACKEND_DIR / "data" / "Creed.csv"
    prayer_leaders_file: Path = BACKEND_DIR / "data" / "representative_prayer.txt"

    # Template
    template_file: Path = BACKEND_DIR / "templates" / "church_template.pptx"

    # Slide generation
    max_chars_per_bible_slide: int = 900

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Singleton instance — import this everywhere instead of creating new ones
settings = Settings()