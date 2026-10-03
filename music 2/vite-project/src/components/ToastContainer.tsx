import React from 'react';
import { Info, Play, Pause, Heart, CheckCircle, Disc, Key, RefreshCw } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

export const ToastContainer: React.FC = () => {
  const { toasts } = useMusicStore();

  if (toasts.length === 0) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'play': return <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />;
      case 'pause': return <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case 'heart': return <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />;
      case 'check-circle': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'disc': return <Disc className="w-4 h-4 text-indigo-400" />;
      case 'key': return <Key className="w-4 h-4 text-amber-400" />;
      case 'refresh-cw': return <RefreshCw className="w-4 h-4 text-cyan-400" />;
      default: return <Info className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed bottom-20 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-white text-xs font-medium shadow-2xl transition-all duration-300 animate-slide-up"
        >
          {renderIcon(toast.icon)}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
