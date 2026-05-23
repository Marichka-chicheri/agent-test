"""Backward-compatible re-exports; implementation lives in email_tools."""

from __future__ import annotations

from email_tools import EMAIL_TOOL_DECLARATIONS, read_email_inbox

TOOLS = {"read_email_inbox": read_email_inbox}
TOOL_DECLARATIONS = EMAIL_TOOL_DECLARATIONS

__all__ = ["read_email_inbox", "TOOLS", "TOOL_DECLARATIONS"]
