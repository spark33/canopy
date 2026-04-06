import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from app.agents import get_agent
from app.agents.base import AgentResult


def test_get_agent():
    agent = get_agent("researcher")
    assert agent.agent_type == "researcher"

    agent = get_agent("fact_checker")
    assert agent.agent_type == "fact_checker"

    agent = get_agent("synthesizer")
    assert agent.agent_type == "synthesizer"

    with pytest.raises(ValueError):
        get_agent("unknown_agent")


def test_researcher_has_tools():
    agent = get_agent("researcher")
    assert len(agent.tools) == 2
    tool_names = [t["name"] for t in agent.tools]
    assert "web_search" in tool_names
    assert "web_fetch" in tool_names


def test_synthesizer_has_no_tools():
    agent = get_agent("synthesizer")
    assert len(agent.tools) == 0


def test_agent_loads_prompt():
    agent = get_agent("researcher")
    assert "research agent" in agent.system_prompt.lower()


@pytest.mark.asyncio
async def test_agent_run():
    agent = get_agent("researcher")

    mock_response = MagicMock()
    mock_response.content = [MagicMock(type="text", text="FINDINGS:\n- Test finding\n\nCONFIDENCE: high")]
    mock_response.stop_reason = "end_turn"
    mock_response.usage = MagicMock(input_tokens=100, output_tokens=50)

    with patch.object(agent.client.messages, "create", new_callable=AsyncMock, return_value=mock_response):
        result = await agent.run("Research test topic")

    assert isinstance(result, AgentResult)
    assert "Test finding" in result.output
    assert result.confidence == 0.9  # "high" maps to 0.9
    assert result.tokens_used == 150
