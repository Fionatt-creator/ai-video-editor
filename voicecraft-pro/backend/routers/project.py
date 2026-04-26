from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from datetime import datetime
from config import PROJECT_DIR
from models.schemas import ProjectSaveRequest, ProjectSaveResponse

router = APIRouter()

@router.post("/save", response_model=ProjectSaveResponse)
async def save_project(request: ProjectSaveRequest):
    try:
        project_id = request.project.get("id", "unknown")
        file_path = PROJECT_DIR / f"{project_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(request.project, f, ensure_ascii=False, indent=2)

        return ProjectSaveResponse(
            success=True,
            project_id=project_id,
            saved_at=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        return ProjectSaveResponse(success=False, error=str(e))

@router.get("/load/{project_id}")
async def load_project(project_id: str):
    file_path = PROJECT_DIR / f"{project_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"success": True, "project": data}

@router.get("/list")
async def list_projects():
    projects = []
    for file_path in PROJECT_DIR.glob("*.json"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        projects.append({
            "id": data.get("id"),
            "name": data.get("name"),
            "updatedAt": data.get("updatedAt"),
        })
    return {"success": True, "projects": projects}
