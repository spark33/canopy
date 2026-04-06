import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from app.services.sprint_orchestrator import AUTONOMY_THRESHOLDS, _force_checkpoint


def test_autonomy_thresholds():
    assert AUTONOMY_THRESHOLDS["supervised"] == 1.0
    assert AUTONOMY_THRESHOLDS["adaptive"] == 0.6
    assert AUTONOMY_THRESHOLDS["autonomous"] == 0.1


def test_force_checkpoint():
    decision = {
        "action": "delegate",
        "confidence": 0.3,
        "reasoning": "Low confidence test",
    }

    forced = _force_checkpoint(decision)
    assert forced["action"] == "ask_user"
    assert forced["checkpoint_type"] == "low_confidence"
    assert "options" in forced
    assert len(forced["options"]) == 3


def test_force_checkpoint_preserves_context():
    decision = {
        "action": "delegate",
        "confidence": 0.2,
        "reasoning": "Should delegate but confidence too low",
        "agent_type": "researcher",
    }

    forced = _force_checkpoint(decision)
    assert forced["context"]["original_decision"]["agent_type"] == "researcher"
