/****************************
 * VoiceCraft Pro - 项目管理页面
 ****************************/
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { listProjectsFromDB, deleteProjectFromDB } from '../utils/db';
import { FolderOpen, Plus, Trash2, Clock, Users, FileText } from 'lucide-react';
import type { ProjectRecord } from '../utils/db';

export default function Projects() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const createProject = useStore((s) => s.createProject);
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const list = await listProjectsFromDB();
    setProjects(list);
  };

  const handleCreate = () => {
    const name = newName.trim() || '未命名工程';
    createProject(name);
    setNewName('');
    setShowNew(false);
    // 导航到工作台
    window.location.href = '/workshop';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个工程吗？音频数据也将被删除。')) return;
    await deleteProjectFromDB(id);
    await loadProjects();
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部 */}
      <div className="h-14 border-b border-gray-700 bg-gray-800 flex items-center px-6">
        <FolderOpen size={20} className="text-blue-400 mr-2" />
        <span className="text-lg font-medium">工程管理</span>
      </div>

      {/* 内容 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* 新建工程 */}
        <div className="mb-6">
          {showNew ? (
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入工程名称"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium"
              >
                创建
              </button>
              <button
                onClick={() => { setShowNew(false); setNewName(''); }}
                className="px-3 py-2 text-gray-400 hover:text-white text-sm"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              新建工程
            </button>
          )}
        </div>

        {/* 工程列表 */}
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">暂无工程</p>
              <p className="text-xs mt-1">点击上方按钮创建新工程</p>
            </div>
          ) : (
            projects.map((p) => {
              const data = p.data;
              const hasAudio = data.sentences.some((s) => s.audioBlobId);
              return (
                <div
                  key={p.id}
                  className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/workshop/${p.id}`}
                        className="text-sm font-medium hover:text-blue-400 transition-colors"
                      >
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(p.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {data.characters.length} 角色
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          {data.sentences.length} 句
                        </span>
                        <span className={`flex items-center gap-1 ${hasAudio ? 'text-green-400' : 'text-gray-600'}`}>
                          <FileText size={12} />
                          {hasAudio ? '已生成音频' : '未生成'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/workshop/${p.id}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
                      >
                        打开
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
