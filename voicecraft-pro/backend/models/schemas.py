from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# ==================== TTS ====================
class VoiceSettings(BaseModel):
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0

class TTSGenerateRequest(BaseModel):
    text: str
    voice_id: str
    model_id: str = "eleven_multilingual_v2"
    voice_settings: VoiceSettings = VoiceSettings()
    provider: str = "elevenlabs"

class TTSGenerateResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    duration: Optional[float] = None
    characters_used: Optional[int] = None
    remaining_quota: Optional[int] = None
    error: Optional[str] = None
    message: Optional[str] = None

# ==================== ASR ====================
class ASRTranscribeRequest(BaseModel):
    audio_url: str
    language: str = "zh"
    response_format: str = "verbose_json"

class ASRWord(BaseModel):
    word: str
    start: float
    end: float

class ASRSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str
    words: List[ASRWord] = []

class ASRTranscribeResponse(BaseModel):
    success: bool
    segments: List[ASRSegment] = []
    duration: Optional[float] = None
    error: Optional[str] = None

# ==================== Project ====================
class ProjectSaveRequest(BaseModel):
    project: Dict[str, Any]
    audio_blobs: List[str] = []

class ProjectSaveResponse(BaseModel):
    success: bool
    project_id: Optional[str] = None
    saved_at: Optional[str] = None

# ==================== Audio Upload ====================
class AudioUploadResponse(BaseModel):
    success: bool
    blob_id: Optional[str] = None
    name: Optional[str] = None
    duration: Optional[float] = None
    url: Optional[str] = None
    error: Optional[str] = None
