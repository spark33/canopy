from app.agents.base import BaseAgent
from app.agents.researcher import ResearcherAgent
from app.agents.fact_checker import FactCheckerAgent
from app.agents.synthesizer import SynthesizerAgent

_AGENTS: dict[str, type[BaseAgent]] = {
    "researcher": ResearcherAgent,
    "fact_checker": FactCheckerAgent,
    "synthesizer": SynthesizerAgent,
}


def get_agent(agent_type: str) -> BaseAgent:
    cls = _AGENTS.get(agent_type)
    if not cls:
        raise ValueError(f"Unknown agent type: {agent_type}")
    return cls()
