# TTS 服务工具
from pydub import AudioSegment
from io import BytesIO

def estimate_audio_duration(audio_bytes: bytes) -> float:
    """根据音频文件估算时长（秒）"""
    try:
        audio = AudioSegment.from_file(BytesIO(audio_bytes))
        return len(audio) / 1000.0
    except Exception:
        return 0.0
