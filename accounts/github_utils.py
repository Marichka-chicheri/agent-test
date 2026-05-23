"""Validate GitHub personal access tokens."""

from __future__ import annotations

import re

import httpx

_GITHUB_TOKEN_RE = re.compile(
    r"^(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})$"
)


def validate_github_token_format(token: str) -> str | None:
    value = (token or "").strip()
    if not value:
        return "GitHub token is required."
    if not _GITHUB_TOKEN_RE.match(value):
        return "Invalid token format. Use a GitHub personal access token (ghp_… or github_pat_…)."
    return None


def test_github_token(token: str) -> tuple[bool, str]:
    format_error = validate_github_token_format(token)
    if format_error:
        return False, format_error

    try:
        response = httpx.get(
            "https://api.github.com/user",
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {token.strip()}",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            timeout=15.0,
        )
    except Exception as exc:
        return False, str(exc)

    if response.status_code == 200:
        login = (response.json() or {}).get("login", "user")
        return True, f"Connected as {login}"

    if response.status_code == 401:
        return False, "Invalid or expired token."

    return False, f"GitHub API error ({response.status_code})."
