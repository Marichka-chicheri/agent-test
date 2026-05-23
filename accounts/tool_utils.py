"""Validate agent tool selections against the runtime registry."""

from __future__ import annotations

import re

_APPROVAL_NOTE = "Requires human approval before execution."

# Fallback when tool declarations cannot be imported (e.g. local env import issues).
_FALLBACK_TOOLS: list[dict[str, str]] = [
    {
        "id": "web_search",
        "name": "web_search",
        "label": "Web search",
        "description": "Search the web for up-to-date information",
    },
    {
        "id": "http_request",
        "name": "http_request",
        "label": "HTTP request",
        "description": "Send HTTP GET or POST requests to external URLs",
    },
    {
        "id": "run_python",
        "name": "run_python",
        "label": "Run Python",
        "description": "Execute Python code and return stdout, stderr, and exit code",
    },
    {
        "id": "read_email_inbox",
        "name": "read_email_inbox",
        "label": "Read email inbox",
        "description": "Read messages from an IMAP inbox",
    },
    {
        "id": "read_document",
        "name": "read_document",
        "label": "Read document",
        "description": "Read PDF, DOCX, XLSX, TXT, and Markdown from disk",
    },
    {
        "id": "github_list_issues",
        "name": "github_list_issues",
        "label": "GitHub: list issues",
        "description": "List GitHub issues for a repository",
    },
    {
        "id": "github_create_issue",
        "name": "github_create_issue",
        "label": "GitHub: create issue",
        "description": "Create a new GitHub issue in a repository",
    },
]

_APPROVAL_RE = re.compile(re.escape(_APPROVAL_NOTE), re.IGNORECASE)


def _humanize_tool_name(name: str) -> str:
    return name.replace("_", " ").strip().title()


def _clean_description(text: str) -> str:
    cleaned = _APPROVAL_RE.sub("", text or "").strip()
    return cleaned.rstrip(".").strip()


def _catalog_from_declarations() -> list[dict[str, str]]:
    from tools import TOOL_DECLARATIONS

    catalog: list[dict[str, str]] = []
    for decl in TOOL_DECLARATIONS:
        name = (getattr(decl, "name", None) or "").strip()
        if not name:
            continue
        description = _clean_description(getattr(decl, "description", None) or "")
        catalog.append(
            {
                "id": name,
                "name": name,
                "label": _humanize_tool_name(name),
                "description": description,
            }
        )
    return sorted(catalog, key=lambda item: item["name"])


def get_known_tool_names() -> frozenset[str]:
    return frozenset(item["name"] for item in get_constructor_tools())


def get_constructor_tools() -> list[dict[str, str]]:
    try:
        catalog = _catalog_from_declarations()
        if catalog:
            return catalog
    except Exception:
        pass
    return list(_FALLBACK_TOOLS)


def get_constructor_tools_payload() -> dict[str, list[dict[str, str]]]:
    return {"tools": get_constructor_tools()}


def validate_tools_list(value) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError("tools must be a list of tool names.")

    cleaned: list[str] = []
    for item in value:
        name = str(item).strip()
        if not name:
            continue
        if name not in get_known_tool_names():
            allowed = ", ".join(sorted(get_known_tool_names()))
            raise ValueError(f"Unknown tool '{name}'. Allowed: {allowed}")
        if name not in cleaned:
            cleaned.append(name)

    return cleaned
