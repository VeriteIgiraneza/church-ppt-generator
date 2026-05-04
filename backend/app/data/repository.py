"""Data repository: loads church data from CSV/text files into memory.

Loads everything once at startup and caches it. All other code accesses
data through this module — never reads files directly.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import pandas as pd

from app.core.config import settings
from app.models.bible import BibleVerse
from app.models.creed import Creed
from app.models.hymn import Hymn
from app.models.prayer import PrayerLeader
from app.models.lords_prayer import LordsPrayer


class DataRepository:
    """Holds all church data in memory after loading from disk."""

    def __init__(self) -> None:
        self._hymns: list[Hymn] = []
        self._bible: list[BibleVerse] = []
        self._creeds: list[Creed] = []
        self._lords_prayer: LordsPrayer | None = None
        self._prayer_leaders: list[PrayerLeader] = []
        self._loaded = False

    # ---------- loading ----------

    def load_all(self) -> None:
        """Load everything. Idempotent — safe to call multiple times."""
        if self._loaded:
            return

        self._hymns = self._load_hymns(settings.hymns_file)
        self._bible = self._load_bible(settings.bible_file)
        self._creeds = self._load_creeds(settings.creeds_file)
        self._lords_prayer = self._load_lords_prayer(settings.lords_prayer_file)
        self._prayer_leaders = self._load_prayer_leaders(settings.prayer_leaders_file)
        self._loaded = True

        print(
            f"[data] Loaded {len(self._hymns)} hymns, "
            f"{len(self._bible)} verses, "
            f"{len(self._creeds)} creeds, "
            f"lord's prayer: {'yes' if self._lords_prayer else 'no'}, "
            f"{len(self._prayer_leaders)} prayer leaders"
        )

    @staticmethod
    def _load_hymns(path: Path) -> list[Hymn]:
        df = pd.read_csv(
            path,
            quotechar='"',
            skipinitialspace=True,
            encoding="utf-8",
            keep_default_na=False,
        )
        df.columns = df.columns.str.strip()
        return [Hymn(**row) for row in df.to_dict("records")]

    @staticmethod
    def _load_bible(path: Path) -> list[BibleVerse]:
        df = pd.read_csv(path, encoding="utf-8", keep_default_na=False)
        df.columns = df.columns.str.strip()
        return [BibleVerse(**row) for row in df.to_dict("records")]

    @staticmethod
    def _load_creeds(path: Path) -> list[Creed]:
        df = pd.read_csv(path, encoding="utf-8", keep_default_na=False)
        df.columns = df.columns.str.strip()
        return [Creed(**row) for row in df.to_dict("records")]

    @staticmethod
    def _load_lords_prayer(path: Path) -> LordsPrayer | None:
        """Load The Lord's Prayer from CSV. Returns None if file missing."""
        if not path.exists():
            print(f"[data] WARNING: Lord's Prayer file not found at {path}")
            return None

        df = pd.read_csv(path, encoding="utf-8", keep_default_na=False)
        df.columns = df.columns.str.strip()
        records = df.to_dict("records")
        if not records:
            return None
        return LordsPrayer(**records[0])

    @staticmethod
    def _load_prayer_leaders(path: Path) -> list[PrayerLeader]:
        """Prayer leaders file is a JSON file (despite the .txt extension)."""
        if not path.exists():
            print(f"[data] WARNING: prayer leaders file not found at {path}")
            return []

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        leaders_raw = data.get("representative_prayer_list", [])
        return [PrayerLeader(**leader) for leader in leaders_raw]

    # ---------- accessors ----------

    @property
    def hymns(self) -> list[Hymn]:
        self._ensure_loaded()
        return self._hymns

    @property
    def bible(self) -> list[BibleVerse]:
        self._ensure_loaded()
        return self._bible

    @property
    def creeds(self) -> list[Creed]:
        self._ensure_loaded()
        return self._creeds
    
    @property
    def prayer_leaders(self) -> list[PrayerLeader]:
        self._ensure_loaded()
        return self._prayer_leaders

    @property
    def lords_prayer(self) -> LordsPrayer | None:
        self._ensure_loaded()
        return self._lords_prayer

    def _ensure_loaded(self) -> None:
        if not self._loaded:
            self.load_all()

    # hymn search

    def search_hymns(self, query: str) -> list[Hymn]:
        """Find hymns matching the query.

        Matches against:
        - hymn_id (exact match if query is a number)
        - title (case-insensitive substring)
        - author (case-insensitive substring)
        - category (case-insensitive substring)
        """
        self._ensure_loaded()

        query = query.strip()
        if not query:
            return self._hymns

        # Numeric query → exact ID match
        if query.isdigit():
            target_id = int(query)
            return [h for h in self._hymns if h.hymn_id == target_id]

        query_lower = query.lower()
        return [
            h
            for h in self._hymns
            if query_lower in h.title.lower()
            or query_lower in h.author.lower()
            or query_lower in h.category.lower()
        ]

    # ---------- bible ----------

    def get_bible_books(self) -> list[str]:
        """Return all Bible book names, in the order they first appear in the data."""
        self._ensure_loaded()
        seen: set[str] = set()
        ordered: list[str] = []
        for verse in self._bible:
            if verse.book not in seen:
                seen.add(verse.book)
                ordered.append(verse.book)
        return ordered

    def get_bible_chapters(self, book: str) -> list[int]:
        """Return sorted list of chapter numbers available in the given book."""
        self._ensure_loaded()
        chapters = {v.chapter for v in self._bible if v.book == book}
        return sorted(chapters)

    def get_bible_verse_numbers(self, book: str, chapter: int) -> list[int]:
        """Return sorted list of verse numbers in the given chapter."""
        self._ensure_loaded()
        verses = {
            v.verse for v in self._bible if v.book == book and v.chapter == chapter
        }
        return sorted(verses)

    def get_bible_passage(
        self,
        book: str,
        chapter: int,
        start_verse: int,
        end_verse: int,
    ) -> list[BibleVerse]:
        """Return all verses in [start_verse, end_verse] for the given book/chapter."""
        self._ensure_loaded()
        return sorted(
            [
                v
                for v in self._bible
                if v.book == book
                and v.chapter == chapter
                and start_verse <= v.verse <= end_verse
            ],
            key=lambda v: v.verse,
        )

# ---------- creeds ----------

    def get_creed_by_name(self, name: str) -> Creed | None:
        """Find a creed by name. Matches loosely (case-insensitive,
        ignores 'the ' prefix and apostrophes)."""
        self._ensure_loaded()

        clean_query = name.lower().replace("the ", "").replace("'", "").replace("'", "")
        for creed in self._creeds:
            clean_csv = (
                creed.name.lower()
                .replace("the ", "")
                .replace("'", "")
                .replace("'", "")
            )
            if clean_query in clean_csv or clean_csv in clean_query:
                return creed
        return None

    def get_creed_by_id(self, creed_id: int) -> Creed | None:
        """Find a creed by ID."""
        self._ensure_loaded()
        for creed in self._creeds:
            if creed.creed_id == creed_id:
                return creed
        return None

# Singleton — import this everywhere
@lru_cache(maxsize=1)
def get_repository() -> DataRepository:
    """Returns the shared DataRepository instance."""
    repo = DataRepository()
    repo.load_all()
    return repo