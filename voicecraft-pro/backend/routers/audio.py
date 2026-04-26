from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import uuid
from pathlib import Path
from config import AUDIO_DIR, ALLOWED_AUDIO_TYPES, MAX_UPLOAD_SIZE
from utils.audio_utils import get_audio_duration
from models.schemas import AudioUploadResponse

router = APIRouter()

def get_file_path(blob_id: str) -> Path:
    for subdir in ["tts", "upload", "temp"]:
        p = AUDIO_DIR / subdir / blob_id
        if p.exists():
            return p
        # 尝试加扩展名
        for ext in [".mp3", ".wav", ".m4a"]:
            p2 = AUDIO_DIR / subdir / f"{blob_id}{ext}"
            if p2.exists():
                return p2
    return AUDIO_DIR / "temp" / blob_id

@router.post("/upload", response_model=AudioUploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    if file.size and file.size > MAX_UPLOAD_SIZE:
        return AudioUploadResponse(success=False, error="FILE_TOO_LARGE", message="文件超过 50MB 限制")

    ext = Path(file.filename or "audio.mp3").suffix
    blob_id = f"audio_{uuid.uuid4().hex[:12]}{ext}"
    file_path = AUDIO_DIR / "upload" / blob_id

    content = await file.read()
    file_path.write_bytes(content)

    duration = get_audio_duration(str(file_path))

    return AudioUploadResponse(
        success=True,
        blob_id=blob_id,
        name=file.filename or "audio",
        duration=duration,
        url=f"/api/v1/audio/download/{blob_id}",
    )

@router.get("/download/{blob_id}")
async def download_audio(blob_id: str):
    file_path = get_file_path(blob_id)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio not found")

    media_type = "audio/mpeg"
    if file_path.suffix == ".wav":
        media_type = "audio/wav"
    elif file_path.suffix == ".m4a":
        media_type = "audio/mp4"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
    )

@router.delete("/{blob_id}")
async def delete_audio(blob_id: str):
    file_path = get_file_path(blob_id)
    if file_path.exists():
        file_path.unlink()
    return {"success": True}
