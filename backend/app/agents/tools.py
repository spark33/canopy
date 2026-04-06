import re

import httpx
import structlog
from bs4 import BeautifulSoup

from app.config import settings

log = structlog.get_logger()

SEARCH_TOOLS = [
    {
        "name": "web_search",
        "description": "Search the web for information. Returns top results with titles, URLs, and snippets.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query. Keep it short and specific.",
                }
            },
            "required": ["query"],
        },
    },
    {
        "name": "web_fetch",
        "description": "Fetch the full content of a web page. Use after web_search to get complete information.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to fetch. Must be a valid https:// URL.",
                }
            },
            "required": ["url"],
        },
    },
]


async def execute_tool(tool_name: str, tool_input: dict) -> str | list:
    if tool_name == "web_search":
        return await web_search(tool_input["query"])
    elif tool_name == "web_fetch":
        return await web_fetch(tool_input["url"])
    else:
        return f"Unknown tool: {tool_name}"


async def web_search(query: str) -> list[dict] | str:
    """Search the web using Brave Search API, or return mock results if no API key."""
    if not settings.BRAVE_SEARCH_API_KEY:
        return _mock_search(query)

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": query, "count": 5},
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": settings.BRAVE_SEARCH_API_KEY,
                },
            )
            resp.raise_for_status()
            data = resp.json()

            results = []
            for item in data.get("web", {}).get("results", [])[:5]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("description", ""),
                })
            return results
    except Exception as e:
        log.error("Web search failed", query=query, error=str(e))
        return f"Search failed: {e}"


async def web_fetch(url: str) -> str:
    """Fetch a web page and extract text content."""
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "AgentOps/1.0"})
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove script and style elements
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)
            # Collapse whitespace
            text = re.sub(r"\n{3,}", "\n\n", text)

            # Truncate to ~3000 tokens (~12000 chars)
            if len(text) > 12000:
                text = text[:12000] + "\n\n[Content truncated]"

            return text
    except Exception as e:
        log.error("Web fetch failed", url=url, error=str(e))
        return f"Failed to fetch {url}: {e}"


def _mock_search(query: str) -> list[dict]:
    """Return mock search results for demo/testing."""
    return [
        {
            "title": f"Result 1 for: {query}",
            "url": f"https://example.com/result1?q={query.replace(' ', '+')}",
            "snippet": f"This is a mock search result for '{query}'. Configure BRAVE_SEARCH_API_KEY for real results.",
        },
        {
            "title": f"Result 2 for: {query}",
            "url": f"https://example.com/result2?q={query.replace(' ', '+')}",
            "snippet": f"Another mock result for '{query}'. Set up the Brave Search API for production use.",
        },
    ]
