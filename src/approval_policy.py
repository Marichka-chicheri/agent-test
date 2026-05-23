"""Which tool calls require human approval before execution."""

from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

READ_ONLY_TOOLS = frozenset(
    {
        "web_search",
        "read_document",
        "read_email_inbox",
        "github_list_issues",
    }
)

MUTATING_HTTP_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


def allowlist_key(tool_name: str) -> str:
    return (tool_name or "").strip()


def is_on_allowlist(
    tool_name: str,
    allowlist: Optional[Iterable[str]],
) -> bool:
    if not allowlist:
        return False
    key = allowlist_key(tool_name)
    return key in set(allowlist)


def requires_human_approval(tool_name: str, raw_args: Dict[str, Any]) -> bool:
    name = (tool_name or "").strip()
    if not name:
        return False

    if name in READ_ONLY_TOOLS:
        return False

    if name == "run_python":
        return True

    if name == "github_create_issue":
        return True

    if name == "http_request":
        method = str(raw_args.get("method") or "GET").upper()
        return method in MUTATING_HTTP_METHODS

    if name.startswith("github_"):
        return True

    return False
