"""Generate and verify REST API keys stored as SHA-256 hashes."""

from __future__ import annotations

import hashlib
import secrets


def generate_rest_api_key() -> str:
    """Return a new opaque API key (shown once to the user)."""
    return f"atk_{secrets.token_urlsafe(32)}"


def hash_rest_api_key(raw_key: str) -> str:
    """Hash a raw API key for database lookup."""
    return hashlib.sha256(raw_key.strip().encode("utf-8")).hexdigest()


def key_display_prefix(raw_key: str) -> str:
    """Short prefix stored for UI display (max 16 characters)."""
    return raw_key[:16]
