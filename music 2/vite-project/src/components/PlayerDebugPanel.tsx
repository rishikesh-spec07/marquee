import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Terminal, Volume2, ShieldCheck, Activity } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { musicPlayer } from '../services/playerCore';

export const PlayerDebugPanel: React.FC = () => {
  const {
    activeTrack,
    songsCatalog,
    activeSongIndex,
    isPlayingAudio,
    volume,
    isMuted,
    audioState,
    activeEngine,
    mediaErrorMsg,
    debugLogs,
    showDebugPanel,
    toggleDebugPanel
  } = useMusicStore();

  const [mediaStats, setMediaStats] = useState({
    readyState: 0,
    networkState: 0,
    currentTime: 0,
    duration: 0,
    src: ''
  });

  const currentSong = activeTrack || songsCatalog[activeSongIndex];

  useEffect(() => {
    if (!showDebugPanel) return;

    const interval = setInterval(() => {
      const audio = musicPlayer.audio;
      if (audio) {
        setMediaStats({
          readyState: audio.readyState,
          networkState: audio.networkState,
          currentTime: audio.currentTime,
          duration: audio.duration || 0,
          src: audio.src || ''
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [showDebugPanel]);

  if (!showDebugPanel) return null;

  const getReadyStateLabel = (state: number) => {
    switch (state) {
      case 0: return '0: HAVE_NOTHING';
      case 1: return '1: HAVE_METADATA';
      case 2: return '2: HAVE_CURRENT_DATA';
      case 3: return '3: HAVE_FUTURE_DATA';
      case 4: return '4: HAVE_ENOUGH_DATA';
      default: return `${state}: UNKNOWN`;
    }
  };

  const getNetworkStateLabel = (state: number) => {
    switch (state) {
      case 0: return '0: NETWORK_EMPTY';
      case 1: return '1: NETWORK_IDLE';
      case 2: return '2: NETWORK_LOADING';
      case 3: return '3: NETWORK_NO_SOURCE';
      default: return `${state}: UNKNOWN`;
    }
  };

  return (
    <div className="fixed top-20 right-6 z-50 w-96 bg-[#11131a]/90 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-xs text-slate-200 font-mono ring-1 ring-amber-500/20 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
          <h3 className="font-extrabold text-amber-300 uppercase tracking-wider text-[11px]">
            Audio Engine Diagnostics
          </h3>
        </div>
        <button
          onClick={toggleDebugPanel}
          className="text-white/50 hover:text-white transition p-1 rounded-full hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Track Info */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 mb-3 flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] text-white/50">
          <span>Active Track:</span>
          <span className="text-amber-400 font-bold">{currentSong?.id || 'None'}</span>
        </div>
        <div className="text-white font-bold truncate">{currentSong?.title || 'No Track Selected'}</div>
        <div className="text-white/60 truncate">{currentSong?.artist || 'Unknown Artist'}</div>
      </div>

      {/* Media Engine State */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
        <div className="bg-white/5 border border-white/10 p-2 rounded-lg flex flex-col">
          <span className="text-white/40 text-[9px] uppercase">Audio State</span>
          <span className="font-extrabold text-emerald-400 uppercase mt-0.5">{audioState}</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-2 rounded-lg flex flex-col">
          <span className="text-white/40 text-[9px] uppercase">Active Engine</span>
          <span className="font-extrabold text-indigo-400 uppercase mt-0.5">{activeEngine}</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-2 rounded-lg flex flex-col">
          <span className="text-white/40 text-[9px] uppercase">Ready State</span>
          <span className="font-bold text-white/80 mt-0.5">{getReadyStateLabel(mediaStats.readyState)}</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-2 rounded-lg flex flex-col">
          <span className="text-white/40 text-[9px] uppercase">Network State</span>
          <span className="font-bold text-white/80 mt-0.5">{getNetworkStateLabel(mediaStats.networkState)}</span>
        </div>
      </div>

      {/* Stream URL & Error Logs */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 mb-3 flex flex-col gap-1">
        <div className="text-[9px] text-white/40 uppercase">Media Stream Source</div>
        <div className="text-[10px] text-cyan-300 truncate select-all font-mono">
          {mediaStats.src || 'No media source set'}
        </div>

        {mediaErrorMsg && (
          <div className="mt-1 p-1.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px]">
            {mediaErrorMsg}
          </div>
        )}
      </div>

      {/* Real-time System Debug Console */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] text-white/50 px-1">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-amber-400" /> Console Logs
          </span>
          <span>Last {debugLogs.length} events</span>
        </div>
        <div className="bg-black/70 border border-white/10 rounded-xl p-2 h-28 overflow-y-auto font-mono text-[10px] flex flex-col gap-1 text-slate-300 select-text">
          {debugLogs.map((log, i) => (
            <div key={i} className="leading-tight border-b border-white/5 pb-0.5">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
