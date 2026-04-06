from app.agents.base import BaseAgent
from app.agents.tools import SEARCH_TOOLS


class FactCheckerAgent(BaseAgent):
    agent_type = "fact_checker"
    temperature = 0.2

    def _get_tools(self) -> list[dict]:
        return SEARCH_TOOLS
