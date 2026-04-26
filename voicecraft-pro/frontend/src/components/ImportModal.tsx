/****************************
 * VoiceCraft Pro - 导入文稿弹窗
 ****************************/
import { useState } from 'react';
import { useStore } from '../store';
import { X, FileText, Upload } from 'lucide-react';

export default function ImportModal() {
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const importScript = useStore((s) => s.importScript);
  const setImportModalOpen = useStore((s) => s.setImportModalOpen);

  const handleImport = () => {
    if (!text.trim()) return;
    importScript(text.trim());
    setImportModalOpen(false);
    setText('');
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setText(text);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            <span className="font-medium">导入文稿</span>
          </div>
          <button
            onClick={() => setImportModalOpen(false)}
            className="p-1 rounded hover:bg-gray-700 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* 粘贴区域 */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">粘贴文本</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`格式示例：\n旁白：很久很久以前...\n小明：妈妈，我想出去！\n小红：外面很危险。`}
              className="w-full h-48 bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 或 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500">或</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* 拖拽上传 */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'
            }`}
          >
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-400">拖拽文件到此处</p>
            <p className="text-xs text-gray-500 mt-1">支持 .txt .docx .pdf .csv</p>
            <input
              type="file"
              accept=".txt,.docx,.pdf,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block mt-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs rounded cursor-pointer"
            >
              选择文件
            </label>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={() => setImportModalOpen(false)}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!text.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-sm rounded font-medium"
          >
            导入并识别角色
          </button>
        </div>
      </div>
    </div>
  );
}
