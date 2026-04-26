/****************************
 * VoiceCraft Pro - Zustand 全局状态管理
 ****************************/
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Project, Sentence, SentenceStatus, Character, AudioClip, Track, ExportOptions } from './types';
import { generateId, estimateDuration, extractCharacters, generateCharacterColor, parseScript } from './utils/audio';
import { saveProjectToDB, saveAudioBlob, deleteAudioBlob, getAudioUrl } from './utils/db';
import { generateTTS } from './services/api';

interface AppState {
  // ========== 数据 ==========
  currentProject: Project | null;
  currentTime: number;
  isPlaying: boolean;
  selectedSentenceId: string | null;
  selectedTrackId: string | null;
  loopRange: [number, number] | null;

  // ========== UI 状态 ==========
  isImportModalOpen: boolean;
  isGenerating: boolean;
  generateProgress: number;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  activePanel: 'subtitle' | 'export' | null;

  // ========== Actions ==========
  createProject: (name: string) => void;
  setProject: (project: Project) => void;
  updateProject: (patch: Partial<Project>) => void;

  importScript: (text: string) => void;
  addCharacter: (name: string) => string;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  mergeCharacters: (sourceId: string, targetId: string) => void;

  addSentence: (characterId: string, text: string, index?: number) => void;
  updateSentence: (id: string, patch: Partial<Sentence>) => void;
  removeSentence: (id: string) => void;
  splitSentence: (id: string, splitIndex: number) => void;
  mergeSentenceUp: (id: string) => void;
  moveSentence: (id: string, direction: 'up' | 'down') => void;

  generateSingle: (sentenceId: string) => Promise<void>;
  generateAll: () => Promise<void>;

  setPlaying: (v: boolean) => void;
  seek: (time: number) => void;
  setLoopRange: (range: [number, number] | null) => void;
  setSelectedSentence: (id: string | null) => void;

  setImportModalOpen: (v: boolean) => void;
  setActivePanel: (panel: 'subtitle' | 'export' | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;

  arrangeTimeline: () => void;
  exportProject: (options: ExportOptions) => Promise<void>;
}

export const useStore = create<AppState>()(
  immer((set, get) => ({
    // ========== 初始状态 ==========
    currentProject: null,
    currentTime: 0,
    isPlaying: false,
    selectedSentenceId: null,
    selectedTrackId: null,
    loopRange: null,
    isImportModalOpen: false,
    isGenerating: false,
    generateProgress: 0,
    toast: null,
    activePanel: null,

    // ========== 工程管理 ==========
    createProject: (name: string) => {
      const now = Date.now();
      const project: Project = {
        id: generateId(),
        name,
        createdAt: now,
        updatedAt: now,
        canvasBackground: '#1a1a1a',
        characters: [],
        sentences: [],
        tracks: [],
        subtitleCues: [],
        subtitleStyle: {
          fontFamily: 'Noto Sans SC, sans-serif',
          fontSize: 24,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 2,
          backgroundOpacity: 0.3,
          position: 'bottom',
          lineSpacing: 8,
        },
        globalSettings: {
          defaultPause: 300,
          ttsProvider: 'elevenlabs',
          elevenlabsModel: 'eleven_multilingual_v2',
        },
      };
      set((state) => {
        state.currentProject = project;
      });
    },

    setProject: (project: Project) => {
      set((state) => {
        state.currentProject = project;
      });
    },

    updateProject: (patch: Partial<Project>) => {
      set((state) => {
        if (state.currentProject) {
          Object.assign(state.currentProject, patch, { updatedAt: Date.now() });
        }
      });
    },

    // ========== 文稿导入 ==========
    importScript: (text: string) => {
      const project = get().currentProject;
      if (!project) return;

      // 自动识别角色
      const names = extractCharacters(text);
      const characters: Character[] = names.map((name, i) => ({
        id: generateId(),
        name,
        color: generateCharacterColor(i),
        voiceId: '',
        voiceProvider: 'elevenlabs',
        voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0 },
        isNarrator: i === 0 && name.includes('旁白'),
        pauseAfterSentence: 300,
        pauseAfterParagraph: 800,
      }));

      // 如果没有识别到角色，创建一个默认"旁白"
      if (characters.length === 0) {
        characters.push({
          id: generateId(),
          name: '旁白',
          color: generateCharacterColor(0),
          voiceId: '',
          voiceProvider: 'elevenlabs',
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0 },
          isNarrator: true,
          pauseAfterSentence: 300,
          pauseAfterParagraph: 800,
        });
      }

      // 解析句子
      const parsed = parseScript(text, characters.map(c => ({ id: c.id, name: c.name })));
      const sentences: Sentence[] = parsed.map((p, i) => ({
        id: generateId(),
        index: i,
        characterId: p.characterId,
        text: p.text,
        audioVersions: [],
        status: 'draft',
        tags: [],
      }));

      set((state) => {
        if (state.currentProject) {
          state.currentProject.characters = characters;
          state.currentProject.sentences = sentences;
          state.currentProject.updatedAt = Date.now();
        }
      });

      get().showToast(`已识别 ${characters.length} 个角色，${sentences.length} 句台词`, 'success');
    },

    // ========== 角色管理 ==========
    addCharacter: (name: string) => {
      const id = generateId();
      const project = get().currentProject;
      if (!project) return id;

      const character: Character = {
        id,
        name,
        color: generateCharacterColor(project.characters.length),
        voiceId: '',
        voiceProvider: 'elevenlabs',
        voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0 },
        isNarrator: false,
        pauseAfterSentence: 300,
        pauseAfterParagraph: 800,
      };

      set((state) => {
        state.currentProject?.characters.push(character);
      });
      return id;
    },

    updateCharacter: (id: string, patch: Partial<Character>) => {
      set((state) => {
        const c = state.currentProject?.characters.find((x) => x.id === id);
        if (c) Object.assign(c, patch);
      });
    },

    removeCharacter: (id: string) => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.characters = state.currentProject.characters.filter((c) => c.id !== id);
        // 将被删除角色的句子归给第一个角色
        const firstChar = state.currentProject.characters[0];
        if (firstChar) {
          state.currentProject.sentences.forEach((s) => {
            if (s.characterId === id) s.characterId = firstChar.id;
          });
        }
      });
    },

    mergeCharacters: (sourceId: string, targetId: string) => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.sentences.forEach((s) => {
          if (s.characterId === sourceId) s.characterId = targetId;
        });
        state.currentProject.characters = state.currentProject.characters.filter(
          (c) => c.id !== sourceId
        );
      });
    },

    // ========== 句子管理 ==========
    addSentence: (characterId: string, text: string, index?: number) => {
      set((state) => {
        if (!state.currentProject) return;
        const sentence: Sentence = {
          id: generateId(),
          index: state.currentProject.sentences.length,
          characterId,
          text,
          audioVersions: [],
          status: 'draft',
          tags: [],
        };
        if (index !== undefined && index >= 0) {
          state.currentProject.sentences.splice(index, 0, sentence);
          // 重排 index
          state.currentProject.sentences.forEach((s, i) => (s.index = i));
        } else {
          state.currentProject.sentences.push(sentence);
        }
      });
    },

    updateSentence: (id: string, patch: Partial<Sentence>) => {
      set((state) => {
        const s = state.currentProject?.sentences.find((x) => x.id === id);
        if (s) {
          Object.assign(s, patch);
          if (patch.text && s.status === 'generated') {
            s.status = 'modified';
          }
        }
      });
    },

    removeSentence: (id: string) => {
      set((state) => {
        if (!state.currentProject) return;
        const s = state.currentProject.sentences.find((x) => x.id === id);
        if (s?.audioBlobId) {
          deleteAudioBlob(s.audioBlobId);
        }
        state.currentProject.sentences = state.currentProject.sentences.filter((x) => x.id !== id);
        state.currentProject.sentences.forEach((s, i) => (s.index = i));
      });
    },

    splitSentence: (id: string, splitIndex: number) => {
      set((state) => {
        if (!state.currentProject) return;
        const idx = state.currentProject.sentences.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const original = state.currentProject.sentences[idx];
        const before = original.text.slice(0, splitIndex).trim();
        const after = original.text.slice(splitIndex).trim();
        if (!before || !after) return;

        original.text = before;
        original.status = 'modified';

        const newSentence: Sentence = {
          id: generateId(),
          index: 0,
          characterId: original.characterId,
          text: after,
          audioVersions: [],
          status: 'draft',
          tags: [],
        };

        state.currentProject.sentences.splice(idx + 1, 0, newSentence);
        state.currentProject.sentences.forEach((s, i) => (s.index = i));
      });
    },

    mergeSentenceUp: (id: string) => {
      set((state) => {
        if (!state.currentProject) return;
        const idx = state.currentProject.sentences.findIndex((x) => x.id === id);
        if (idx <= 0) return;
        const current = state.currentProject.sentences[idx];
        const prev = state.currentProject.sentences[idx - 1];
        if (current.characterId !== prev.characterId) return;

        prev.text += ' ' + current.text;
        prev.status = 'modified';
        state.currentProject.sentences.splice(idx, 1);
        state.currentProject.sentences.forEach((s, i) => (s.index = i));
      });
    },

    moveSentence: (id: string, direction: 'up' | 'down') => {
      set((state) => {
        if (!state.currentProject) return;
        const idx = state.currentProject.sentences.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= state.currentProject.sentences.length) return;

        const arr = state.currentProject.sentences;
        [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
        arr.forEach((s, i) => (s.index = i));
      });
    },

    // ========== TTS 生成 ==========
    generateSingle: async (sentenceId: string) => {
      const project = get().currentProject;
      if (!project) return;
      const sentence = project.sentences.find((s) => s.id === sentenceId);
      const character = project.characters.find((c) => c.id === sentence?.characterId);
      if (!sentence || !character || !character.voiceId) {
        get().showToast('请先为角色绑定音色', 'error');
        return;
      }

      set((state) => {
        const s = state.currentProject?.sentences.find((x) => x.id === sentenceId);
        if (s) s.status = 'draft';
      });

      try {
        const res = await generateTTS({
          text: sentence.text,
          voice_id: character.voiceId,
          model_id: project.globalSettings.elevenlabsModel,
          voice_settings: character.voiceSettings,
          provider: 'elevenlabs',
        });

        if (!res.success || !res.audio_url) {
          throw new Error(res.message || 'TTS 生成失败');
        }

        // 下载音频 blob 并存到 IndexedDB
        const audioRes = await fetch(res.audio_url);
        const blob = await audioRes.blob();
        const blobId = generateId();
        await saveAudioBlob(blobId, project.id, blob, res.duration || estimateDuration(sentence.text));

        // 更新句子状态
        set((state) => {
          const s = state.currentProject?.sentences.find((x) => x.id === sentenceId);
          if (s) {
            s.audioBlobId = blobId;
            s.audioDuration = res.duration || estimateDuration(sentence.text);
            s.status = 'generated';
            s.audioVersions.unshift({
              id: generateId(),
              blobId,
              duration: s.audioDuration,
              createdAt: Date.now(),
              textSnapshot: sentence.text,
            });
            if (s.audioVersions.length > 5) s.audioVersions.pop();
          }
        });

        get().arrangeTimeline();
      } catch (err: any) {
        set((state) => {
          const s = state.currentProject?.sentences.find((x) => x.id === sentenceId);
          if (s) s.status = 'error';
        });
        get().showToast(err.message || '生成失败', 'error');
      }
    },

    generateAll: async () => {
      const project = get().currentProject;
      if (!project) return;

      const pending = project.sentences.filter(
        (s) => s.status === 'draft' || s.status === 'modified' || s.status === 'error'
      );
      if (pending.length === 0) {
        get().showToast('没有需要生成的句子', 'info');
        return;
      }

      set((state) => {
        state.isGenerating = true;
        state.generateProgress = 0;
      });

      let completed = 0;
      for (const sentence of pending) {
        await get().generateSingle(sentence.id);
        completed++;
        set((state) => {
          state.generateProgress = Math.round((completed / pending.length) * 100);
        });
      }

      set((state) => {
        state.isGenerating = false;
      });
      get().showToast(`已完成 ${completed} 句生成`, 'success');
    },

    // ========== 播放控制 ==========
    setPlaying: (v: boolean) => {
      set((state) => {
        state.isPlaying = v;
      });
    },

    seek: (time: number) => {
      set((state) => {
        state.currentTime = Math.max(0, time);
      });
    },

    setLoopRange: (range) => {
      set((state) => {
        state.loopRange = range;
      });
    },

    setSelectedSentence: (id) => {
      set((state) => {
        state.selectedSentenceId = id;
      });
    },

    // ========== UI ==========
    setImportModalOpen: (v: boolean) => {
      set((state) => {
        state.isImportModalOpen = v;
      });
    },

    setActivePanel: (panel) => {
      set((state) => {
        state.activePanel = panel;
      });
    },

    showToast: (message: string, type = 'info') => {
      set((state) => {
        state.toast = { message, type };
      });
      setTimeout(() => {
        get().clearToast();
      }, 3000);
    },

    clearToast: () => {
      set((state) => {
        state.toast = null;
      });
    },

    // ========== 时间轴排列 ==========
    arrangeTimeline: () => {
      const project = get().currentProject;
      if (!project) return;

      const clips: AudioClip[] = [];
      const tracks: Track[] = [];
      let currentTime = 0;

      for (const sentence of project.sentences) {
        const character = project.characters.find((c) => c.id === sentence.characterId);
        const pause = (character?.pauseAfterSentence ?? 300) / 1000;

        // 确保有对应轨道
        const trackId = `track_${sentence.characterId}`;
        if (!tracks.find((t) => t.id === trackId)) {
          tracks.push({
            id: trackId,
            type: 'voice',
            name: character?.name || '未知',
            characterId: sentence.characterId,
            clips: [],
            isMuted: false,
            volume: 1,
            color: character?.color,
          });
        }

        const duration = sentence.audioDuration || estimateDuration(sentence.text);

        clips.push({
          id: `clip_${sentence.id}`,
          sentenceId: sentence.id,
          trackId,
          startTime: currentTime,
          duration,
          blobId: sentence.audioBlobId || '',
        });

        sentence.startTime = currentTime;
        sentence.endTime = currentTime + duration;
        currentTime += duration + pause;
      }

      // 更新轨道 clips
      tracks.forEach((track) => {
        track.clips = clips.filter((c) => c.trackId === track.id);
      });

      set((state) => {
        if (state.currentProject) {
          state.currentProject.tracks = tracks;
        }
      });
    },

    // ========== 导出 ==========
    exportProject: async (options: ExportOptions) => {
      const project = get().currentProject;
      if (!project) return;
      get().showToast('导出功能开发中，请使用工程文件导出', 'info');
    },
  }))
);
