import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { playerCore } from '../services/playerCore';
import { MarqueeWaveLogo } from './MarqueeWaveLogo';

export const ConnectionAndLoadingFeedback: React.FC = () => {
  const {
    loadingTrack,
    audioState,
    playbackStatus,
    activeTrack,
    mediaErrorMsg,
    showToast
  } = useMusicStore();

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
      showToast('Internet connection restored', 'check');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      showToast('Internet connection lost', 'alert');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Is a song actively loading / buffering?
  const isLoadingSong =
    Boolean(loadingTrack) ||
    audioState === 'buffering' ||
    playbackStatus === 'loading';

  // Is there an active connection / audio stream error?
  const hasConnectionIssue =
    !isOnline ||
    audioState === 'error' ||
    playbackStatus === 'error';

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Check online connectivity
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        showToast('Still offline. Please check your network.', 'alert');
        setIsRetrying(false);
        return;
      }

      if (activeTrack) {
        showToast(`Retrying "${activeTrack.title}"...`, 'music');
        await playerCore.playTrack(activeTrack);
      } else {
        setIsOnline(true);
        setIsDismissed(true);
        showToast('Connection verified', 'check');
      }
    } catch (e) {
      showToast('Retry failed. Please verify connection.', 'alert');
    } finally {
      setTimeout(() => setIsRetrying(false), 600);
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. SONG LOADING FEEDBACK (FLOATING PILL WITH ANIMATED LOGO) */}
      {/* ======================================================== */}
      {isLoadingSong && !hasConnectionIssue && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9990] flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#0e0717]/85 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.85)] ring-1 ring-purple-500/25 transition-all duration-300 animate-in fade-in zoom-in-95 pointer-events-auto select-none"
          title="Loading song stream"
        >
          {/* Animated Wave Logo in Loading State */}
          <div className="shrink-0 flex items-center justify-center">
            <MarqueeWaveLogo isPlaying={true} height={20} />
          </div>

          {/* Loading status message */}
          <div className="flex items-center gap-2 pr-1">
            <span className="text-xs font-semibold text-white/90 truncate max-w-[200px] sm:max-w-xs">
              Loading {loadingTrack?.title || activeTrack?.title || 'Song'}...
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CONNECTION ISSUE MODAL / BANNER WITH ANIMATED LOGO   */}
      {/* ======================================================== */}
      {hasConnectionIssue && !isDismissed && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9995] w-[92%] max-w-md p-4 rounded-3xl bg-[#12081c]/95 backdrop-blur-3xl border border-purple-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-all duration-300 animate-in fade-in slide-in-from-top-4 select-none"
        >
          <div className="flex items-start gap-3.5">
            {/* Animated Wave Logo in Connection Issue State */}
            <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
              <MarqueeWaveLogo isPlaying={false} height={26} />
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold tracking-wide uppercase">
                  {!isOnline ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5 shrink-0" />
                      <span>No Internet Connection</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Audio Connection Issue</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                {!isOnline
                  ? 'Your device appears offline. Check your network or Wi-Fi connection.'
                  : mediaErrorMsg ||
                    'Unable to stream this audio track right now. Please try again or check your connection.'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 shadow-md transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Checking...' : 'Retry Connection'}</span>
                </button>

                <button
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
