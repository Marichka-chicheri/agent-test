from typing import Dict, Any, Callable, Coroutine
from .web_search import web_search
from .http_request import http_request

# Словник з посиланнями на асинхронні функції для Executor-а (Пункт 14 плану)
TOOLS: Dict[str, Callable[..., Coroutine[Any, Any, str]]] = {
    "web_search": web_search,
    "http_request": http_request
}

# Опис інструментів для Gemini API (Пункт 10 плану)
TOOL_DEFINITIONS = [
    {
        "function_declarations": [
            {
                "name": "web_search",
                "description": "Search the web for up-to-date information, news, weather, and real-time facts.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "query": {
                            "type": "STRING",
                            "description": "The search query to look up in Google."
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "http_request",
                "description": "Send asynchronous HTTP requests to external services, databases, or public APIs.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "url": {
                            "type": "STRING",
                            "description": "The full target URL (e.g., https://api.weather.com/v1/...)"
                        },
                        "method": {
                            "type": "STRING",
                            "description": "The HTTP method: GET or POST.",
                            "enum": ["GET", "POST"]
                        },
                        "payload": {
                            "type": "OBJECT",
                            "description": "Optional JSON body dictionary for POST requests."
                        }
                    },
                    "required": ["url", "method"]
                }
            }
        ]
    }
]