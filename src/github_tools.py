"""Async GitHub REST API tools."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx
from google.genai import types

from approval_manager import APPROVAL_NOTE

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
GITHUB_API = "https://api.github.com"


def _auth_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


async def _github_request(
    method: str,
    path: str,
    *,
    json_body: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if not GITHUB_TOKEN:
        return {"success": False, "error": "GITHUB_TOKEN is not configured."}

    url = f"{GITHUB_API}{path}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method,
                url,
                headers=_auth_headers(),
                json=json_body,
                params=params,
                timeout=15.0,
            )
            if response.status_code >= 400:
                return {
                    "success": False,
                    "status": response.status_code,
                    "error": response.text[:500],
                }
            if response.status_code == 204:
                return {"success": True}
            return {"success": True, "data": response.json()}
        except Exception as exc:
            return {"success": False, "error": str(exc)}


async def github_list_issues(
    repo: str,
    state: str = "open",
    per_page: int = 10,
) -> Dict[str, Any]:
    """List issues for owner/repo (e.g. octocat/Hello-World)."""
    result = await _github_request(
        "GET",
        f"/repos/{repo}/issues",
        params={"state": state, "per_page": per_page},
    )
    if not result.get("success"):
        return result

    issues: List[Dict[str, Any]] = []
    for item in result.get("data") or []:
        if not isinstance(item, dict):
            continue
        issues.append(
            {
                "number": item.get("number"),
                "title": item.get("title"),
                "state": item.get("state"),
                "url": item.get("html_url"),
            }
        )
    return {"success": True, "count": len(issues), "issues": issues}


async def github_create_issue(
    repo: str,
    title: str,
    body: str = "",
) -> Dict[str, Any]:
    """Create a GitHub issue in owner/repo."""
    return await _github_request(
        "POST",
        f"/repos/{repo}/issues",
        json_body={"title": title, "body": body},
    )


GITHUB_TOOL_DECLARATIONS: List[types.FunctionDeclaration] = [
    types.FunctionDeclaration(
        name="github_list_issues",
        description=(
            "List GitHub issues for a repository (owner/repo). "
            f"{APPROVAL_NOTE}"
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "repo": types.Schema(
                    type=types.Type.STRING,
                    description="Repository in owner/name format",
                ),
                "state": types.Schema(
                    type=types.Type.STRING,
                    description="Issue state filter: open, closed, or all",
                ),
                "per_page": types.Schema(
                    type=types.Type.INTEGER,
                    description="Maximum issues to return (1-100)",
                ),
            },
            required=["repo"],
        ),
    ),
    types.FunctionDeclaration(
        name="github_create_issue",
        description=(
            "Create a new GitHub issue in a repository. "
            f"{APPROVAL_NOTE}"
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "repo": types.Schema(
                    type=types.Type.STRING,
                    description="Repository in owner/name format",
                ),
                "title": types.Schema(
                    type=types.Type.STRING,
                    description="Issue title",
                ),
                "body": types.Schema(
                    type=types.Type.STRING,
                    description="Issue body markdown",
                ),
            },
            required=["repo", "title"],
        ),
    ),
]
