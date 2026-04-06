from app.agents.base import BaseAgent


class SynthesizerAgent(BaseAgent):
    agent_type = "synthesizer"
    temperature = 0.5
    max_tokens = 8192

    def _get_tools(self) -> list[dict]:
        return []  # Synthesizer has no tools
