/****************************
 * VoiceCraft Pro - 核心类型定义
 ****************************/

// ==================== 角色 ====================
export interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
}

export interface Character {
  id: string;
  name: string;
  color: string;
  voiceId: string;
  voiceProvider: 'elevenlabs';
  voiceSettings: VoiceSettings;
  accent?: string;
  emotion?: string;
  isNarrator: boolean;
  pauseAfterSentence: number;
  pauseAfterParagraph: number;
}

// ==================== 句子 / 文稿行 ====================
export interface AudioVersion {
  id: string;
  blobId: string;
  duration: number;
  createdAt: number;
  textSnapshot: string;
}

export type SentenceStatus = 'draft' | 'generated' | 'modified' | 'error';

export interface Sentence {
  id: string;
  index: number;
  characterId: string;
  text: string;
  translation?: string;
  audioBlobId?: string;
  audioDuration?: number;
  audioVersions: AudioVersion[];
  status: SentenceStatus;
  tags: string[];
  startTime?: number;
  endTime?: number;
}

// ==================== 音频片段（画布用） ====================
export interface AudioClip {
  id: string;
  sentenceId: string;
  trackId: string;
  startTime: number;
  duration: number;
  blobId: string;
  waveformPeaks?: number[];
}

// ==================== 轨道 ====================
export type TrackType = 'voice' | 'bgm' | 'sfx' | 'subtitle';

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  characterId?: string;
  clips: AudioClip[];
  isMuted: boolean;
  volume: number;
  color?: string;
}

// ==================== 字幕 ====================
export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundOpacity: number;
  position: 'top' | 'center' | 'bottom';
  lineSpacing: number;
}

export interface SubtitleCue {
  id: string;
  sentenceId: string;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
  style: SubtitleStyle;
}

// ==================== 工程文件（顶层） ====================
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  canvasBackground: string;
  characters: Character[];
  sentences: Sentence[];
  tracks: Track[];
  subtitleCues: SubtitleCue[];
  subtitleStyle: SubtitleStyle;
  globalSettings: {
    defaultPause: number;
    ttsProvider: 'elevenlabs';
    elevenlabsModel: 'eleven_multilingual_v2' | 'eleven_turbo_v2';
  };
  bgmFile?: {
    blobId: string;
    name: string;
    duration: number;
  };
}

// ==================== TTS 请求/响应 ====================
export interface TTSGenerateRequest {
  text: string;
  voice_id: string;
  model_id: string;
  voice_settings: VoiceSettings;
  provider: 'elevenlabs';
}

export interface TTSGenerateResponse {
  success: boolean;
  audio_url?: string;
  duration?: number;
  characters_used?: number;
  remaining_quota?: number;
  error?: string;
  message?: string;
}

// ==================== ASR 请求/响应 ====================
export interface ASRTranscribeRequest {
  audio_url: string;
  language: string;
  response_format: 'verbose_json';
}

export interface ASRWord {
  word: string;
  start: number;
  end: number;
}

export interface ASRSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: ASRWord[];
}

export interface ASRTranscribeResponse {
  success: boolean;
  segments?: ASRSegment[];
  duration?: number;
  error?: string;
}

// ==================== 音色 ====================
export interface VoiceInfo {
  voice_id: string;
  name: string;
  provider: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  category?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

// ==================== 导出选项 ====================
export interface ExportOptions {
  audioFormat: 'mp3' | 'wav';
  audioBitrate: number;
  subtitleFormat: 'srt' | 'vtt' | 'ass';
  subtitleLanguage: 'zh' | 'en' | 'bilingual';
  videoBackground: 'canvas' | 'custom';
  videoBackgroundImage?: string;
  videoResolution: '1080p' | '720p';
}
