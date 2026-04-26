/****************************
 * VoiceCraft Pro - 主工作台页面
 ****************************/
import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import CharacterPanel from '../components/CharacterPanel';
import ScriptEditor from '../components/ScriptEditor';
import Timeline from '../components/Timeline';
import ImportModal from '../components/ImportModal';
import ExportPanel from '../components/ExportPanel';
import SubtitleStylePanel from '../components/SubtitleStylePanel';
import { loadProjectFromDB } from '../utils/db';
import { useAudioEngine } from '../hooks/useAudioEngine';

export default function Workshop() {
  const { projectId } = useParams();
  const currentProject = useStore((s) => s.currentProject);
  const setProject = useStore((s) => s.setProject);
  const createProject = useStore((s) => s.createProject);
  const isImportModalOpen = useStore((s) => s.isImportModalOpen);
  const activePanel = useStore((s) => s.activePanel);
  const setActivePanel = useStore((s) => s.setActivePanel);
  const currentTime = useStore((s) => s.currentTime);
  const isPlaying = useStore((s) => s.isPlaying);
  const project = useStore((s) => s.currentProject);

  const { play, pause, seek: audioSeek } = useAudioEngine();

  // 加载工程
  useEffect(() => {
    if (projectId) {
      loadProjectFromDB(projectId).then((p) => {
        if (p) setProject(p);
      });
    } else if (!currentProject) {
      createProject('未命名工程');
    }
  }, [projectId]);

  // 自动保存
  useEffect(() => {
    if (!project) return;
    const timer = setInterval(() => {
      import('../utils/db').then(({ saveProjectToDB }) => {
        saveProjectToDB(project);
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [project]);

  // 播放同步
  useEffect(() => {
    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying]);

  // 快捷键
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        useStore.getState().setPlaying(!useStore.getState().isPlaying);
      }
      if (e.key === 'r' || e.key === 'R') {
        const selectedId = useStore.getState().selectedSentenceId;
        if (selectedId) {
          useStore.getState().generateSingle(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <TopBar />

      <div className="flex-1 flex min-h-0">
        <CharacterPanel />

        <div className="flex-1 flex flex-col min-w-0">
          <ScriptEditor />
          <Timeline />
        </div>

        {/* 右侧折叠面板 */}
        {activePanel && (
          <div className="w-64 border-l border-gray-700 bg-gray-800/50 flex flex-col">
            <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium">
                {activePanel === 'export' ? '导出' : '字幕样式'}
              </span>
              <button
                onClick={() => setActivePanel(null)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {activePanel === 'export' && <ExportPanel />}
              {activePanel === 'subtitle' && <SubtitleStylePanel />}
            </div>
          </div>
        )}
      </div>

      {isImportModalOpen && <ImportModal />}
    </div>
  );
}
