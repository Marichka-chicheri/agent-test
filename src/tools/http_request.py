import httpx
import json
from typing import Dict, Any, Optional


async def http_request(url: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> str:
    """
    Make an HTTP async request (GET or POST) to an external API or URL.
    """
    method = method.upper()
    if method not in ["GET", "POST"]:
        return "Error: Unsupported HTTP method. Only GET and POST are allowed."

    async with httpx.AsyncClient() as client:
        try:
            if method == "GET":
                response = await client.get(url, timeout=10.0)
            else:  # POST
                response = await client.post(url, json=payload, timeout=10.0)

            # Форматуємо результат
            status = response.status_code
            try:
                # Намагаємось розпарсити як JSON, щоб відповідь була чистішою
                body = response.json()
                body_str = json.dumps(body, ensure_ascii=False, indent=2)
            except ValueError:
                body_str = response.text[:1000]  # Обмежуємо довжину тексту, якщо там HTML

            return f"Status: {status}\nResponse Body:\n{body_str}"

        except Exception as e:
            return f"HTTP request failed: {str(e)}"