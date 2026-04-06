import pytest
from unittest.mock import patch, AsyncMock


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_project(client):
    with patch("app.services.project_orchestrator.initialize_project_roadmap", new_callable=AsyncMock):
        resp = await client.post("/api/v1/projects", json={
            "name": "Test Project",
            "description": "A test",
        })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Project"
    assert data["status"] == "active"
    assert data["autonomy_mode"] == "adaptive"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_projects(client):
    with patch("app.services.project_orchestrator.initialize_project_roadmap", new_callable=AsyncMock):
        await client.post("/api/v1/projects", json={"name": "P1"})
        await client.post("/api/v1/projects", json={"name": "P2"})

    resp = await client.get("/api/v1/projects")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_get_project(client):
    with patch("app.services.project_orchestrator.initialize_project_roadmap", new_callable=AsyncMock):
        create_resp = await client.post("/api/v1/projects", json={"name": "GetMe"})
    project_id = create_resp.json()["id"]

    resp = await client.get(f"/api/v1/projects/{project_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "GetMe"


@pytest.mark.asyncio
async def test_get_project_not_found(client):
    resp = await client.get("/api/v1/projects/nonexistent-id")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_project(client):
    with patch("app.services.project_orchestrator.initialize_project_roadmap", new_callable=AsyncMock):
        create_resp = await client.post("/api/v1/projects", json={"name": "Old Name"})
    project_id = create_resp.json()["id"]

    resp = await client.patch(f"/api/v1/projects/{project_id}", json={"name": "New Name"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_create_sprint(client):
    with patch("app.services.project_orchestrator.initialize_project_roadmap", new_callable=AsyncMock):
        create_resp = await client.post("/api/v1/projects", json={"name": "P"})
    project_id = create_resp.json()["id"]

    with patch("app.services.sprint_orchestrator.run_sprint", new_callable=AsyncMock):
        resp = await client.post(f"/api/v1/projects/{project_id}/sprints", json={
            "goal": "Research pricing",
        })
    assert resp.status_code == 201
    data = resp.json()
    assert data["goal"] == "Research pricing"
    assert data["sprint_number"] == 1
    assert data["status"] == "planning"


@pytest.mark.asyncio
async def test_get_sprint(client):
    with patch("app.services.project_orchestrator.initialize_project_roadmap", new_callable=AsyncMock):
        create_resp = await client.post("/api/v1/projects", json={"name": "P"})
    project_id = create_resp.json()["id"]

    with patch("app.services.sprint_orchestrator.run_sprint", new_callable=AsyncMock):
        sprint_resp = await client.post(f"/api/v1/projects/{project_id}/sprints", json={"goal": "Test"})
    sprint_id = sprint_resp.json()["id"]

    resp = await client.get(f"/api/v1/projects/{project_id}/sprints/{sprint_id}")
    assert resp.status_code == 200
    assert resp.json()["goal"] == "Test"


@pytest.mark.asyncio
async def test_get_trace_events(client):
    with patch("app.services.project_orchestrator.initialize_project_roadmap", new_callable=AsyncMock):
        create_resp = await client.post("/api/v1/projects", json={"name": "P"})
    project_id = create_resp.json()["id"]

    with patch("app.services.sprint_orchestrator.run_sprint", new_callable=AsyncMock):
        sprint_resp = await client.post(f"/api/v1/projects/{project_id}/sprints", json={"goal": "Test"})
    sprint_id = sprint_resp.json()["id"]

    resp = await client.get(f"/api/v1/projects/{project_id}/sprints/{sprint_id}/trace")
    assert resp.status_code == 200
    data = resp.json()
    assert "events" in data
    assert "total" in data
