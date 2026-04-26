# 音频工具
from pydub import AudioSegment
from pathlib import Path
from io import BytesIO

def get_audio_duration(file_path: str) -> float:
    """获取音频文件时长（秒）"""
    try:
        audio = AudioSegment.from_file(file_path)
        return len(audio) / 1000.0
    except Exception:
        return 0.0

def format_audio_for_playback(file_path: str, output_format: str = "mp3") -> bytes:
    """格式化音频用于播放"""
    audio = AudioSegment.from_file(file_path)
    buffer = BytesIO()
    audio.export(buffer, format=output_format)
    return buffer.getvalue()
