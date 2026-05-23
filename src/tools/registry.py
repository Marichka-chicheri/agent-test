"""Filter tool declarations by agent-enabled tool names."""

from __future__ import annotations

from typing import FrozenSet, List, Optional, Set

from . import TOOL_DECLARATIONS, TOOLS


def resolve_allowed_tools(allowed_tools: Optional[List[str]]) -> Optional[FrozenSet[str]]:
    if not allowed_tools:
        return None

    names = {name.strip() for name in allowed_tools if str(name).strip()}
    valid = {name for name in names if name in TOOLS}
    return frozenset(valid) if valid else frozenset()


def declarations_for_tools(allowed: Optional[FrozenSet[str]]):
    if allowed is None:
        return TOOL_DECLARATIONS
    return [decl for decl in TOOL_DECLARATIONS if decl.name in allowed]
