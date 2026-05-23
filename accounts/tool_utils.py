"""Validate agent tool selections against the runtime registry."""

from __future__ import annotations

KNOWN_TOOLS = frozenset(
    {
        "web_search",
        "http_request",
        "run_python",
        "read_email_inbox",
        "read_document",
        "github_list_issues",
        "github_create_issue",
    }
)

TOOL_LABELS = {
    "web_search": "Web search",
    "http_request": "HTTP request",
    "run_python": "Run Python",
    "read_email_inbox": "Read email inbox",
    "read_document": "Read document",
    "github_list_issues": "GitHub: list issues",
    "github_create_issue": "GitHub: create issue",
}


def get_constructor_tools() -> list[dict[str, str]]:
    return [
        {"name": name, "label": TOOL_LABELS.get(name, name)}
        for name in sorted(KNOWN_TOOLS)
    ]


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
        if name not in KNOWN_TOOLS:
            allowed = ", ".join(sorted(KNOWN_TOOLS))
            raise ValueError(f"Unknown tool '{name}'. Allowed: {allowed}")
        if name not in cleaned:
            cleaned.append(name)

    return cleaned
