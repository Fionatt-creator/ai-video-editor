/****************************
 * VoiceCraft Pro - 导出面板
 ****************************/
import { useState } from 'react';
import { useStore } from '../store';
import { Download, Music, Type, Film, Archive } from 'lucide-react';

export default function ExportPanel() {
  const project = useStore((s) => s.currentProject);
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'wav'>('mp3');
  const [subtitleFormat, setSubtitleFormat] = useState<'srt' | 'vtt'>('srt');

  if (!project) return null;

  const exportAudio = () => {
    // TODO: 调用后端混音导出
    alert('导出功能需后端支持，当前为前端原型');
  };

  const exportSubtitle = () => {
    let content = '';
    if (subtitleFormat === 'srt') {
      project.subtitleCues.forEach((cue, i) => {
        content += `${i + 1}\n`;
        content += `${formatSrtTime(cue.startTime)} --> ${formatSrtTime(cue.endTime)}\n`;
        content += `${cue.text}${cue.translation ? `\n${cue.translation}` : ''}\n\n`;
      });
    }
    downloadFile(content, `${project.name}.${subtitleFormat}`, 'text/plain');
  };

  const exportProjectFile = () => {
    const data = JSON.stringify(project, null, 2);
    downloadFile(data, `${project.name}.voicecraft.json`, 'application/json');
  };

  return (
    <div className="space-y-4">
      {/* 合成音频 */}
      <div className="border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Music size={14} className="text-blue-400" />
          <span className="text-sm font-medium">合成音频</span>
        </div>
        <div className="flex gap-2 mb-3">
          {(['mp3', 'wav'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setAudioFormat(fmt)}
              className={`px-2 py-1 text-xs rounded ${
                audioFormat === fmt
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={exportAudio}
          className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded flex items-center justify-center gap-1"
        >
          <Download size={12} />
          下载音频
        </button>
      </div>

      {/* 字幕 */}
      <div className="border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Type size={14} className="text-green-400" />
          <span className="text-sm font-medium">字幕文件</span>
        </div>
        <div className="flex gap-2 mb-3">
          {(['srt', 'vtt'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSubtitleFormat(fmt)}
              className={`px-2 py-1 text-xs rounded ${
                subtitleFormat === fmt
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={exportSubtitle}
          className="w-full py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded flex items-center justify-center gap-1"
        >
          <Download size={12} />
          下载字幕
        </button>
      </div>

      {/* 工程文件 */}
      <div className="border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Archive size={14} className="text-purple-400" />
          <span className="text-sm font-medium">工程文件</span>
        </div>
        <button
          onClick={exportProjectFile}
          className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded flex items-center justify-center gap-1"
        >
          <Download size={12} />
          导出 .voicecraft
        </button>
      </div>
    </div>
  );
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
