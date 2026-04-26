from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from config import WHISPER_API_KEY
from services.asr_service import transcribe_audio
from models.schemas import ASRTranscribeRequest, ASRTranscribeResponse, ASRSegment, ASRWord
from config import AUDIO_DIR

router = APIRouter()

@router.post("/transcribe", response_model=ASRTranscribeResponse)
async def transcribe(request: ASRTranscribeRequest):
    if not WHISPER_API_KEY:
        return ASRTranscribeResponse(success=False, error="WHISPER_NOT_CONFIGURED", message="Whisper API Key 未配置")

    try:
        # audio_url 格式: /api/v1/audio/download/{blob_id}
        blob_id = request.audio_url.split("/")[-1]
        file_path = AUDIO_DIR / "tts" / f"{blob_id}.mp3"
        if not file_path.exists():
            file_path = AUDIO_DIR / "upload" / f"{blob_id}"
        if not file_path.exists():
            return ASRTranscribeResponse(success=False, error="AUDIO_NOT_FOUND", message="音频文件不存在")

        result = await transcribe_audio(str(file_path), request.language)

        segments = []
        for seg in result.get("segments", []):
            words = []
            for w in seg.get("words", []):
                words.append(ASRWord(word=w["word"], start=w["start"], end=w["end"]))
            segments.append(ASRSegment(
                id=seg["id"],
                start=seg["start"],
                end=seg["end"],
                text=seg["text"].strip(),
                words=words,
            ))

        return ASRTranscribeResponse(
            success=True,
            segments=segments,
            duration=result.get("duration"),
        )

    except Exception as e:
        return ASRTranscribeResponse(success=False, error="TRANSCRIBE_FAILED", message=str(e))
