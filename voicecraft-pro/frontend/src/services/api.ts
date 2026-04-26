/****************************
 * VoiceCraft Pro - API 服务层
 ****************************/
import {
  TTSGenerateRequest,
  TTSGenerateResponse,
  ASRTranscribeRequest,
  ASRTranscribeResponse,
  VoiceInfo,
} from '../types';

const API_BASE = '/api/v1';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ==================== TTS ====================
export async function generateTTS(request: TTSGenerateRequest): Promise<TTSGenerateResponse> {
  return fetchJSON<TTSGenerateResponse>(`${API_BASE}/tts/generate`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ==================== ASR / 字幕 ====================
export async function transcribeAudio(request: ASRTranscribeRequest): Promise<ASRTranscribeResponse> {
  return fetchJSON<ASRTranscribeResponse>(`${API_BASE}/asr/transcribe`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ==================== ElevenLabs 代理 ====================
export async function listVoices(): Promise<VoiceInfo[]> {
  const res = await fetchJSON<{ voices: any[] }>(`${API_BASE}/proxy/elevenlabs/voices`);
  return (res.voices || []).map((v: any) => ({
    voice_id: v.voice_id,
    name: v.name,
    provider: 'elevenlabs',
    language: v.labels?.language || 'zh',
    gender: v.labels?.gender || 'neutral',
    accent: v.labels?.accent,
    category: v.category,
    preview_url: v.preview_url,
    labels: v.labels,
  }));
}

export async function getVoiceDetails(voiceId: string): Promise<any> {
  return fetchJSON<any>(`${API_BASE}/proxy/elevenlabs/voices/${voiceId}`);
}

export async function getSubscriptionInfo(): Promise<any> {
  return fetchJSON<any>(`${API_BASE}/proxy/elevenlabs/user/subscription`);
}

// ==================== 音频文件 ====================
export async function uploadAudioFile(file: File): Promise<{ blob_id: string; name: string; duration: number; url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/audio/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('上传失败');
  return res.json();
}

export function getAudioDownloadUrl(blobId: string): string {
  return `${API_BASE}/audio/download/${blobId}`;
}

// ==================== 工程文件 ====================
export async function saveProjectBackup(projectId: string, projectData: any, audioBlobs: string[]): Promise<any> {
  return fetchJSON<any>(`${API_BASE}/project/save`, {
    method: 'POST',
    body: JSON.stringify({ project: projectData, audio_blobs: audioBlobs }),
  });
}

export async function loadProjectBackup(projectId: string): Promise<any> {
  return fetchJSON<any>(`${API_BASE}/project/load/${projectId}`);
}
