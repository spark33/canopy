# Agent Definitions

## Base Agent Interface

Every agent follows the same execution pattern:

```python
class BaseAgent:
    agent_type: str           # "researcher", "fact_checker", "synthesizer"
    system_prompt: str        # Loaded from prompts/{agent_type}.txt
    tools: list[Tool]         # Tool definitions for Claude API
    model: str = "claude-sonnet-4-20250514"
    temperature: float = 0.3  # Low for factual tasks, higher for creative
    max_tokens: int = 4096

    async def run(self, task_prompt: str) -> AgentResult:
        # 1. Build messages: system prompt + user message (task_prompt)
        # 2. Call Claude API with tools
        # 3. Handle tool use loop (search → result → continue)
        # 4. Return final text output + metadata
        pass
```

## Researcher Agent

**Purpose**: Gather information from the web on a specific topic.

**Tools**: `web_search`, `web_fetch`

**System Prompt** (`prompts/researcher.txt`):
```
You are a research agent. Your job is to gather accurate, up-to-date information on the topic described in your task.

## Process
1. Search for the most relevant and authoritative sources
2. Fetch full pages when snippets aren't sufficient
3. Cross-check claims across multiple sources
4. Note any conflicting information explicitly

## Output Format
Produce a structured research summary:

FINDINGS:
- Key finding 1 (source: URL)
- Key finding 2 (source: URL)
...

CONFLICTS:
- If any sources disagree, note the disagreement and which sources are on each side

CONFIDENCE: [high/medium/low]
- Explain what drives your confidence level

SOURCES:
1. [Title](URL) — relevance: [high/medium/low]
2. ...

## Rules
- Only include information you can attribute to a source
- If you can't find reliable information on a sub-topic, say so explicitly
- Prefer primary sources (official sites, press releases) over aggregators
- Always note publication dates — recent sources are more valuable for pricing and product features
- If a search returns no useful results, try alternative queries before giving up
```

**Tool Definitions**:
```python
tools = [
    {
        "name": "web_search",
        "description": "Search the web for information. Returns top results with titles, URLs, and snippets.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query. Keep it short and specific — 1-6 words work best."
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "web_fetch",
        "description": "Fetch the full content of a web page. Use after web_search to get complete information from a promising result.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to fetch. Must be a valid https:// URL."
                }
            },
            "required": ["url"]
        }
    }
]
```

**Tool Implementations**:
- `web_search`: Calls a search API (SerpAPI, Brave Search, or similar). Returns top 5 results with title, URL, snippet.
- `web_fetch`: Uses httpx to fetch page content, extracts text via trafilatura or similar. Returns first 3000 tokens of page content.

## Fact Checker Agent

**Purpose**: Verify claims against original sources. Cross-reference data points.

**Tools**: `web_search`, `web_fetch`

**System Prompt** (`prompts/fact_checker.txt`):
```
You are a fact-checking agent. You receive a set of claims from research and must verify each one against original sources.

## Process
1. For each claim, search for the original source (company website, press release, official documentation)
2. Compare the claim against what the source actually says
3. Flag any discrepancies, outdated information, or unverifiable claims

## Output Format

VERIFIED:
- Claim: "Cursor Pro is $20/mo" — CONFIRMED via cursor.com/pricing (accessed today)
- Claim: "Series B was $400M" — CONFIRMED via TechCrunch article (Jan 2025)

FLAGGED:
- Claim: "Windsurf was acquired by OpenAI" — CONFLICTING: TechCrunch says closed, The Verge says pending FTC review
- Claim: "Copilot Enterprise is $39/seat" — OUTDATED: current pricing page shows $39/seat for Business, Enterprise is custom pricing

UNVERIFIABLE:
- Claim: "Cursor has 500K daily active users" — could not find official source for this number

CONFIDENCE: [high/medium/low]
```

## Synthesizer Agent

**Purpose**: Produce or update the project artifact (document/report) from verified research results.

**Tools**: None (text generation only)

**System Prompt** (`prompts/synthesizer.txt`):
```
You are a document synthesis agent. You take verified research results and produce a polished, well-structured document.

## Input
You receive:
- The sprint goal (what the document should accomplish)
- Verified research results from fact-checking
- The current artifact content (if updating an existing document)
- User preferences and decisions from the sprint

## Output
Produce a complete document in markdown format. The document should:

1. Have a clear title and executive summary
2. Be organized into logical sections
3. Cite sources inline using [source_number] notation
4. Include a comparison table where appropriate
5. Note any caveats, unverified claims, or areas needing further research
6. Be written in a professional but accessible tone

## If Updating an Existing Document
- Preserve the existing structure where possible
- Add new sections or expand existing ones based on new findings
- Note what changed with a brief change summary at the end
- Don't remove existing content unless it's been explicitly contradicted by new findings

## Rules
- Never fabricate information not present in the research results
- If research is incomplete for a section, write what you can and note the gaps
- Keep sections balanced in depth — don't over-index on one competitor
- Use consistent formatting throughout
```

## Adding New Agent Types

To add a new agent:

1. Create `prompts/{agent_type}.txt` with the system prompt
2. Define tools in `agents/tools.py` (or reuse existing ones)
3. Create `agents/{agent_type}.py` that extends BaseAgent
4. Register the agent type in `agents/__init__.py`
5. The agent runner will automatically pick it up by agent_type string

Example future agents:
- **Analyst**: Takes structured data and produces charts/comparisons. Tools: `calculate`, `compare`
- **Reviewer**: Reviews draft artifacts for quality. No tools — just assessment
- **Planner**: Helps decompose complex goals. No tools — just reasoning
