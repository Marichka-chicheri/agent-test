import os
import httpx
from typing import Dict, Any

SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")


async def web_search(query: str) -> str:
    """
    Search the web for current information, news, and facts.
    """
    if not SERPER_API_KEY:
        return "Error: Serper API key is missing."

    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {"q": query, "num": 3}  # Беремо топ-3 результати, щоб не роздувати контекст

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if response.status_code != 200:
                return f"Search failed with status code {response.status_code}"

            data = response.json()
            results = []

            # Парсимо органічну видачу Google
            for item in data.get("organic", []):
                results.append(f"Title: {item.get('title')}\nSnippet: {item.get('snippet')}\n---")

            return "\n".join(results) if results else "No relevant results found."

        except Exception as e:
            return f"Error executing web search: {str(e)}"