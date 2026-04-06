import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Artifact, Project
from app.schemas.project import ArtifactBrief, ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(tags=["projects"])


@router.get("/projects", response_model=list[ProjectRead])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.sprints), selectinload(Project.artifact))
        .order_by(Project.created_at.desc())
    )
    return result.scalars().all()


@router.post("/projects", response_model=ProjectRead, status_code=201)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(name=data.name, description=data.description, autonomy_mode=data.autonomy_mode)
    db.add(project)
    await db.flush()

    # Initialize project roadmap in background
    from app.services.project_orchestrator import initialize_project_roadmap

    project_id = project.id
    asyncio.create_task(initialize_project_roadmap(project_id))

    await db.commit()
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.sprints), selectinload(Project.artifact))
        .where(Project.id == project.id)
    )
    return result.scalar_one()


@router.get("/projects/{project_id}", response_model=ProjectRead)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.sprints), selectinload(Project.artifact))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project


@router.patch("/projects/{project_id}", response_model=ProjectRead)
async def update_project(project_id: str, data: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    await db.commit()
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.sprints), selectinload(Project.artifact))
        .where(Project.id == project_id)
    )
    return result.scalar_one()


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    project.status = "archived"
    await db.commit()


@router.get("/projects/{project_id}/artifact", response_model=ArtifactBrief | None)
async def get_artifact(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Artifact).where(Artifact.project_id == project_id))
    artifact = result.scalar_one_or_none()
    return artifact


@router.get("/projects/{project_id}/artifact/versions")
async def get_artifact_versions(project_id: str, db: AsyncSession = Depends(get_db)):
    from app.models import ArtifactVersion
    result = await db.execute(select(Artifact).where(Artifact.project_id == project_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        return []
    result = await db.execute(
        select(ArtifactVersion)
        .where(ArtifactVersion.artifact_id == artifact.id)
        .order_by(ArtifactVersion.version.desc())
    )
    versions = result.scalars().all()
    return [
        {
            "id": v.id,
            "version": v.version,
            "sprint_id": v.sprint_id,
            "change_summary": v.change_summary,
            "content": v.content,
            "created_at": v.created_at.isoformat(),
        }
        for v in versions
    ]
