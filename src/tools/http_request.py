"""Async HTTP client tool."""

from __future__ import annotations

import json
from typing import Any, Dict, Optional

import httpx


async def http_request(
    url: str,
    method: str = "GET",
    payload: Optional[Dict[str, Any]] = None,
) -> str:
    """Make an HTTP GET or POST request to an external API or URL."""
    method_upper = method.upper()
    if method_upper not in ("GET", "POST"):
        return "Error: Unsupported HTTP method. Only GET and POST are allowed."

    async with httpx.AsyncClient() as client:
        try:
            if method_upper == "GET":
                response = await client.get(url, timeout=10.0)
            else:
                response = await client.post(url, json=payload, timeout=10.0)

            status = response.status_code
            try:
                body = response.json()
                body_str = json.dumps(body, ensure_ascii=False, indent=2)
            except ValueError:
                body_str = response.text[:1000]

            return f"Status: {status}\nResponse Body:\n{body_str}"
        except Exception as exc:
            return f"HTTP request failed: {exc}"
