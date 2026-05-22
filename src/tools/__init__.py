from typing import Dict, Any, Callable, Coroutine

from .web_search import web_search
from .http_request import http_request
from .run_python import run_python
from .calendar_events import create_calendar_event, get_calendar_events

TOOLS: Dict[str, Callable[..., Coroutine[Any, Any, str]]] = {
    "web_search": web_search,
    "http_request": http_request,
    "run_python": run_python,
    "create_calendar_event": create_calendar_event,
    "get_calendar_events": get_calendar_events
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
    },
    {
        "name": "create_calendar_event",
        "description": (
            "Schedule and create a new appointment, meeting, or event in the user's personal calendar. "
            "Use this tool whenever the user wants to book a time, set a reminder, or schedule a meeting."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "title": {
                    "type": "STRING",
                    "description": "The title of the event. Example: 'Sync with Team'"
                },
                "start_time": {
                    "type": "STRING",
                    "description": "The exact start date and time in STRICT format 'YYYY-MM-DD HH:MM'. Example: '2026-05-22 18:00'"
                },
                "duration_minutes": {
                    "type": "INTEGER",
                    "description": "The total duration of the event in minutes. Example: 60"
                },
                "description": {
                    "type": "STRING",
                    "description": "Optional notes, agenda, or meeting description."
                }
            },
            "required": ["title", "start_time", "duration_minutes"]
        }
    },
    {
        "name": "get_calendar_events",
        "description": "Retrieve the list of all scheduled events and meetings for a specific calendar day.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "date": {
                    "type": "STRING",
                    "description": "The target date to check in STRICT format 'YYYY-MM-DD'. Example: '2026-05-22'"
                }
            },
            "required": ["date"]
        }
    }
]