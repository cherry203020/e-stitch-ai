"""File upload API - for custom design images."""
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from starlette.responses import FileResponse

from ..config import get_settings
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])
settings = get_settings()


def ensure_upload_dir():
    d = Path(settings.upload_dir)
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.post("/design-image")
async def upload_design_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    """Upload custom design/reference image."""
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP allowed")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    name = f"design_{current_user.id}_{uuid.uuid4().hex[:12]}.{ext}"
    d = ensure_upload_dir()
    path = d / name
    
    content = await file.read()
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.max_upload_size_mb}MB)")
    
    with open(path, "wb") as f:
        f.write(content)
    # Return URL path that works with API base (e.g. frontend uses API_BASE + url)
    return {"url": f"/api/uploads/{name}"}


@router.get("/{file_path:path}")
async def serve_upload(file_path: str):
    """Serve uploaded file (supports subpaths e.g. ai_designs/xxx.png)."""
    if ".." in file_path or file_path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")
    d = ensure_upload_dir()
    path = d / file_path
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)
