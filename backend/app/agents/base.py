import time
from dataclasses import dataclass, field
from pathlib import Path

import structlog
from anthropic import AsyncAnthropic

from app.config import settings

log = structlog.get_logger()

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


@dataclass
class AgentResult:
    output: str
    confidence: float = 0.5
    tokens_used: int = 0
    duration_ms: int = 0
    sources: list[dict] = field(default_factory=list)
    tool_calls: list[dict] = field(default_factory=list)


class BaseAgent:
    agent_type: str = "base"
    model: str = "claude-sonnet-4-20250514"
    temperature: float = 0.3
    max_tokens: int = 4096

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.system_prompt = self._load_prompt()
        self.tools = self._get_tools()

    def _load_prompt(self) -> str:
        prompt_file = PROMPTS_DIR / f"{self.agent_type}.txt"
        if prompt_file.exists():
            return prompt_file.read_text()
        return f"You are a {self.agent_type} agent."

    def _get_tools(self) -> list[dict]:
        return []

    async def run(self, task_prompt: str, sprint_id: str | None = None, task_id: str | None = None) -> AgentResult:
        start_time = time.time()
        total_tokens = 0
        sources: list[dict] = []
        tool_calls_log: list[dict] = []

        messages = [{"role": "user", "content": task_prompt}]

        try:
            while True:
                kwargs = {
                    "model": self.model,
                    "max_tokens": self.max_tokens,
                    "temperature": self.temperature,
                    "system": self.system_prompt,
                    "messages": messages,
                }
                if self.tools:
                    kwargs["tools"] = self.tools

                response = await self.client.messages.create(**kwargs)
                total_tokens += response.usage.input_tokens + response.usage.output_tokens

                # Check if response contains tool use
                has_tool_use = any(block.type == "tool_use" for block in response.content)

                if response.stop_reason == "tool_use" or has_tool_use:
                    # Process tool calls
                    tool_results = []
                    for block in response.content:
                        if block.type == "tool_use":
                            tool_name = block.name
                            tool_input = block.input

                            tool_calls_log.append({"tool": tool_name, "input": tool_input})

                            if sprint_id:
                                from app.services.trace_service import log_event

                                await log_event(
                                    sprint_id=sprint_id,
                                    event_type="tool_call",
                                    source_type="agent",
                                    task_id=task_id,
                                    payload={"tool_name": tool_name, "arguments": tool_input, "agent_type": self.agent_type},
                                )

                            result = await self._execute_tool(tool_name, tool_input)

                            if tool_name == "web_search" and isinstance(result, list):
                                for r in result:
                                    if isinstance(r, dict) and "url" in r:
                                        sources.append(r)

                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": str(result),
                            })

                            if sprint_id:
                                await log_event(
                                    sprint_id=sprint_id,
                                    event_type="tool_result",
                                    source_type="tool",
                                    task_id=task_id,
                                    payload={"tool_name": tool_name, "result_preview": str(result)[:500]},
                                )

                    messages.append({"role": "assistant", "content": response.content})
                    messages.append({"role": "user", "content": tool_results})
                else:
                    # Final response
                    output_text = ""
                    for block in response.content:
                        if block.type == "text":
                            output_text += block.text

                    confidence = self._extract_confidence(output_text)
                    duration_ms = int((time.time() - start_time) * 1000)

                    return AgentResult(
                        output=output_text,
                        confidence=confidence,
                        tokens_used=total_tokens,
                        duration_ms=duration_ms,
                        sources=sources,
                        tool_calls=tool_calls_log,
                    )

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            log.error("Agent execution failed", agent_type=self.agent_type, error=str(e))
            raise

    async def _execute_tool(self, tool_name: str, tool_input: dict) -> str | list:
        from app.agents.tools import execute_tool

        return await execute_tool(tool_name, tool_input)

    def _extract_confidence(self, text: str) -> float:
        text_lower = text.lower()
        if "confidence: high" in text_lower:
            return 0.9
        elif "confidence: medium" in text_lower:
            return 0.6
        elif "confidence: low" in text_lower:
            return 0.3
        return 0.5
