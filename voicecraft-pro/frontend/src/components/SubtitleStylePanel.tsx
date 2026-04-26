/****************************
 * VoiceCraft Pro - 字幕样式面板
 ****************************/
import { useStore } from '../store';

export default function SubtitleStylePanel() {
  const project = useStore((s) => s.currentProject);
  const updateProject = useStore((s) => s.updateProject);

  if (!project) return null;

  const style = project.subtitleStyle;

  const updateStyle = (patch: Partial<typeof style>) => {
    updateProject({
      subtitleStyle: { ...style, ...patch },
    });
  };

  return (
    <div className="space-y-4">
      {/* 字体 */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">字体</label>
        <input
          type="text"
          value={style.fontFamily}
          onChange={(e) => updateStyle({ fontFamily: e.target.value })}
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 字号 */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">字号 {style.fontSize}px</label>
        <input
          type="range"
          min={12}
          max={72}
          value={style.fontSize}
          onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* 颜色 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 block mb-1">文字颜色</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={style.color}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={style.color}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">描边颜色</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={style.strokeColor}
              onChange={(e) => updateStyle({ strokeColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={style.strokeColor}
              onChange={(e) => updateStyle({ strokeColor: e.target.value })}
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 描边宽度 */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">描边宽度 {style.strokeWidth}px</label>
        <input
          type="range"
          min={0}
          max={8}
          value={style.strokeWidth}
          onChange={(e) => updateStyle({ strokeWidth: parseInt(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* 背景透明度 */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">背景透明度 {Math.round(style.backgroundOpacity * 100)}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(style.backgroundOpacity * 100)}
          onChange={(e) => updateStyle({ backgroundOpacity: parseInt(e.target.value) / 100 })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* 位置 */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">位置</label>
        <div className="flex gap-2">
          {(['top', 'center', 'bottom'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => updateStyle({ position: pos })}
              className={`flex-1 py-1 text-xs rounded ${
                style.position === pos
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {pos === 'top' ? '顶部' : pos === 'center' ? '居中' : '底部'}
            </button>
          ))}
        </div>
      </div>

      {/* 行间距 */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">中英行间距 {style.lineSpacing}px</label>
        <input
          type="range"
          min={0}
          max={24}
          value={style.lineSpacing}
          onChange={(e) => updateStyle({ lineSpacing: parseInt(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* 预览 */}
      <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
        <p className="text-xs text-gray-500 mb-2">预览</p>
        <div
          className="text-center py-4 rounded"
          style={{
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            color: style.color,
            textShadow: `${style.strokeColor} 0 0 ${style.strokeWidth}px`,
            backgroundColor: `rgba(0,0,0,${style.backgroundOpacity})`,
          }}
        >
          <div>这是中文字幕</div>
          <div style={{ marginTop: style.lineSpacing }}>This is English subtitle</div>
        </div>
      </div>
    </div>
  );
}
