import os
from pathlib import Path

# 基础路径
BASE_DIR = Path(__file__).parent.resolve()
DATA_DIR = BASE_DIR / "data"
AUDIO_DIR = DATA_DIR / "audio"
PROJECT_DIR = DATA_DIR / "projects"

# 确保目录存在
for d in [AUDIO_DIR / "tts", AUDIO_DIR / "upload", AUDIO_DIR / "temp", PROJECT_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ElevenLabs 配置
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

# Whisper / ASR 配置
# 默认使用 OpenAI Whisper API，可替换为自部署端点
WHISPER_API_KEY = os.getenv("WHISPER_API_KEY", os.getenv("OPENAI_API_KEY", ""))
WHISPER_API_URL = os.getenv("WHISPER_API_URL", "https://api.openai.com/v1/audio/transcriptions")

# 配额限制（字符数/月）
QUOTA_LIMIT = int(os.getenv("ELEVENLABS_QUOTA_LIMIT", "100000"))

# 上传限制
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/webm"}

# 临时文件清理时间（秒）
TEMP_FILE_TTL = 7 * 24 * 3600  # 7 天
