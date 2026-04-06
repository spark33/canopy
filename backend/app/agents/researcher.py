from app.agents.base import BaseAgent
from app.agents.tools import SEARCH_TOOLS


class ResearcherAgent(BaseAgent):
    agent_type = "researcher"
    temperature = 0.3

    def _get_tools(self) -> list[dict]:
        return SEARCH_TOOLS
