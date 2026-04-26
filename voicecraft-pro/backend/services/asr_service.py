# ASR 服务 - 调用 Whisper API
import httpx
from config import WHISPER_API_KEY, WHISPER_API_URL

async def transcribe_audio(file_path: str, language: str = "zh") -> dict:
    """调用 Whisper API 进行语音识别"""
    if not WHISPER_API_KEY:
        raise ValueError("Whisper API Key 未配置")

    async with httpx.AsyncClient(timeout=120.0) as client:
        with open(file_path, "rb") as f:
            files = {"file": ("audio.mp3", f, "audio/mpeg")}
            data = {
                "model": "whisper-1",
                "language": language,
                "response_format": "verbose_json",
            }
            headers = {"Authorization": f"Bearer {WHISPER_API_KEY}"}

            resp = await client.post(
                WHISPER_API_URL,
                headers=headers,
                files=files,
                data=data,
            )

        if resp.status_code != 200:
            raise RuntimeError(f"Whisper API 错误: {resp.status_code} {resp.text}")

        return resp.json()
