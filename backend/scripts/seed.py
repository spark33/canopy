"""Seed the database with a demo project for showcasing the app."""
import asyncio
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, async_session
from app.models import (
    Base, Project, Sprint, Task, TraceEvent, Checkpoint,
    Artifact, ArtifactVersion, Source,
)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        now = datetime.now(timezone.utc)

        # Create project
        project = Project(
            id=str(uuid.uuid4()),
            name="AI Code Editor Landscape",
            description="Competitive analysis of Cursor, Windsurf, and GitHub Copilot — covering pricing, product differentiation, and market positioning.",
            status="active",
            autonomy_mode="adaptive",
            roadmap={
                "current_focus": "Initial competitive research",
                "estimated_sprints": 2,
                "planned_sprints": [
                    {"number": 1, "goal": "Gather baseline data on all three competitors", "focus_areas": ["pricing", "features", "funding"]},
                    {"number": 2, "goal": "Deep dive on differentiators and user sentiment", "focus_areas": ["enterprise features", "developer experience"]},
                ],
                "known_gaps": [],
                "success_criteria": "Comprehensive competitive briefing with pricing comparison and market positioning analysis",
            },
        )
        db.add(project)
        await db.flush()

        # Sprint 1 — completed
        sprint = Sprint(
            id=str(uuid.uuid4()),
            project_id=project.id,
            sprint_number=1,
            goal="Research pricing, core features, and recent funding for Cursor, Windsurf, and GitHub Copilot",
            status="completed",
            autonomy_mode="adaptive",
            plan=[
                {"step_number": 1, "title": "Research Cursor", "agent_type": "researcher", "status": "completed"},
                {"step_number": 2, "title": "Research Windsurf", "agent_type": "researcher", "status": "completed"},
                {"step_number": 3, "title": "Resolve data conflict", "agent_type": None, "status": "completed"},
                {"step_number": 4, "title": "Research GitHub Copilot", "agent_type": "researcher", "status": "completed"},
                {"step_number": 5, "title": "Cross-reference pricing", "agent_type": "fact_checker", "status": "completed"},
                {"step_number": 6, "title": "Synthesize briefing", "agent_type": "synthesizer", "status": "completed"},
            ],
            orchestrator_state={"cycle_count": 8, "current_confidence": 0.92},
            total_tokens=12840,
            total_cost_cents=8,
            started_at=now - timedelta(minutes=15),
            completed_at=now - timedelta(minutes=3),
            created_at=now - timedelta(minutes=15),
        )
        db.add(sprint)
        await db.flush()

        # Task 1: Research Cursor
        t1 = Task(
            id=str(uuid.uuid4()),
            sprint_id=sprint.id,
            agent_type="researcher",
            title="Research Cursor",
            status="completed",
            output="FINDINGS:\n- Cursor Pro is $20/mo, Business $40/seat/mo (source: cursor.com/pricing)\n- Series B raised $400M at $2.5B valuation in Jan 2025 (source: TechCrunch)\n- Key differentiator: tab-based inline completions and multi-file editing with full codebase context\n- Built as a fork of VS Code with deep AI integration\n\nCONFIDENCE: high\n\nSOURCES:\n1. Cursor Official Site - cursor.com\n2. Cursor Pricing - cursor.com/pricing\n3. TechCrunch: Anysphere Series B - techcrunch.com\n4. Cursor Changelog - cursor.com/changelog",
            confidence=0.9,
            tokens_used=1240,
            duration_ms=38000,
            created_at=now - timedelta(minutes=13),
        )
        db.add(t1)
        await db.flush()

        for i, (url, title) in enumerate([
            ("https://cursor.com", "Cursor Official Site"),
            ("https://cursor.com/pricing", "Cursor Pricing"),
            ("https://techcrunch.com/anysphere-series-b", "Anysphere Series B"),
            ("https://cursor.com/changelog", "Cursor Changelog"),
        ]):
            db.add(Source(task_id=t1.id, url=url, title=title, source_type="webpage", relevance_score=0.9))

        # Task 2: Research Windsurf
        t2 = Task(
            id=str(uuid.uuid4()),
            sprint_id=sprint.id,
            agent_type="researcher",
            title="Research Windsurf",
            status="completed",
            output="FINDINGS:\n- Free tier available, Pro $15/mo (source: windsurf.com/pricing)\n- Parent company is Codeium\n- Differentiator is 'Cascade' multi-file editing flow\n\nCONFLICTS:\n- TechCrunch (Mar 15) reports OpenAI completed $3B acquisition of Codeium\n- The Verge (Mar 28) says the deal is still under FTC review\n\nCONFIDENCE: medium\n\nSOURCES:\n1. Windsurf Pricing - windsurf.com/pricing\n2. Windsurf Docs - docs.windsurf.com\n3. TechCrunch - techcrunch.com",
            confidence=0.6,
            tokens_used=980,
            duration_ms=42000,
            created_at=now - timedelta(minutes=12),
        )
        db.add(t2)
        await db.flush()

        for url, title in [
            ("https://windsurf.com/pricing", "Windsurf Pricing"),
            ("https://docs.windsurf.com", "Windsurf Documentation"),
            ("https://techcrunch.com/codeium-acquisition", "TechCrunch: Codeium"),
        ]:
            db.add(Source(task_id=t2.id, url=url, title=title, source_type="webpage", relevance_score=0.85))

        # Checkpoint — resolved
        cp = Checkpoint(
            id=str(uuid.uuid4()),
            sprint_id=sprint.id,
            task_id=t2.id,
            checkpoint_type="data_conflict",
            title="Conflicting acquisition data for Windsurf/Codeium",
            description="Two credible sources disagree on whether OpenAI's $3B acquisition of Codeium has closed or is still pending FTC review.",
            options=[
                {"id": "use_acquired", "label": "Use 'acquired' framing", "primary": True},
                {"id": "mark_unconfirmed", "label": "Mark as unconfirmed"},
                {"id": "research_deeper", "label": "Research deeper"},
            ],
            resolution="mark_unconfirmed",
            user_input="The Verge article is more recent, let's be cautious",
            status="resolved",
            surfaced_at=now - timedelta(minutes=10),
            resolved_at=now - timedelta(minutes=8),
        )
        db.add(cp)

        # Task 3: Research Copilot
        t3 = Task(
            id=str(uuid.uuid4()),
            sprint_id=sprint.id,
            agent_type="researcher",
            title="Research GitHub Copilot",
            status="completed",
            output="FINDINGS:\n- Individual: $10/mo or $100/yr. Business: $19/user/mo. Enterprise: $39/user/mo (source: github.com/features/copilot)\n- Integrated into VS Code, JetBrains, Neovim, and GitHub.com\n- Powered by OpenAI Codex models\n- Recently added Copilot Workspace for multi-file editing\n\nCONFIDENCE: high\n\nSOURCES:\n1. GitHub Copilot - github.com/features/copilot\n2. GitHub Blog - github.blog",
            confidence=0.88,
            tokens_used=1100,
            duration_ms=35000,
            created_at=now - timedelta(minutes=11),
        )
        db.add(t3)
        await db.flush()

        for url, title in [
            ("https://github.com/features/copilot", "GitHub Copilot"),
            ("https://github.blog", "GitHub Blog"),
        ]:
            db.add(Source(task_id=t3.id, url=url, title=title, source_type="webpage", relevance_score=0.9))

        # Task 4: Fact checker
        t4 = Task(
            id=str(uuid.uuid4()),
            sprint_id=sprint.id,
            agent_type="fact_checker",
            title="Cross-reference pricing data",
            status="completed",
            output="VERIFIED:\n- Cursor Pro $20/mo — CONFIRMED via cursor.com/pricing\n- Cursor Series B $400M — CONFIRMED via TechCrunch\n- Windsurf Pro $15/mo — CONFIRMED via windsurf.com/pricing\n- Copilot Individual $10/mo — CONFIRMED via github.com\n- Copilot Enterprise $39/user/mo — CONFIRMED via github.com\n\nFLAGGED:\n- Windsurf/Codeium acquisition status — UNRESOLVED per user decision (marked unconfirmed)\n\nCONFIDENCE: high",
            confidence=0.92,
            tokens_used=890,
            duration_ms=28000,
            created_at=now - timedelta(minutes=7),
        )
        db.add(t4)

        # Task 5: Synthesizer
        t5 = Task(
            id=str(uuid.uuid4()),
            sprint_id=sprint.id,
            agent_type="synthesizer",
            title="Synthesize competitive analysis briefing",
            status="completed",
            output=ARTIFACT_CONTENT,
            confidence=0.9,
            tokens_used=2200,
            duration_ms=25000,
            created_at=now - timedelta(minutes=5),
        )
        db.add(t5)

        # Artifact
        artifact = Artifact(
            id=str(uuid.uuid4()),
            project_id=project.id,
            content_type="markdown",
            title="AI Code Editor Landscape: Competitive Analysis",
            content=ARTIFACT_CONTENT,
            sections=[
                {"id": "cursor", "title": "Cursor", "status": "complete"},
                {"id": "windsurf", "title": "Windsurf", "status": "complete"},
                {"id": "copilot", "title": "GitHub Copilot", "status": "complete"},
                {"id": "comparison", "title": "Comparative Summary", "status": "complete"},
            ],
            version=1,
        )
        db.add(artifact)
        await db.flush()

        av = ArtifactVersion(
            artifact_id=artifact.id,
            sprint_id=sprint.id,
            version=1,
            content=ARTIFACT_CONTENT,
            change_summary="Initial competitive analysis from Sprint 1",
        )
        db.add(av)

        # Trace events
        events = [
            ("sprint_started", "system", None, {}),
            ("plan_created", "orchestrator", None, {"plan": sprint.plan}),
            ("task_started", "system", t1.id, {"agent_type": "researcher", "title": "Research Cursor"}),
            ("task_started", "system", t2.id, {"agent_type": "researcher", "title": "Research Windsurf"}),
            ("task_completed", "agent", t1.id, {"confidence": 0.9, "sources_count": 4}),
            ("task_completed", "agent", t2.id, {"confidence": 0.6, "sources_count": 3}),
            ("orchestrator_decision", "orchestrator", None, {"action": "ask_user", "confidence": 0.3, "reasoning": "Conflicting data on Windsurf acquisition"}),
            ("checkpoint_surfaced", "orchestrator", t2.id, {"checkpoint_id": cp.id, "type": "data_conflict"}),
            ("checkpoint_resolved", "user", None, {"resolution": "mark_unconfirmed"}),
            ("task_started", "system", t3.id, {"agent_type": "researcher", "title": "Research GitHub Copilot"}),
            ("task_completed", "agent", t3.id, {"confidence": 0.88}),
            ("task_started", "system", t4.id, {"agent_type": "fact_checker", "title": "Cross-reference pricing"}),
            ("task_completed", "agent", t4.id, {"confidence": 0.92}),
            ("orchestrator_decision", "orchestrator", None, {"action": "synthesize", "confidence": 0.9}),
            ("task_started", "system", t5.id, {"agent_type": "synthesizer"}),
            ("task_completed", "agent", t5.id, {"confidence": 0.9}),
            ("artifact_updated", "system", None, {"version": 1}),
            ("sprint_completed", "system", None, {"summary": "Completed competitive analysis"}),
        ]

        for i, (etype, stype, tid, payload) in enumerate(events):
            db.add(TraceEvent(
                sprint_id=sprint.id,
                task_id=tid,
                event_type=etype,
                source_type=stype,
                payload=payload,
                created_at=now - timedelta(minutes=14) + timedelta(seconds=i * 50),
            ))

        await db.commit()
        print(f"Seeded project: {project.id}")
        print(f"Seeded sprint: {sprint.id}")
        print(f"View at: http://localhost:3000/projects/{project.id}")


ARTIFACT_CONTENT = """# AI Code Editor Landscape: Competitive Analysis

A comparative briefing on Cursor, Windsurf, and GitHub Copilot — covering pricing, product differentiation, and market positioning.

## 1. Cursor

Cursor has emerged as the leading AI-native code editor, built as a fork of VS Code with deep AI integration throughout the editing experience. [1] The product offers two paid tiers: Pro at $20/month for individual developers and Business at $40/seat/month for teams, both including unlimited AI completions and access to multiple foundation models. [2]

In January 2025, Cursor's parent company Anysphere raised a $400M Series B at a $2.5B valuation, making it one of the most highly-valued developer tools startups. [3] The company's key differentiator is its tab-based inline completion system and multi-file editing capability that leverages full codebase context. [4]

## 2. Windsurf

Windsurf, developed by Codeium, positions itself as a more accessible alternative with a free tier and Pro pricing at $15/month. [5] Its primary differentiator is "Cascade," a multi-file editing flow that allows developers to describe changes in natural language and have the AI apply them across an entire codebase. [6]

**Note:** The acquisition status of Codeium by OpenAI ($3B reported) is currently unconfirmed. A TechCrunch article (Mar 15) reports the acquisition closed, while a more recent Verge article (Mar 28) states the deal is still under FTC review. This analysis treats the acquisition as unconfirmed pending further clarity.

## 3. GitHub Copilot

GitHub Copilot remains the most widely-adopted AI coding assistant, with deep integration across VS Code, JetBrains, Neovim, and GitHub.com itself. Pricing is tiered: Individual at $10/month (or $100/year), Business at $19/user/month, and Enterprise at $39/user/month. [7]

Copilot recently expanded beyond inline completions with Copilot Workspace, a multi-file editing experience, and Copilot Chat for conversational coding assistance. Its key advantage is platform integration — being native to GitHub means it has access to repository context, issues, and pull requests. [8]

## 4. Comparative Summary

| | Cursor | Windsurf | Copilot |
|---|---|---|---|
| **Price (Pro)** | $20/mo | $15/mo | $10/mo |
| **Free tier** | Limited | Yes | No |
| **Differentiator** | Tab completions + multi-file | Cascade flow | GitHub integration |
| **Funding** | $400M / $2.5B | Unconfirmed acquisition | Microsoft/GitHub |
| **Editor base** | VS Code fork | Standalone | VS Code extension |
| **Enterprise** | $40/seat/mo | Custom | $39/user/mo |

### Key Takeaways

- **Cursor** leads in valuation and developer mindshare for AI-native editing
- **Windsurf** competes on price and accessibility with a free tier
- **Copilot** has the largest installed base due to GitHub integration
- The market is converging on multi-file editing as the next frontier
"""


if __name__ == "__main__":
    asyncio.run(seed())
