/****************************
 * VoiceCraft Pro - 角色面板（左侧）
 ****************************/
import { useState } from 'react';
import { useStore } from '../store';
import { User, Volume2, Plus, Trash2, Merge, ChevronDown, Settings2 } from 'lucide-react';
import { Character } from '../types';

function CharacterCard({ character }: { character: Character }) {
  const [expanded, setExpanded] = useState(false);
  const updateCharacter = useStore((s) => s.updateCharacter);
  const removeCharacter = useStore((s) => s.removeCharacter);
  const project = useStore((s) => s.currentProject);

  const sentenceCount = project?.sentences.filter((s) => s.characterId === character.id).length || 0;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-700/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: character.color }} />
        <span className="text-sm font-medium flex-1 truncate">{character.name}</span>
        <span className="text-xs text-gray-500">{sentenceCount}句</span>
        <ChevronDown
          size={14}
          className={`text-gray-500 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-700/50">
          {/* 音色绑定 */}
          <div className="pt-2">
            <label className="text-xs text-gray-400 block mb-1">音色 Voice ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={character.voiceId}
                onChange={(e) => updateCharacter(character.id, { voiceId: e.target.value })}
                placeholder="粘贴 ElevenLabs Voice ID"
                className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  // TODO: 打开音色选择弹窗
                }}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs shrink-0"
              >
                选择
              </button>
            </div>
          </div>

          {/* 稳定性 / 相似度 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">稳定性</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={character.voiceSettings.stability}
                onChange={(e) =>
                  updateCharacter(character.id, {
                    voiceSettings: { ...character.voiceSettings, stability: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-blue-500"
              />
              <span className="text-xs text-gray-500">{character.voiceSettings.stability.toFixed(2)}</span>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">相似度</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={character.voiceSettings.similarityBoost}
                onChange={(e) =>
                  updateCharacter(character.id, {
                    voiceSettings: { ...character.voiceSettings, similarityBoost: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-blue-500"
              />
              <span className="text-xs text-gray-500">{character.voiceSettings.similarityBoost.toFixed(2)}</span>
            </div>
          </div>

          {/* 停顿设置 */}
          <div className="flex items-center gap-2">
            <Settings2 size={12} className="text-gray-500" />
            <span className="text-xs text-gray-400">句尾停顿:</span>
            <input
              type="number"
              value={character.pauseAfterSentence}
              onChange={(e) =>
                updateCharacter(character.id, { pauseAfterSentence: parseInt(e.target.value) || 300 })
              }
              className="w-16 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-xs text-right"
            />
            <span className="text-xs text-gray-500">ms</span>
          </div>

          {/* 操作 */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => removeCharacter(character.id)}
              className="flex items-center gap-1 px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded transition-colors"
            >
              <Trash2 size={12} />
              删除
            </button>
            <button
              onClick={() => {
                // TODO: 合并角色弹窗
              }}
              className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
            >
              <Merge size={12} />
              合并
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CharacterPanel() {
  const project = useStore((s) => s.currentProject);
  const addCharacter = useStore((s) => s.addCharacter);
  const [newName, setNewName] = useState('');

  if (!project) return null;

  return (
    <div className="w-64 border-r border-gray-700 bg-gray-800/50 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2">
        <User size={16} className="text-blue-400" />
        <span className="text-sm font-medium">角色面板</span>
        <span className="text-xs text-gray-500">({project.characters.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {project.characters.map((char) => (
          <CharacterCard key={char.id} character={char} />
        ))}

        {project.characters.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            <p>请先导入文稿</p>
            <p>系统将自动识别角色</p>
          </div>
        )}
      </div>

      {/* 添加角色 */}
      <div className="p-2 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新角色名"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                addCharacter(newName.trim());
                setNewName('');
              }
            }}
            className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => {
              if (newName.trim()) {
                addCharacter(newName.trim());
                setNewName('');
              }
            }}
            disabled={!newName.trim()}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-xs rounded"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
