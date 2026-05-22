import os
import httpx
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent.parent
load_dotenv()
print(ROOT/".env")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")


async def web_search(query: str) -> dict:
    """
    Search the web for current information, news, and facts.
    """
    if not SERPER_API_KEY:
        return {"error": "Serper API key is missing."}

    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {"q": query, "num": 3}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)

            if response.status_code != 200:
                return {"error": f"Search failed: {response.status_code}"}

            data = response.json()

            results = []

            for item in data.get("organic", []):
                results.append({
                    "title": item.get("title"),
                    "snippet": item.get("snippet"),
                    "link": item.get("link")
                })

            return {"results": results}

        except Exception as e:
            return {"error": str(e)}