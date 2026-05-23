"""Central tool registry and Gemini function declarations."""

from __future__ import annotations

from typing import Any, Callable, Coroutine, Dict, List, Union

from google.genai import types

from approval_manager import APPROVAL_NOTE
from email_tools import EMAIL_TOOL_DECLARATIONS, read_email_inbox
from github_tools import (
    GITHUB_TOOL_DECLARATIONS,
    github_create_issue,
    github_list_issues,
)

from .http_request import http_request
from .read_document import read_document
from .run_python import run_python
from .web_search import web_search

ToolCallable = Callable[..., Coroutine[Any, Any, Any]]
ToolResult = Union[str, Dict[str, Any]]

TOOLS: Dict[str, ToolCallable] = {
    "web_search": web_search,
    "http_request": http_request,
    "run_python": run_python,
    "read_email_inbox": read_email_inbox,
    "read_document": read_document,
    "github_list_issues": github_list_issues,
    "github_create_issue": github_create_issue,
}


def _decl(
    name: str,
    description: str,
    *,
    properties: Dict[str, types.Schema],
    required: List[str],
) -> types.FunctionDeclaration:
    if APPROVAL_NOTE not in description:
        description = f"{description.rstrip('.')}. {APPROVAL_NOTE}"
    return types.FunctionDeclaration(
        name=name,
        description=description,
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties=properties,
            required=required,
        ),
    )


TOOL_DECLARATIONS: List[types.FunctionDeclaration] = [
    _decl(
        "web_search",
        "Search the web for up-to-date information",
        properties={
            "query": types.Schema(type=types.Type.STRING),
        },
        required=["query"],
    ),
    _decl(
        "http_request",
        "Send HTTP GET or POST requests to external URLs",
        properties={
            "url": types.Schema(type=types.Type.STRING),
            "method": types.Schema(
                type=types.Type.STRING,
                description="HTTP method",
            ),
            "payload": types.Schema(
                type=types.Type.OBJECT,
                description="JSON body for POST requests",
            ),
        },
        required=["url", "method"],
    ),
    _decl(
        "run_python",
        "Execute Python code and return stdout, stderr, and exit code",
        properties={
            "code": types.Schema(type=types.Type.STRING),
        },
        required=["code"],
    ),
    _decl(
        "read_document",
        (
            "Read documents including PDF, DOCX, XLSX, TXT, and Markdown "
            "from a local file path"
        ),
        properties={
            "path": types.Schema(
                type=types.Type.STRING,
                description="Absolute or relative file path",
            ),
            "max_chars": types.Schema(
                type=types.Type.INTEGER,
                description="Maximum returned characters",
            ),
        },
        required=["path"],
    ),
    *EMAIL_TOOL_DECLARATIONS,
    *GITHUB_TOOL_DECLARATIONS,
]
