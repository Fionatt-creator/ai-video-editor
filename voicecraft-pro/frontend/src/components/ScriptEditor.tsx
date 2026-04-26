/****************************
 * VoiceCraft Pro - 文稿编辑器
 ****************************/
import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Edit3, RotateCcw, MoreHorizontal, GripVertical, Scissors, ArrowUp, ArrowDown } from 'lucide-react';
import { Sentence } from '../types';

function SentenceRow({ sentence, character, isHighlighted }: {
  sentence: Sentence;
  character: { name: string; color: string } | undefined;
  isHighlighted: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(sentence.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const generateSingle = useStore((s) => s.generateSingle);
  const updateSentence = useStore((s) => s.updateSentence);
  const splitSentence = useStore((s) => s.splitSentence);
  const mergeSentenceUp = useStore((s) => s.mergeSentenceUp);
  const moveSentence = useStore((s) => s.moveSentence);
  const removeSentence = useStore((s) => s.removeSentence);
  const setSelectedSentence = useStore((s) => s.setSelectedSentence);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const statusIcon = {
    draft: '○',
    generated: '✓',
    modified: '~',
    error: '✗',
  };

  const statusColor = {
    draft: 'text-gray-500',
    generated: 'text-green-400',
    modified: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div
      className={`group flex items-start gap-2 px-2 py-1.5 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors ${
        isHighlighted ? 'sentence-highlight' : ''
      }`}
      onClick={() => setSelectedSentence(sentence.id)}
    >
      {/* 行号 */}
      <span className="text-xs text-gray-600 w-6 text-right shrink-0 pt-1 select-none">
        {sentence.index + 1}
      </span>

      {/* 角色标签 */}
      {character && (
        <div
          className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 mt-0.5 select-none"
          style={{ backgroundColor: character.color + '30', color: character.color }}
        >
          {character.name}
        </div>
      )}

      {/* 台词文本 */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => {
              if (editText.trim() !== sentence.text) {
                updateSentence(sentence.id, { text: editText.trim() });
              }
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editText.trim() !== sentence.text) {
                  updateSentence(sentence.id, { text: editText.trim() });
                }
                setIsEditing(false);
              }
              if (e.key === 'Escape') {
                setEditText(sentence.text);
                setIsEditing(false);
              }
            }}
            className="w-full bg-gray-900 border border-blue-500 rounded px-2 py-0.5 text-sm focus:outline-none"
          />
        ) : (
          <span
            className="text-sm cursor-text block py-0.5"
            onDoubleClick={() => {
              setEditText(sentence.text);
              setIsEditing(true);
            }}
          >
            {sentence.text}
          </span>
        )}
      </div>

      {/* 状态与操作 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {/* 状态 */}
        <span className={`text-xs ${statusColor[sentence.status]}`} title={sentence.status}>
          {statusIcon[sentence.status]}
        </span>

        {/* 重新生成 */}
        {(sentence.status === 'modified' || sentence.status === 'error' || sentence.status === 'draft') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              generateSingle(sentence.id);
            }}
            className="p-1 rounded hover:bg-gray-700 text-blue-400"
            title="重新生成"
          >
            <RotateCcw size={13} />
          </button>
        )}

        {/* 更多操作 */}
        <div className="relative group/menu">
          <button className="p-1 rounded hover:bg-gray-700 text-gray-400">
            <MoreHorizontal size={13} />
          </button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 min-w-[140px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-700 text-left"
            >
              <Edit3 size={12} /> 编辑
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const mid = Math.floor(sentence.text.length / 2);
                splitSentence(sentence.id, mid);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-700 text-left"
            >
              <Scissors size={12} /> 拆分
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                mergeSentenceUp(sentence.id);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-700 text-left"
            >
              <ArrowUp size={12} /> 合并上一句
            </button>
            <div className="border-t border-gray-700 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveSentence(sentence.id, 'up');
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-700 text-left"
            >
              <ArrowUp size={12} /> 上移
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveSentence(sentence.id, 'down');
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-700 text-left"
            >
              <ArrowDown size={12} /> 下移
            </button>
            <div className="border-t border-gray-700 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSentence(sentence.id);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-red-900/30 text-red-400 text-left"
            >
              <Trash2 size={12} /> 删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScriptEditor() {
  const project = useStore((s) => s.currentProject);
  const currentTime = useStore((s) => s.currentTime);
  const selectedSentenceId = useStore((s) => s.selectedSentenceId);
  const setImportModalOpen = useStore((s) => s.setImportModalOpen);

  if (!project) return null;

  // 计算当前播放时间对应的句子
  const currentSentenceId = project.sentences.find(
    (s) => s.startTime !== undefined && s.endTime !== undefined &&
      currentTime >= s.startTime && currentTime < s.endTime
  )?.id;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-900">
      {/* 头部 */}
      <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium">文稿编辑器</span>
        <button
          onClick={() => setImportModalOpen(true)}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs rounded transition-colors"
        >
          导入文稿
        </button>
      </div>

      {/* 句子列表 */}
      <div className="flex-1 overflow-y-auto">
        {project.sentences.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
            <FileText size={32} className="opacity-50" />
            <p className="text-sm">暂无文稿</p>
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
            >
              导入文稿
            </button>
          </div>
        ) : (
          project.sentences.map((sentence) => {
            const character = project.characters.find((c) => c.id === sentence.characterId);
            const isHighlighted = sentence.id === currentSentenceId || sentence.id === selectedSentenceId;
            return (
              <SentenceRow
                key={sentence.id}
                sentence={sentence}
                character={character}
                isHighlighted={isHighlighted}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

import { FileText, Trash2 } from 'lucide-react';
