import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Scissors, Settings, Play, Pause, 
  SkipBack, SkipForward, Trash2, RotateCcw, 
  Check, Loader2, Film, Image, Video,
  ChevronLeft, Clock, Zap
} from 'lucide-react';
import './index.css';

// Types
interface VideoClip {
  id: string;
  startTime: number;
  endTime: number;
  type: 'keep' | 'remove' | 'highlight';
  confidence: number;
  thumbnail?: string;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
}

// Mock AI Analysis
const mockAnalyzeVideo = async (
  _videoFile: File,
  onProgress: (progress: number, step: string) => void
): Promise<VideoClip[]> => {
  // Mock duration: 3 minutes
  const clips: VideoClip[] = [];
  
  // Simulate processing steps
  const steps = [
    { label: '提取音频', duration: 500 },
    { label: '语音识别', duration: 800 },
    { label: '分析静音片段', duration: 600 },
    { label: '识别高光时刻', duration: 700 },
    { label: '生成时间线', duration: 400 },
  ];
  
  let currentProgress = 0;
  for (const step of steps) {
    onProgress(currentProgress, step.label);
    await new Promise(resolve => setTimeout(resolve, step.duration));
    currentProgress += 100 / steps.length;
  }
  
  onProgress(100, '完成');
  
  // Generate mock clips
  const segments = [
    { start: 0, end: 25, type: 'highlight' as const, confidence: 95 },
    { start: 25, end: 32, type: 'remove' as const, confidence: 88 },
    { start: 32, end: 58, type: 'keep' as const, confidence: 82 },
    { start: 58, end: 65, type: 'remove' as const, confidence: 91 },
    { start: 65, end: 95, type: 'highlight' as const, confidence: 90 },
    { start: 95, end: 102, type: 'remove' as const, confidence: 85 },
    { start: 102, end: 140, type: 'keep' as const, confidence: 78 },
    { start: 140, end: 150, type: 'remove' as const, confidence: 92 },
    { start: 150, end: 180, type: 'highlight' as const, confidence: 88 },
  ];
  
  segments.forEach((seg, index) => {
    clips.push({
      id: `clip-${index}`,
      startTime: seg.start,
      endTime: seg.end,
      type: seg.type,
      confidence: seg.confidence,
    });
  });
  
  return clips;
};

// Utility functions
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getClipColor = (type: VideoClip['type']): string => {
  switch (type) {
    case 'highlight':
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    case 'remove':
      return '#444';
    case 'keep':
    default:
      return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
  }
};

// Components
const Navbar: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [
    { num: 1, label: '上传素材' },
    { num: 2, label: 'AI 分析' },
    { num: 3, label: '智能剪辑' },
    { num: 4, label: '人工精修' },
    { num: 5, label: '导出成片' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-6 h-6 text-[#667eea]" />
          <span className="text-xl font-bold gradient-text">AI 剪辑助手</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`flex items-center gap-2 text-sm transition-colors ${
                currentStep === step.num
                  ? 'text-[#667eea]'
                  : currentStep > step.num
                  ? 'text-[#10b981]'
                  : 'text-white/40'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  currentStep === step.num
                    ? 'bg-[#667eea] text-white'
                    : currentStep > step.num
                    ? 'bg-[#10b981] text-white'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {currentStep > step.num ? <Check className="w-3 h-3" /> : step.num}
              </div>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

const UploadPage: React.FC<{
  onUpload: (file: File) => void;
}> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [recentFiles] = useState([
    { name: '产品发布会.mp4', duration: '12:30', date: '2天前' },
    { name: '教程录制.mov', duration: '08:45', date: '3天前' },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">开始创作</h1>
          <p className="text-white/50">拖拽视频到下方，或点击选择文件</p>
        </div>

        <div
          className={`upload-zone rounded-2xl p-16 text-center cursor-pointer ${
            isDragging ? 'dragover' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center">
            <Upload className="w-10 h-10 text-[#667eea]" />
          </div>
          <p className="text-xl mb-2">点击或拖拽上传视频</p>
          <p className="text-sm text-white/40">支持 MP4, MOV, AVI 格式，最大 500MB</p>
        </div>

        {recentFiles.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm text-white/40 mb-4">最近项目</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="w-full h-24 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 mb-3 flex items-center justify-center">
                    <Film className="w-8 h-8 text-white/40" />
                  </div>
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-white/40">{file.duration} · {file.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-xl p-6">
            <Zap className="w-8 h-8 text-[#667eea] mb-4" />
            <h3 className="font-semibold mb-2">AI 智能剪辑</h3>
            <p className="text-sm text-white/50">自动识别静音、语气词，提取高光片段</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <Clock className="w-8 h-8 text-[#667eea] mb-4" />
            <h3 className="font-semibold mb-2">节省时间</h3>
            <p className="text-sm text-white/50">把 2 小时的粗剪工作压缩到 5 分钟</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <Settings className="w-8 h-8 text-[#667eea] mb-4" />
            <h3 className="font-semibold mb-2">人工精修</h3>
            <p className="text-sm text-white/50">可视化时间轴，拖拽调整，完全可控</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcessingPage: React.FC<{
  file: File;
  onComplete: (clips: VideoClip[]) => void;
}> = ({ file, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('准备分析...');
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: '上传完成', status: 'completed' },
    { id: 'audio', label: '提取音频', status: 'processing' },
    { id: 'voice', label: '语音识别', status: 'pending' },
    { id: 'silence', label: '分析静音片段', status: 'pending' },
    { id: 'highlight', label: '识别高光时刻', status: 'pending' },
    { id: 'timeline', label: '生成时间线', status: 'pending' },
  ]);

  useEffect(() => {
    const analyze = async () => {
      const clips = await mockAnalyzeVideo(file, (prog, step) => {
        setProgress(prog);
        setCurrentStep(step);
        
        // Update step statuses
        setSteps(prev => {
          const newSteps = [...prev];
          const stepIndex = newSteps.findIndex(s => s.label === step);
          if (stepIndex > 0) {
            newSteps[stepIndex - 1].status = 'completed';
          }
          if (stepIndex >= 0) {
            newSteps[stepIndex].status = 'processing';
          }
          return newSteps;
        });
      });
      
      // Mark all as completed
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
      setTimeout(() => onComplete(clips), 500);
    };
    
    analyze();
  }, [file, onComplete]);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <div className="text-center mb-12">
          <div className="relative w-48 h-48 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <circle
                cx="96"
                cy="96"
                r="90"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="90"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                className="progress-ring-fill"
                style={{ strokeDasharray: circumference, strokeDashoffset }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold">{Math.round(progress)}%</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mb-2">AI 正在分析视频...</h2>
          <p className="text-white/50">{currentStep}</p>
          <p className="text-sm text-white/40 mt-2">预计剩余时间: {Math.ceil((100 - progress) / 20)} 分钟</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 py-3 ${
                step.status === 'processing' ? 'bg-[#667eea]/10 -mx-6 px-6' : ''
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.status === 'completed'
                  ? 'bg-[#10b981]'
                  : step.status === 'processing'
                  ? 'bg-[#667eea]'
                  : 'bg-white/10'
              }`}>
                {step.status === 'completed' ? (
                  <Check className="w-4 h-4" />
                ) : step.status === 'processing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <span className={step.status === 'pending' ? 'text-white/40' : ''}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-[#667eea]/10 rounded-xl">
          <p className="text-sm text-[#667eea]">
            <span className="font-semibold">💡 分析中：</span>
            AI 正在识别视频中的语音内容、静音片段和高光时刻，请稍候...
          </p>
        </div>
      </div>
    </div>
  );
};

const EditorPage: React.FC<{
  clips: VideoClip[];
  onExport: () => void;
  onBack: () => void;
}> = ({ clips: initialClips, onExport, onBack }) => {
  const [clips, setClips] = useState<VideoClip[]>(initialClips);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime] = useState(0);
  const [deletedClips, setDeletedClips] = useState<VideoClip[]>([]);

  const totalDuration = clips.filter(c => c.type !== 'remove').reduce((sum, c) => sum + (c.endTime - c.startTime), 0);
  const originalDuration = initialClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);
  const timeSaved = originalDuration - totalDuration;

  const handleDeleteClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setDeletedClips(prev => [...prev, { ...clip, type: 'remove' }]);
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, type: 'remove' } : c));
    }
  };

  const handleRestoreClip = (clipId: string) => {
    const clip = deletedClips.find(c => c.id === clipId);
    if (clip) {
      setDeletedClips(prev => prev.filter(c => c.id !== clipId));
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, type: clip.confidence > 85 ? 'highlight' : 'keep' } : c));
    }
  };

  const handleToggleClipType = (clipId: string) => {
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const types: VideoClip['type'][] = ['keep', 'highlight', 'remove'];
        const currentIndex = types.indexOf(c.type);
        const nextType = types[(currentIndex + 1) % types.length];
        return { ...c, type: nextType };
      }
      return c;
    }));
  };

  const getTimelineScale = () => {
    const maxTime = Math.max(...clips.map(c => c.endTime));
    const scale = 600 / maxTime;
    return scale;
  };

  const scale = getTimelineScale();

  return (
    <div className="min-h-screen pt-20 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white/5 border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
        <div className="w-px h-6 bg-white/10" />
        <button className="tool-btn flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <SkipBack className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="tool-btn flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#667eea] hover:bg-[#5a6fd6] transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button className="tool-btn flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <SkipForward className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <div className="text-sm text-white/50">
          预计节省 <span className="text-[#10b981] font-semibold">{Math.round(timeSaved / 60 * 10) / 10}</span> 分钟
        </div>
        <button 
          onClick={onExport}
          className="gradient-btn px-6 py-2 rounded-lg font-medium"
        >
          导出成片
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Preview & Timeline */}
        <div className="flex-1 flex flex-col p-6">
          {/* Preview */}
          <div className="flex-1 bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-white/60" />
              </div>
              <p className="text-white/40">点击播放预览</p>
              <p className="text-sm text-white/30 mt-2">{formatTime(currentTime)} / {formatTime(originalDuration)}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-6 bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">时间轴</span>
              <div className="flex gap-6 text-xs text-white/40">
                <span>00:00</span>
                <span>01:00</span>
                <span>02:00</span>
                <span>03:00</span>
              </div>
            </div>
            <div className="timeline-track h-20 rounded-lg relative overflow-hidden">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className={`clip absolute top-2 h-16 rounded-md cursor-pointer flex items-center justify-center text-xs font-medium ${
                    selectedClip === clip.id ? 'selected' : ''
                  }`}
                  style={{
                    left: `${clip.startTime * scale}px`,
                    width: `${(clip.endTime - clip.startTime) * scale}px`,
                    background: getClipColor(clip.type),
                    opacity: clip.type === 'remove' ? 0.3 : 1,
                  }}
                  onClick={() => setSelectedClip(clip.id)}
                >
                  {clip.type !== 'remove' && (
                    <span className="px-2 truncate">{clip.confidence}分</span>
                  )}
                </div>
              ))}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
                style={{ left: `${currentTime * scale}px` }}
              >
                <div className="absolute -top-1 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Clip List */}
        <div className="w-80 border-l border-white/10 p-6 overflow-y-auto">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            片段列表
          </h3>
          
          <div className="space-y-2 mb-6">
            {clips.filter(c => c.type !== 'remove').map((clip) => (
              <div
                key={clip.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedClip === clip.id ? 'bg-[#667eea]/20' : 'bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => setSelectedClip(clip.id)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-8 rounded"
                    style={{ background: getClipColor(clip.type) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {clip.type === 'highlight' ? '高光片段' : '保留片段'}
                    </p>
                    <p className="text-xs text-white/40">
                      {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${
                    clip.confidence >= 90 ? 'text-[#10b981]' : 'text-[#667eea]'
                  }`}>
                    {clip.confidence}分
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleClipType(clip.id); }}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    标记为{clip.type === 'highlight' ? '保留' : clip.type === 'keep' ? '删除' : '高光'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClip(clip.id); }}
                    className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {deletedClips.length > 0 && (
            <>
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-white/60">
                <Trash2 className="w-4 h-4" />
                已删除 ({deletedClips.length})
              </h3>
              <div className="space-y-2">
                {deletedClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 rounded-lg bg-white/5 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded bg-[#444]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">已删除片段</p>
                        <p className="text-xs text-white/40">
                          {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestoreClip(clip.id)}
                        className="text-xs px-2 py-1 rounded bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ExportPage: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const [selectedFormat, setSelectedFormat] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [includeSubtitle, setIncludeSubtitle] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setExportProgress(i);
    }
    
    setIsExporting(false);
    setIsComplete(true);
  };

  const formats = [
    { id: 'portrait', icon: <Video className="w-8 h-8" />, name: '竖屏版', desc: '9:16 比例\n适合抖音/视频号' },
    { id: 'landscape', icon: <Film className="w-8 h-8" />, name: '横屏版', desc: '16:9 比例\n适合 B站/YouTube' },
    { id: 'square', icon: <Image className="w-8 h-8" />, name: '方形版', desc: '1:1 比例\n适合小红书/朋友圈' },
  ];

  if (isComplete) {
    return (
      <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#10b981] flex items-center justify-center">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">导出完成！</h2>
          <p className="text-white/50 mb-8">您的视频已成功导出，可以下载了</p>
          
          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center">
                <Film className="w-8 h-8 text-[#667eea]" />
              </div>
              <div className="text-left">
                <p className="font-medium">AI剪辑成片.mp4</p>
                <p className="text-sm text-white/40">1080p · {selectedFormat === 'portrait' ? '9:16' : selectedFormat === 'landscape' ? '16:9' : '1:1'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={onBack}
              className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              返回编辑
            </button>
            <button 
              className="flex-1 gradient-btn py-3 rounded-lg font-medium"
              onClick={() => alert('开始下载...')}
            >
              下载视频
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-[#10b981]/10 rounded-xl">
            <p className="text-sm text-[#10b981]">
              💡 本次剪辑为您节省了约 <span className="font-semibold">2.5 小时</span>！
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">导出设置</h1>
          <p className="text-white/50">选择输出格式和参数</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {formats.map((format) => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format.id as typeof selectedFormat)}
              className={`card-hover p-6 rounded-xl border-2 text-center ${
                selectedFormat === format.id
                  ? 'border-[#667eea] bg-[#667eea]/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="text-[#667eea] mb-3">{format.icon}</div>
              <p className="font-semibold mb-1">{format.name}</p>
              <p className="text-xs text-white/50 whitespace-pre-line">{format.desc}</p>
            </button>
          ))}
        </div>

        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <span>视频分辨率</span>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as typeof resolution)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm"
            >
              <option value="1080p">1080p (推荐)</option>
              <option value="720p">720p</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <span>包含字幕</span>
            <button
              onClick={() => setIncludeSubtitle(!includeSubtitle)}
              className={`toggle w-12 h-6 rounded-full relative ${includeSubtitle ? 'active' : 'bg-white/20'}`}
            >
              <span className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5 transition-all" 
                style={{ left: includeSubtitle ? '26px' : '2px' }} 
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <span>包含水印</span>
            <button className="toggle w-12 h-6 rounded-full relative bg-white/20">
              <span className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5" />
            </button>
          </div>
        </div>

        {isExporting ? (
          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span>正在导出...</span>
              <span>{exportProgress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full gradient-btn transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={onBack}
              className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium"
            >
              返回编辑
            </button>
            <button 
              onClick={handleExport}
              className="flex-1 gradient-btn py-4 rounded-xl font-medium text-lg"
            >
              开始导出
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App
function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [clips, setClips] = useState<VideoClip[]>([]);

  const handleUpload = (file: File) => {
    setVideoFile(file);
    setCurrentStep(2);
  };

  const handleProcessingComplete = (newClips: VideoClip[]) => {
    setClips(newClips);
    setCurrentStep(4); // Skip step 3 (AI config) for now
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar currentStep={currentStep} />
      
      {currentStep === 1 && (
        <UploadPage onUpload={handleUpload} />
      )}
      
      {currentStep === 2 && videoFile && (
        <ProcessingPage 
          file={videoFile} 
          onComplete={handleProcessingComplete} 
        />
      )}
      
      {currentStep === 4 && (
        <EditorPage 
          clips={clips}
          onExport={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(1)}
        />
      )}
      
      {currentStep === 5 && (
        <ExportPage onBack={() => setCurrentStep(4)} />
      )}
    </div>
  );
}

export default App;
