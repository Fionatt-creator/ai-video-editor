from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
import httpx
import uuid
from pathlib import Path
from config import ELEVENLABS_API_KEY, ELEVENLABS_BASE_URL, AUDIO_DIR
from models.schemas import TTSGenerateRequest, TTSGenerateResponse
from services.quota_manager import quota_manager
import asyncio

router = APIRouter()

def get_tts_headers():
    return {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }

@router.post("/generate", response_model=TTSGenerateResponse)
async def generate_tts(request: TTSGenerateRequest, background_tasks: BackgroundTasks):
    if not ELEVENLABS_API_KEY:
        return TTSGenerateResponse(success=False, error="NO_API_KEY", message="ElevenLabs API Key 未配置")

    text_len = len(request.text)
    if not quota_manager.check_quota(text_len):
        return TTSGenerateResponse(
            success=False,
            error="QUOTA_EXCEEDED",
            message=f"本月额度已用完。剩余: {quota_manager.remaining} chars，请求需要: {text_len} chars",
        )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{ELEVENLABS_BASE_URL}/text-to-speech/{request.voice_id}",
                headers=get_tts_headers(),
                json={
                    "text": request.text,
                    "model_id": request.model_id,
                    "voice_settings": request.voice_settings.model_dump(),
                },
            )

            if resp.status_code != 200:
                err_text = resp.text
                return TTSGenerateResponse(success=False, error="TTS_ERROR", message=f"ElevenLabs 错误: {err_text}")

            # 保存音频文件
            blob_id = f"tts_{uuid.uuid4().hex[:12]}"
            file_path = AUDIO_DIR / "tts" / f"{blob_id}.mp3"
            file_path.write_bytes(resp.content)

            # 粗略估算时长
            import services.tts_service as tts_service
            duration = tts_service.estimate_audio_duration(resp.content)

            quota_manager.use(text_len)

            return TTSGenerateResponse(
                success=True,
                audio_url=f"/api/v1/audio/download/{blob_id}",
                duration=duration,
                characters_used=text_len,
                remaining_quota=quota_manager.remaining,
            )

    except httpx.TimeoutException:
        return TTSGenerateResponse(success=False, error="TIMEOUT", message="TTS 请求超时，请稍后重试")
    except Exception as e:
        return TTSGenerateResponse(success=False, error="INTERNAL_ERROR", message=str(e))
