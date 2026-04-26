/****************************
 * VoiceCraft Pro - 全局 Toast 通知
 ****************************/
import { useStore } from '../store';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-green-500/90 text-white',
  error: 'bg-red-500/90 text-white',
  info: 'bg-blue-500/90 text-white',
};

export default function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;

  const Icon = icons[toast.type];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg backdrop-blur-sm ${colors[toast.type]}`}>
        <Icon size={18} />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
