from typing import Dict, Any, Callable, Coroutine

from .web_search import web_search
from .http_request import http_request
from .run_python import run_python


TOOLS: Dict[str, Callable[..., Coroutine[Any, Any, str]]] = {
    "web_search": web_search,
    "http_request": http_request,
    "run_python": run_python
}


TOOL_DECLARATIONS = [
    {
        "name": "web_search",
        "description": "Search the web for up-to-date information.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING"
                }
            },
            "required": ["query"]
        }
    },

    {
        "name": "http_request",
        "description": "Send HTTP requests.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "url": {
                    "type": "STRING"
                },
                "method": {
                    "type": "STRING",
                    "enum": ["GET", "POST"]
                },
                "payload": {
                    "type": "OBJECT"
                }
            },
            "required": ["url", "method"]
        }
    },

    {
        "name": "run_python",
        "description":
        "Execute Python code and return stdout stderr and exit code.",

        "parameters": {
            "type": "OBJECT",
            "properties": {
                "code": {
                    "type": "STRING"
                }
            },
            "required": ["code"]
        }
    }
]