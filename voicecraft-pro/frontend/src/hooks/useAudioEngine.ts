/****************************
 * VoiceCraft Pro - Web Audio API 音频引擎 Hook
 ****************************/
import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { getAudioUrl } from '../utils/db';

export function useAudioEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const isPlayingRef = useRef(false);

  const currentTime = useStore((s) => s.currentTime);
  const project = useStore((s) => s.currentProject);
  const setPlaying = useStore((s) => s.setPlaying);
  const seek = useStore((s) => s.seek);

  // 初始化 AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // 加载所有音频片段为 AudioBuffer
  const loadBuffers = useCallback(async (): Promise<Map<string, AudioBuffer>> => {
    const ctx = getAudioContext();
    const buffers = new Map<string, AudioBuffer>();
    if (!project) return buffers;

    for (const sentence of project.sentences) {
      if (!sentence.audioBlobId) continue;
      const url = await getAudioUrl(sentence.audioBlobId);
      if (!url) continue;

      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        buffers.set(sentence.id, audioBuffer);
      } catch (e) {
        console.error('Failed to decode audio:', e);
      }
    }

    return buffers;
  }, [project, getAudioContext]);

  // 播放
  const play = useCallback(async () => {
    if (!project) return;
    const ctx = getAudioContext();

    // 停止之前的播放
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }

    const buffers = await loadBuffers();
    if (buffers.size === 0) {
      setPlaying(false);
      return;
    }

    // 计算总时长和当前应该播放的句子
    let accumulatedTime = 0;
    const schedule: Array<{ sentenceId: string; buffer: AudioBuffer; startTime: number; offset: number }> = [];

    for (const sentence of project.sentences) {
      if (!sentence.audioBlobId || !sentence.audioDuration) continue;
      const buffer = buffers.get(sentence.id);
      if (!buffer) continue;

      const char = project.characters.find((c) => c.id === sentence.characterId);
      const pause = (char?.pauseAfterSentence ?? 300) / 1000;
      const clipEnd = accumulatedTime + sentence.audioDuration;

      // 如果当前播放时间在这个片段内或之后
      if (currentTime < clipEnd + pause) {
        const clipStart = accumulatedTime;
        const offset = Math.max(0, currentTime - clipStart);

        if (offset < sentence.audioDuration) {
          schedule.push({
            sentenceId: sentence.id,
            buffer,
            startTime: ctx.currentTime + (accumulatedTime - currentTime > 0 ? accumulatedTime - currentTime : 0),
            offset,
          });
        }
      }

      accumulatedTime += sentence.audioDuration + pause;
    }

    // 创建 GainNode（音量控制）
    if (!gainRef.current) {
      gainRef.current = ctx.createGain();
      gainRef.current.connect(ctx.destination);
    }
    gainRef.current.gain.value = 1.0;

    // 安排播放
    for (const item of schedule) {
      const source = ctx.createBufferSource();
      source.buffer = item.buffer;
      source.connect(gainRef.current!);
      const delay = Math.max(0, item.startTime - ctx.currentTime);
      source.start(ctx.currentTime + delay, item.offset);
      sourceRef.current = source;

      // 播放结束时更新时间
      source.onended = () => {
        if (isPlayingRef.current) {
          // 找到下一句
          const idx = project.sentences.findIndex((s) => s.id === item.sentenceId);
          if (idx < project.sentences.length - 1) {
            const next = project.sentences[idx + 1];
            seek(next.startTime || 0);
          } else {
            setPlaying(false);
            seek(0);
          }
        }
      };
    }

    startTimeRef.current = ctx.currentTime;
    offsetRef.current = currentTime;
    isPlayingRef.current = true;
  }, [project, currentTime, getAudioContext, loadBuffers, seek, setPlaying]);

  // 暂停
  const pause = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
      offsetRef.current = offsetRef.current + elapsed;
    }
    isPlayingRef.current = false;
  }, []);

  // seek
  const audioSeek = useCallback((time: number) => {
    offsetRef.current = time;
    if (isPlayingRef.current) {
      // 如果正在播放，重新从 seek 位置开始
      play();
    }
  }, [play]);

  // 清理
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { play, pause, seek: audioSeek };
}
