# VoiceCraft Pro — 技术方案文档（Tech Spec）

> **版本**：v1.0  
> **日期**：2026-04-25  
> **对应 PRD**：prd-voicecraft-pro.md  

---

## 一、技术栈总览

| 层级 | 选型 | 理由 |
|------|------|------|
| **前端框架** | React 18 + TypeScript + Vite | 生态成熟，TypeScript 保证类型安全，Vite 构建快 |
| **状态管理** | Zustand + Immer | 轻量，适合音频/文稿这种复杂可变状态 |
| **样式方案** | Tailwind CSS + CSS Variables | 画布主题色（底色）需动态切换，CSS Variables 最方便 |
| **音频引擎** | Web Audio API + Wavesurfer.js | 浏览器原生能力，Wavesurfer 负责波形绘制 |
| **波形/画布** | HTML5 Canvas 2D + 自定义时间轴 | 简单可视化排列，不需要 WebGL 的复杂度 |
| **存储** | IndexedDB（Dexie.js）| 工程文件、音频 Blob、字幕数据全部本地存 |
| **后端** | FastAPI（Python）| 快速搭建代理 + Whisper API，团队熟悉 Python 时首选 |
| **缓存/计数** | 后端内存（dict）或 Redis | ElevenLabs 配额简单计数，自用场景 Redis 可选 |
| **部署** | Docker Compose（前端 Nginx + 后端 FastAPI）| 自用部署简单，一行 `docker-compose up` |

---

## 二、前端组件结构

### 2.1 页面级组件

```
src/
├── pages/
│   ├── Workshop.tsx          # 主工作台（默认页面）
│   ├── VoiceStore.tsx        # 音色商店
│   ├── Settings.tsx          # 设置
│   └── Projects.tsx          # 项目管理
├── App.tsx                   # 路由 + 全局布局
└── main.tsx                  # 入口
```

### 2.2 核心组件拆解（以 Workshop 为例）

```
Workshop/
├── TopBar.tsx                # 顶部：工程名、播放控制（播放/暂停/循环）、导出按钮
├── LeftSidebar/
│   ├── CharacterPanel.tsx    # 角色列表 + 角色-音色绑定
│   └── VoicePicker.tsx       # 音色选择弹窗（调 VoiceStore 数据）
├── CenterStage/
│   ├── ScriptEditor.tsx      # 文稿编辑器（行级）
│   └── SentenceRow.tsx       # 单行组件：行号 + 角色标签 + 台词 + 重新生成按钮
├── BottomCanvas/
│   ├── Timeline.tsx            # 时间轴画布容器
│   ├── AudioTrack.tsx          # 配音轨道（按角色分色）
│   ├── BgmTrack.tsx            # BGM 轨道
│   ├── SubtitleTrack.tsx       # 字幕轨道（双语）
│   ├── Playhead.tsx            # 播放头（红色竖线）
│   └── TimeRuler.tsx           # 时间刻度尺
├── RightSidebar（可选折叠）
│   ├── SubtitleStylePanel.tsx  # 字幕样式设置
│   └── ExportPanel.tsx         # 导出选项
└── Modals/
    ├── ImportModal.tsx         # 导入文稿
    ├── LoadingModal.tsx        # 生成中进度弹窗
    └── HistoryModal.tsx        # 单句音频历史版本
```

### 2.3 共享组件（components/）

```
components/
├── Waveform.tsx              # 波形渲染（基于 Wavesurfer 或 Canvas）
├── AudioPlayer.tsx           # 全局音频播放器封装
├── ColorPicker.tsx           # 画布底色选择器
├── TagInput.tsx              # 角色标签输入（带自动补全）
├── SplitButton.tsx           # 拆分/合并句子按钮组
├── Tooltip.tsx               # 通用提示
└── Toast.tsx                 # 全局通知（生成完成、报错）
```

### 2.4 核心 Hooks

```
hooks/
├── useAudioEngine.ts         # Web Audio API 封装：加载、播放、暂停、seek、音量
├── useTimeline.ts            # 时间轴状态：缩放、滚动、播放头位置
├── useTtsQueue.ts            # TTS 生成队列管理：逐句请求、进度追踪、错误重试
├── useSubtitleSync.ts        # 字幕同步：音频时间 ↔ 文稿行高亮
├── useIndexedDB.ts           # Dexie 封装：工程读写、音频 Blob 存取
└── useKeyShortcuts.ts        # 全局快捷键监听
```

---

## 三、数据模型（TypeScript Interfaces）

### 3.1 核心领域模型

```typescript
// ==================== 角色 ====================
interface Character {
  id: string;                    // 内部 UUID
  name: string;                  // 角色名（如"小明"、"旁白"）
  color: string;                 // HEX 色值，用于画布轨道和文稿标签
  voiceId: string;               // 绑定的 ElevenLabs Voice ID
  voiceProvider: 'elevenlabs';    // 预留多 Provider
  voiceSettings: {
    stability: number;           // 0~1
    similarityBoost: number;     // 0~1
    style: number;               // 0~1（ElevenLabs 风格化）
  };
  accent?: string;              // 口音预设
  emotion?: string;             // 情绪预设
  isNarrator: boolean;          // 是否为旁白模式（影响语调 prompt）
  pauseAfterSentence: number;   // 句尾停顿 ms，默认 300
  pauseAfterParagraph: number;  // 段尾停顿 ms，默认 800
}

// ==================== 句子 / 文稿行 ====================
interface Sentence {
  id: string;
  index: number;                // 行号（0-based，支持拖拽换序后重排）
  characterId: string;
  text: string;                  // 台词原文（支持 SSML 标签）
  translation?: string;          // 英文翻译（双语字幕用）
  audioBlobId?: string;          // 指向 IndexedDB 中音频 Blob 的 key
  audioDuration?: number;        // 秒
  audioVersions: AudioVersion[]; // 历史版本（最多 5 个）
  status: 'draft' | 'generated' | 'modified' | 'error';
  tags: string[];                // 用户标记，如["待重录","语速快"]
  startTime?: number;            // 在时间轴上的起始秒数（由引擎计算）
  endTime?: number;              // 结束秒数
}

interface AudioVersion {
  id: string;
  blobId: string;
  duration: number;
  createdAt: number;            // timestamp
  textSnapshot: string;          // 当时文本
}

// ==================== 音频片段（画布用） ====================
interface AudioClip {
  id: string;
  sentenceId: string;           // 关联句子
  trackId: string;               // 所在轨道
  startTime: number;             // 画布上的起始位置（秒）
  duration: number;
  blobId: string;                // 音频数据引用
  waveformPeaks?: number[];      // 预计算的波形峰值数据（可视化用）
}

// ==================== 轨道 ====================
interface Track {
  id: string;
  type: 'voice' | 'bgm' | 'sfx' | 'subtitle';
  name: string;
  characterId?: string;         // voice 轨关联角色
  clips: AudioClip[];
  isMuted: boolean;
  volume: number;                // 0~1
  color?: string;                // voice 轨继承角色色
}

// ==================== 字幕 ====================
interface SubtitleCue {
  id: string;
  sentenceId: string;
  startTime: number;
  endTime: number;
  text: string;                  // 中文
  translation?: string;          // 英文
  style: SubtitleStyle;
}

interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundOpacity: number;
  position: 'top' | 'center' | 'bottom';
  lineSpacing: number;           // 中英双行间距
}

// ==================== 工程文件（顶层） ====================
interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  canvasBackground: string;       // HEX，默认 #1a1a1a
  characters: Character[];
  sentences: Sentence[];
  tracks: Track[];
  subtitleCues: SubtitleCue[];
  subtitleStyle: SubtitleStyle;
  globalSettings: {
    defaultPause: number;         // 全局默认句间停顿
    ttsProvider: 'elevenlabs';
    elevenlabsModel: 'eleven_multilingual_v2' | 'eleven_turbo_v2';
  };
  bgmFile?: {
    blobId: string;
    name: string;
    duration: number;
  };
}
```

### 3.2 运行时临时状态（Zustand Store）

```typescript
interface AppState {
  // 当前工程
  currentProject: Project | null;
  
  // 播放状态
  isPlaying: boolean;
  currentTime: number;           // 播放头当前秒数
  loopRange: [number, number] | null;
  
  // 选中状态
  selectedSentenceId: string | null;
  selectedTrackId: string | null;
  
  // TTS 队列
  ttsQueue: {
    sentenceId: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    progress?: number;
  }[];
  
  // UI 状态
  isImportModalOpen: boolean;
  isGenerating: boolean;
  generateProgress: number;      // 0~100
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  
  // Actions（由 Zustand actions 实现）
  setProject: (p: Project) => void;
  updateSentence: (id: string, patch: Partial<Sentence>) => void;
  setPlaying: (v: boolean) => void;
  seek: (time: number) => void;
  generateSingle: (sentenceId: string) => Promise<void>;
  generateAll: () => Promise<void>;
  exportAudio: (format: 'mp3' | 'wav') => Promise<void>;
}
```

---

## 四、前端状态流与数据流转

```
┌─────────────┐     导入/粘贴      ┌─────────────┐
│   外部文稿   │ ─────────────────▶ │  文稿编辑器   │
└─────────────┘                    └─────────────┘
                                          │
                                          ▼ 解析角色
                                   ┌─────────────┐
                                   │  角色面板     │
                                   │ (NLP提取/    │
                                   │  手动修正)   │
                                   └─────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
            ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
            │  音色绑定     │      │  句子级编辑   │      │  单句重新生成 │
            │ (选VoiceID)  │      │ (改文本/     │      │ (调TTS API)  │
            └─────────────┘      │  拆分/合并)   │      └─────────────┘
                                 └─────────────┘
                                          │
                                          ▼ 生成完成
                                   ┌─────────────┐
                                   │  IndexedDB   │
                                   │ (存音频Blob) │
                                   └─────────────┘
                                          │
                                          ▼ 加载
                                   ┌─────────────┐
                                   │  音频画布     │
                                   │ (波形/轨道)  │
                                   └─────────────┘
                                          │
                                          ▼ ASR
                                   ┌─────────────┐
                                   │  字幕对齐     │
                                   │ (Whisper API)│
                                   └─────────────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │  导出面板     │
                                   │ 音频/srt/视频 │
                                   └─────────────┘
```

---

## 五、后端 API 定义（FastAPI）

### 5.1 路由总览

```
/api/v1/
├── /tts
│   ├── POST /generate          # 单句 TTS（前端调用）
│   └── POST /stream            # 流式 TTS（预留）
├── /asr
│   └── POST /transcribe        # Whisper 转写（字幕对齐）
├── /proxy
│   └── /elevenlabs/*           # 透传 ElevenLabs API（隐藏 Key）
├── /project
│   ├── POST /save              # 保存工程（JSON 元数据）
│   ├── GET  /load/:id          # 加载工程
│   └── GET  /list              # 工程列表
├── /audio
│   ├── POST /upload            # 上传音频文件（BGM/导入）
│   ├── GET  /download/:blobId  # 下载音频
│   └── DELETE /:blobId        # 清理音频
└── /health
    └── GET /                   # 健康检查
```

### 5.2 详细接口定义

#### `POST /api/v1/tts/generate` — 单句 TTS

**Request:**
```json
{
  "text": "这是一句测试台词",
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0
  },
  "provider": "elevenlabs"
}
```

**Response:**
```json
{
  "success": true,
  "audio_url": "/api/v1/audio/download/tts_abc123",
  "duration": 3.42,
  "characters_used": 12,
  "remaining_quota": 987654
}
```

**错误 Response:**
```json
{
  "success": false,
  "error": "QUOTA_EXCEEDED",
  "message": "本月 ElevenLabs 额度已用完，请联系管理员。"
}
```

**逻辑：**
1. 后端校验请求合法性（text 非空、voice_id 有效）
2. 检查 ElevenLabs 本月配额（内存计数器）
3. 透传请求到 ElevenLabs API（使用平台统一 Key）
4. 接收音频流，保存为临时文件，生成 blobId
5. 返回音频下载链接 + 消耗字符数

---

#### `POST /api/v1/asr/transcribe` — 字幕对齐（Whisper）

**Request:**
```json
{
  "audio_url": "/api/v1/audio/download/tts_final_mix",
  "language": "zh",
  "response_format": "verbose_json"
}
```

**Response:**
```json
{
  "success": true,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.42,
      "text": "这是一句测试台词",
      "words": [
        {"word": "这", "start": 0.0, "end": 0.15},
        {"word": "是", "start": 0.15, "end": 0.28}
      ]
    }
  ],
  "duration": 120.5
}
```

**逻辑：**
1. 后端下载音频文件
2. 调用 Whisper API（OpenAI 或自部署）进行转写
3. 返回带时间戳的 segments，前端用于生成 SubtitleCue

---

#### `POST /api/v1/proxy/elevenlabs/{path}` — ElevenLabs API 代理

**说明：** 前端不直接调用 ElevenLabs，所有请求走后端代理。后端统一加 Header `xi-api-key`。

**支持的透传路径：**
- `GET /voices` → 获取音色列表
- `GET /voices/{voice_id}` → 音色详情
- `POST /text-to-speech/{voice_id}` → 生成音频
- `GET /user/subscription` → 获取订阅信息（用于配额看板）

**请求/响应：** 原样透传 ElevenLabs 的 request body 和 response。

---

#### `POST /api/v1/project/save` — 保存工程

**Request:**
```json
{
  "project": { ...Project JSON... },
  "audio_blobs": ["blob_id_1", "blob_id_2"]  // 引用的音频列表
}
```

**Response:**
```json
{
  "success": true,
  "project_id": "proj_abc123",
  "saved_at": "2026-04-25T15:30:00Z"
}
```

**逻辑：**
- 工程 JSON 元数据存入后端 SQLite / 文件系统
- 音频 Blob 存在本地磁盘，按 project_id 分目录
- 自用场景可简化为：前端导出 `.voicecraft` 文件（含音频 zip），不走这个接口

---

#### `POST /api/v1/audio/upload` — 上传音频（BGM / 外部导入）

**Request:** multipart/form-data，字段 `file`

**Response:**
```json
{
  "success": true,
  "blob_id": "audio_bgm_xyz",
  "name": "background.mp3",
  "duration": 180.5,
  "url": "/api/v1/audio/download/audio_bgm_xyz"
}
```

---

### 5.3 后端服务模块结构

```
backend/
├── main.py                 # FastAPI 入口 + 路由注册
├── config.py               # 配置：ElevenLabs Key、Whisper endpoint、上传目录
├── models/
│   ├── schemas.py           # Pydantic 模型（对应前端 interfaces）
│   └── enums.py             # 枚举定义
├── routers/
│   ├── tts.py               # /tts/* 路由
│   ├── asr.py               # /asr/* 路由
│   ├── proxy.py             # /proxy/elevenlabs/* 路由
│   ├── project.py           # /project/* 路由
│   └── audio.py             # /audio/* 路由
├── services/
│   ├── tts_service.py       # ElevenLabs 调用 + 配额计数
│   ├── asr_service.py       # Whisper 调用
│   ├── storage_service.py   # 音频文件存取
│   └── quota_manager.py     # 简单配额管理（内存 dict）
├── utils/
│   ├── audio_utils.py       # 音频处理：时长获取、格式转换
│   └── file_utils.py        # 文件清理、路径管理
└── requirements.txt
```

---

## 六、关键算法与逻辑设计

### 6.1 角色自动识别算法（前端 NLP）

```typescript
function extractCharacters(text: string): string[] {
  const patterns = [
    /^(.+?)[:：]\s*/gm,           // "小明：" 或 "小明:"
    /\*\*(.+?)\*\*[:：]/g,       // "**小明**:"
    /\[(.+?)\]/g,                // "[旁白]"
    /^(.+?)\s+说[:：]/gm,        // "小明 说："
  ];
  
  const candidates = new Set<string>();
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const name = match[1].trim();
      if (name.length <= 20 && !isCommonWord(name)) {
        candidates.add(name);
      }
    }
  }
  
  return Array.from(candidates);
}
```

**去重策略：** 用户可在角色面板合并"小明"和"明哥"为同一角色。

### 6.2 时间轴自动排列算法

```typescript
function arrangeTimeline(
  sentences: Sentence[],
  characters: Character[],
  startOffset: number = 0
): AudioClip[] {
  const clips: AudioClip[] = [];
  let currentTime = startOffset;
  
  for (const sentence of sentences) {
    const character = characters.find(c => c.id === sentence.characterId);
    const pause = character?.pauseAfterSentence ?? 300;
    
    const clip: AudioClip = {
      id: `clip_${sentence.id}`,
      sentenceId: sentence.id,
      trackId: `track_${sentence.characterId}`,
      startTime: currentTime,
      duration: sentence.audioDuration ?? estimateDuration(sentence.text),
      blobId: sentence.audioBlobId ?? '',
    };
    
    clips.push(clip);
    currentTime += clip.duration + pause / 1000;
  }
  
  return clips;
}

function estimateDuration(text: string): number {
  // 粗略估算：中文 4.5 字/秒，英文 13 词/分钟 → 约 0.5s/词
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const englishWords = text.match(/[a-zA-Z]+/g)?.length ?? 0;
  return chineseChars / 4.5 + englishWords * 0.5;
}
```

### 6.3 字幕时间戳映射（两种模式）

**快速模式（默认）：**
- 直接用文稿行序 + 每句的 audioDuration 做线性映射
- 适合生成后立刻预览字幕位置

**精确模式（可选）：**
- 调用 `/api/v1/asr/transcribe` 对完整合成音频做 Whisper 转写
- 将 Whisper 返回的 segments 与 sentences 做文本匹配（fuzzy match）
- 更新 subtitleCues 的 startTime / endTime

### 6.4 合成音频拼接（浏览器端混音）

```typescript
async function mixAudioTracks(
  clips: AudioClip[],
  bgmBlobId: string | undefined,
  tracks: Track[]
): Promise<AudioBuffer> {
  const ctx = new AudioContext();
  const totalDuration = Math.max(...clips.map(c => c.endTime));
  
  // 创建离线渲染上下文
  const offlineCtx = new OfflineAudioContext(2, totalDuration * 44100, 44100);
  
  // 1. 混音所有配音轨
  for (const clip of clips) {
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isMuted) continue;
    
    const buffer = await loadAudioBuffer(offlineCtx, clip.blobId);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = track?.volume ?? 1.0;
    
    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    source.start(clip.startTime);
  }
  
  // 2. 叠加 BGM（带闪避）
  if (bgmBlobId) {
    const bgmBuffer = await loadAudioBuffer(offlineCtx, bgmBlobId);
    const bgmSource = offlineCtx.createBufferSource();
    bgmSource.buffer = bgmBuffer;
    bgmSource.loop = true;
    
    const bgmGain = offlineCtx.createGain();
    // 简单闪避：配音期间 -12dB
    bgmGain.gain.setValueAtTime(0.25, 0); // -12dB ≈ 0.25
    // 实际实现需按配音时间段动态调整
    
    bgmSource.connect(bgmGain);
    bgmGain.connect(offlineCtx.destination);
    bgmSource.start(0);
  }
  
  return offlineCtx.startRendering();
}
```

---

## 七、存储方案

### 7.1 IndexedDB 结构（Dexie）

```typescript
const db = new Dexie('VoiceCraftDB');

db.version(1).stores({
  projects: 'id, name, updatedAt',
  audioBlobs: 'id, projectId, createdAt',
  voiceCache: 'voiceId, provider, data',
});

// 表定义
interface ProjectRecord {
  id: string;
  name: string;
  data: Project;        // Project JSON
  updatedAt: number;
}

interface AudioBlobRecord {
  id: string;           // blobId
  projectId: string;
  blob: Blob;            // 音频二进制
  duration: number;
  createdAt: number;
}
```

### 7.2 后端文件存储

```
/data/
├── audio/
│   ├── tts/              # TTS 生成的音频（按日期分目录）
│   ├── upload/           # 用户上传的 BGM/外部音频
│   └── temp/             # 临时文件（每日清理）
├── projects/
│   └── {project_id}.json # 工程元数据备份（可选）
└── config.yaml           # 运行时配置
```

---

## 八、性能与体验优化

| 问题 | 方案 |
|------|------|
| **音频文件大** | 生成时存为 Opus / MP3（压缩），播放时按需解码；波形预计算峰值数组（降采样到 1000 个点），不存完整 PCM |
| **全文生成慢** | 前端 TTS 队列并发 3 个请求（ElevenLabs 并发限制），带指数退避重试；生成时句子状态实时更新 |
| **画布卡顿** | 时间轴虚拟滚动：只渲染视口内 ±2 屏的片段；波形用 Canvas 分层绘制 |
| **首屏加载** | 工程文件懒加载：先加载元数据，音频 Blob 按需从 IndexedDB 读取 |
| **内存泄漏** | AudioBuffer 用完后 `buffer = null`；页面卸载前 `audioContext.close()` |

---

## 九、安全与运维（自用场景简化）

| 项 | 方案 |
|----|------|
| **ElevenLabs Key 隐藏** | 只存在于后端环境变量，前端通过代理调用 |
| **配额超限** | 后端内存计数器，超阈值返回 429 + 友好提示 |
| **文件上传安全** | 限制类型（mp3/wav/m4a）、大小（<50MB）、文件名 sanitize |
| **CORS** | Nginx 配置允许前端域名，开发时允许 localhost |
| **日志** | 后端记录 TTS 请求日志（text 脱敏，只记长度和 voice_id）|
| **备份** | 工程文件支持"导出 .voicecraft"（JSON + audio zip），手动备份到云盘 |

---

## 十、开发里程碑

| 周 | 前端任务 | 后端任务 |
|----|---------|---------|
| **W1** | 项目脚手架 + 布局框架（左/中/底三栏）| FastAPI 脚手架 + 健康检查 |
| **W2** | 文稿编辑器 + 角色识别面板 | /tts/generate 接口 + ElevenLabs 代理 |
| **W3** | 音色选择 + 单句/全文生成流程 | 配额计数器 + 音频上传/下载 |
| **W4** | 音频画布（时间轴 + 波形）+ 播放控制 | /asr/transcribe 接口（Whisper）|
| **W5** | 字幕生成 + 双语字幕样式 + 文稿高亮同步 | 工程文件 save/load（可选）|
| **W6** | 导出面板（音频/srt/视频草稿）+ 工程文件导出 | 部署脚本（Docker Compose）|

---

*技术方案完毕。如需继续细化某模块的代码结构或接口，可以往下拆。*
