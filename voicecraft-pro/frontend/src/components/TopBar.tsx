/****************************
 * VoiceCraft Pro - 顶部工具栏
 ****************************/
import { useStore } from '../store';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, Settings, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const project = useStore((s) => s.currentProject);
  const isPlaying = useStore((s) => s.isPlaying);
  const isGenerating = useStore((s) => s.isGenerating);
  const generateProgress = useStore((s) => s.generateProgress);
  const setPlaying = useStore((s) => s.setPlaying);
  const generateAll = useStore((s) => s.generateAll);
  const setActivePanel = useStore((s) => s.setActivePanel);

  if (!project) return null;

  return (
    <div className="h-12 border-b border-gray-700 bg-gray-800 flex items-center px-3 gap-3 shrink-0">
      <Link to="/" className="text-gray-400 hover:text-white transition-colors">
        <ChevronLeft size={20} />
      </Link>

      <div className="flex items-center gap-2 min-w-0">
        <FileText size={16} className="text-blue-400 shrink-0" />
        <span className="text-sm font-medium truncate">{project.name}</span>
        <span className="text-xs text-gray-500 shrink-0">
          {project.characters.length} 角色 · {project.sentences.length} 句
        </span>
      </div>

      <div className="flex-1" />

      {/* 播放控制 */}
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white">
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="p-1.5 rounded hover:bg-gray-700 text-white"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white">
          <SkipForward size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-700" />

      {/* 生成按钮 */}
      <button
        onClick={generateAll}
        disabled={isGenerating}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs rounded font-medium transition-colors"
      >
        {isGenerating ? `生成中 ${generateProgress}%` : '生成音频'}
      </button>

      <div className="w-px h-6 bg-gray-700" />

      {/* 导出 */}
      <button
        onClick={() => setActivePanel('export')}
        className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
        title="导出"
      >
        <Download size={16} />
      </button>

      <Link
        to="/settings"
        className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
        title="设置"
      >
        <Settings size={16} />
      </Link>
    </div>
  );
}
