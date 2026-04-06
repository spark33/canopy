import pytest
from sqlalchemy import select

from app.models import Project, Sprint, Task, TraceEvent, Checkpoint, Artifact, Source


@pytest.mark.asyncio
async def test_create_project(db):
    project = Project(name="Test Project", description="A test project", autonomy_mode="adaptive")
    db.add(project)
    await db.commit()

    result = await db.execute(select(Project).where(Project.name == "Test Project"))
    p = result.scalar_one()
    assert p.name == "Test Project"
    assert p.status == "active"
    assert p.autonomy_mode == "adaptive"
    assert p.id is not None


@pytest.mark.asyncio
async def test_project_sprint_relationship(db):
    project = Project(name="Test", description="test")
    db.add(project)
    await db.flush()

    sprint = Sprint(project_id=project.id, sprint_number=1, goal="Test goal")
    db.add(sprint)
    await db.commit()

    result = await db.execute(select(Sprint).where(Sprint.project_id == project.id))
    s = result.scalar_one()
    assert s.goal == "Test goal"
    assert s.sprint_number == 1
    assert s.status == "planning"


@pytest.mark.asyncio
async def test_task_with_sources(db):
    project = Project(name="P", description="")
    db.add(project)
    await db.flush()

    sprint = Sprint(project_id=project.id, sprint_number=1, goal="G")
    db.add(sprint)
    await db.flush()

    task = Task(sprint_id=sprint.id, agent_type="researcher", title="Research X")
    db.add(task)
    await db.flush()

    source = Source(task_id=task.id, url="https://example.com", title="Example", source_type="webpage")
    db.add(source)
    await db.commit()

    result = await db.execute(select(Source).where(Source.task_id == task.id))
    s = result.scalar_one()
    assert s.url == "https://example.com"


@pytest.mark.asyncio
async def test_trace_event(db):
    project = Project(name="P", description="")
    db.add(project)
    await db.flush()

    sprint = Sprint(project_id=project.id, sprint_number=1, goal="G")
    db.add(sprint)
    await db.flush()

    event = TraceEvent(
        sprint_id=sprint.id,
        event_type="task_started",
        source_type="system",
        payload={"task_id": "abc"},
    )
    db.add(event)
    await db.commit()

    result = await db.execute(select(TraceEvent).where(TraceEvent.sprint_id == sprint.id))
    e = result.scalar_one()
    assert e.event_type == "task_started"
    assert e.payload["task_id"] == "abc"


@pytest.mark.asyncio
async def test_checkpoint(db):
    project = Project(name="P", description="")
    db.add(project)
    await db.flush()

    sprint = Sprint(project_id=project.id, sprint_number=1, goal="G")
    db.add(sprint)
    await db.flush()

    cp = Checkpoint(
        sprint_id=sprint.id,
        checkpoint_type="data_conflict",
        title="Conflict found",
        description="Two sources disagree",
        options=[{"id": "a", "label": "Option A"}, {"id": "b", "label": "Option B"}],
    )
    db.add(cp)
    await db.commit()

    result = await db.execute(select(Checkpoint).where(Checkpoint.sprint_id == sprint.id))
    c = result.scalar_one()
    assert c.checkpoint_type == "data_conflict"
    assert len(c.options) == 2


@pytest.mark.asyncio
async def test_artifact(db):
    project = Project(name="P", description="")
    db.add(project)
    await db.flush()

    artifact = Artifact(
        project_id=project.id,
        title="Test Report",
        content_type="markdown",
        content="# Hello",
        version=1,
    )
    db.add(artifact)
    await db.commit()

    result = await db.execute(select(Artifact).where(Artifact.project_id == project.id))
    a = result.scalar_one()
    assert a.title == "Test Report"
    assert a.content == "# Hello"
