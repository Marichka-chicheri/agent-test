"""Validate and store chat attachment uploads."""

from __future__ import annotations

import re
import uuid
from pathlib import Path

from django.conf import settings

DEFAULT_EXTENSIONS = (
    ".txt",
    ".md",
    ".docx",
    ".xlsx",
    ".csv",
    ".pdf",
    ".json",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".html",
    ".css",
    ".yaml",
    ".yml",
    ".xml",
)

_SAFE_NAME = re.compile(r"[^a-zA-Z0-9._-]+")


def supported_extensions() -> tuple[str, ...]:
    configured = getattr(settings, "AGENT_SUPPORTED_EXTENSIONS", None)
    if configured:
        return tuple(ext if ext.startswith(".") else f".{ext}" for ext in configured)
    return DEFAULT_EXTENSIONS


def max_upload_bytes() -> int:
    return int(getattr(settings, "AGENT_UPLOAD_MAX_BYTES", 10 * 1024 * 1024))


def uploads_root() -> Path:
    root = Path(getattr(settings, "AGENT_UPLOAD_ROOT", settings.BASE_DIR / "uploads"))
    root.mkdir(parents=True, exist_ok=True)
    return root


def validate_upload(filename: str, size: int) -> str | None:
    name = (filename or "").strip()
    if not name:
        return "Filename is required."

    ext = Path(name).suffix.lower()
    if ext not in supported_extensions():
        allowed = ", ".join(sorted(supported_extensions()))
        return f"Unsupported file type '{ext or '(none)'}'. Allowed: {allowed}"

    if size <= 0:
        return "File is empty."

    if size > max_upload_bytes():
        limit_mb = max_upload_bytes() / (1024 * 1024)
        return f"File exceeds the {limit_mb:.0f} MB limit."

    return None


def safe_filename(original: str) -> str:
    stem = Path(original).stem[:80] or "file"
    ext = Path(original).suffix.lower()
    cleaned = _SAFE_NAME.sub("_", stem).strip("._") or "file"
    return f"{cleaned}_{uuid.uuid4().hex[:8]}{ext}"


def save_upload(user_id: int, uploaded_file) -> dict:
    error = validate_upload(uploaded_file.name, uploaded_file.size)
    if error:
        raise ValueError(error)

    user_dir = uploads_root() / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)

    filename = safe_filename(uploaded_file.name)
    dest = user_dir / filename

    with dest.open("wb") as out:
        for chunk in uploaded_file.chunks():
            out.write(chunk)

    return {
        "id": filename,
        "name": uploaded_file.name,
        "path": str(dest),
        "size": uploaded_file.size,
        "extension": dest.suffix.lower(),
    }
