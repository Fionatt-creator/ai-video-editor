/****************************
 * VoiceCraft Pro - 设置页面
 ****************************/
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Key, BarChart3, Palette, Keyboard, Database } from 'lucide-react';

export default function Settings() {
  const project = useStore((s) => s.currentProject);
  const updateProject = useStore((s) => s.updateProject);

  return (
    <div className="h-full flex flex-col">
      {/* 顶部 */}
      <div className="h-14 border-b border-gray-700 bg-gray-800 flex items-center px-4 gap-3">
        <Link to="/" className="text-gray-400 hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <Palette size={18} className="text-blue-400" />
        <span className="font-medium">设置</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
        {/* 画布默认底色 */}
        <section className="mb-8">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Palette size={14} className="text-blue-400" />
            默认画布底色
          </h3>
          <div className="flex gap-3">
            {[
              { label: '深灰', value: '#1a1a1a' },
              { label: '浅灰', value: '#f5f5f5' },
              { label: '深蓝', value: '#1e3a5f' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateProject({ canvasBackground: opt.value })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  project?.canvasBackground === opt.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: opt.value }} />
                <span className="text-xs">{opt.label}</span>
              </button>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={project?.canvasBackground || '#1a1a1a'}
                onChange={(e) => updateProject({ canvasBackground: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
              />
              <span className="text-xs text-gray-500">自定义</span>
            </div>
          </div>
        </section>

        {/* TTS 模型设置 */}
        <section className="mb-8">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Key size={14} className="text-green-400" />
            TTS 模型
          </h3>
          <div className="flex gap-2">
            {(['eleven_multilingual_v2', 'eleven_turbo_v2'] as const).map((model) => (
              <button
                key={model}
                onClick={() =>
                  updateProject({
                    globalSettings: { ...project!.globalSettings, elevenlabsModel: model },
                  })
                }
                className={`px-3 py-1.5 text-xs rounded ${
                  project?.globalSettings.elevenlabsModel === model
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {model === 'eleven_multilingual_v2' ? 'Multilingual v2 (高质量)' : 'Turbo v2 (快速)'}
              </button>
            ))}
          </div>
        </section>

        {/* 快捷键 */}
        <section className="mb-8">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Keyboard size={14} className="text-yellow-400" />
            快捷键
          </h3>
          <div className="border border-gray-700 rounded-lg divide-y divide-gray-700">
            {[
              { key: 'Space', action: '播放 / 暂停' },
              { key: 'R', action: '重新生成当前句' },
              { key: 'S', action: '拆分句子' },
              { key: 'Shift + S', action: '合并上一句' },
              { key: 'Ctrl + Enter', action: '全文生成' },
              { key: 'Delete', action: '删除句子' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-gray-400">{item.action}</span>
                <kbd className="px-2 py-0.5 bg-gray-700 rounded text-[10px] font-mono text-gray-300">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* 数据管理 */}
        <section className="mb-8">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Database size={14} className="text-purple-400" />
            数据管理
          </h3>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              所有数据存储在浏览器本地（IndexedDB）。工程文件可导出为 .voicecraft.json 备份。
            </p>
            <button
              onClick={() => {
                if (confirm('确定要清理所有缓存音频吗？工程数据将保留。')) {
                  // TODO: 清理音频缓存
                  alert('清理功能开发中');
                }
              }}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs rounded transition-colors"
            >
              清理缓存音频
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
