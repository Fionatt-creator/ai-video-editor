/****************************
 * VoiceCraft Pro - 音频画布 / 时间轴
 ****************************/
import { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { getAudioUrl } from '../utils/db';

export default function Timeline() {
  const project = useStore((s) => s.currentProject);
  const currentTime = useStore((s) => s.currentTime);
  const isPlaying = useStore((s) => s.isPlaying);
  const seek = useStore((s) => s.seek);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(60); // 像素/秒

  if (!project) return null;

  const totalDuration = project.sentences.reduce((sum, s) => {
    const char = project.characters.find((c) => c.id === s.characterId);
    const pause = (char?.pauseAfterSentence ?? 300) / 1000;
    return sum + (s.audioDuration || 0) + pause;
  }, 0);

  const canvasWidth = Math.max(totalDuration * scale, 800);

  return (
    <div className="h-48 border-t border-gray-700 bg-gray-800/50 flex flex-col">
      {/* 时间刻度尺 */}
      <div className="h-6 border-b border-gray-700 bg-gray-800 relative overflow-hidden">
        {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 text-[10px] text-gray-500 select-none"
            style={{ left: i * 10 * scale }}
          >
            {`${Math.floor(i / 6)}:${((i % 6) * 10).toString().padStart(2, '0')}`}
          </div>
        ))}
      </div>

      {/* 轨道区域 */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-x-auto overflow-y-hidden canvas-grid"
        onClick={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = e.clientX - rect.left + canvasRef.current!.scrollLeft;
          seek(x / scale);
        }}
      >
        <div className="relative h-full" style={{ width: canvasWidth }}>
          {/* 轨道 */}
          {project.tracks.map((track, trackIdx) => (
            <div
              key={track.id}
              className="absolute left-0 right-0 h-10 border-b border-gray-700/30 flex items-center"
              style={{ top: trackIdx * 40 }}
            >
              {/* 轨道标签 */}
              <div
                className="absolute left-0 w-20 h-full flex items-center px-2 text-xs font-medium border-r border-gray-700/50 bg-gray-800/80 z-10"
                style={{ color: track.color || '#9ca3af' }}
              >
                {track.name}
              </div>

              {/* 音频片段 */}
              {track.clips.map((clip) => {
                const sentence = project.sentences.find((s) => s.id === clip.sentenceId);
                const isGenerated = !!sentence?.audioBlobId;

                return (
                  <div
                    key={clip.id}
                    className={`absolute h-7 rounded top-1.5 cursor-pointer overflow-hidden ${
                      isGenerated
                        ? 'bg-blue-500/40 border border-blue-500/60'
                        : 'bg-gray-600/30 border border-gray-600/50 border-dashed'
                    }`}
                    style={{
                      left: clip.startTime * scale + 80,
                      width: Math.max(clip.duration * scale, 20),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      seek(clip.startTime);
                    }}
                    title={sentence?.text || ''}
                  >
                    <div className="px-1.5 py-0.5 text-[10px] truncate text-gray-300">
                      {sentence?.text?.slice(0, 20) || '未生成'}
                    </div>
                    {/* 简易波形占位 */}
                    {isGenerated && (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 flex items-end gap-px px-1">
                        {Array.from({ length: 20 }, (_, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-blue-400/50 rounded-sm"
                            style={{ height: `${20 + Math.random() * 80}%` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* 播放头 */}
          <div
            className="playhead"
            style={{ left: currentTime * scale + 80 }}
          />
        </div>
      </div>

      {/* 底部缩放控制 */}
      <div className="h-6 border-t border-gray-700 flex items-center px-2 gap-2">
        <span className="text-[10px] text-gray-500">缩放</span>
        <input
          type="range"
          min={20}
          max={200}
          value={scale}
          onChange={(e) => setScale(parseInt(e.target.value))}
          className="w-24 accent-blue-500"
        />
        <span className="text-[10px] text-gray-500">{scale}px/s</span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-500">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
