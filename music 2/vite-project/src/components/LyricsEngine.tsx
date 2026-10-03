import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Music, SlidersHorizontal, Plus, Minus, AlertCircle, RefreshCw, Edit3, X, Check } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { fetchLyricsForTrack, cancelLyricsFetch, parseLrcLyrics, TrackLyrics } from '../services/lyricsService';
import { lyricsStorage } from '../services/lyricsStorage';
import { playerCore } from '../services/playerCore';
import type { LyricLine } from '../types';

interface LyricsEngineProps {
  onSeekTime?: (time: number) => void;
}

/**
 * Fast binary search for active lyric index based on authoritative timestamp.
 * Returns the greatest index where lyrics[index].time <= effectiveTime.
 */
export function findActiveLyricIndex(lyrics: LyricLine[], effectiveTime: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  if (effectiveTime < lyrics[0].time) return -1;

  let low = 0;
  let high = lyrics.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lyrics[mid].time <= effectiveTime) {
      result = mid;
      low = mid + 1; // Look for a later line that also satisfies condition
    } else {
      high = mid - 1;
    }
  }

  return result;
}

export const LyricsEngine: React.FC<LyricsEngineProps> = ({ onSeekTime }) => {
  const { activeTrack, songsCatalog, activeSongIndex, isPlayingAudio } = useMusicStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [trackLyrics, setTrackLyrics] = useState<TrackLyrics | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);
  const [showSyncControls, setShowSyncControls] = useState<boolean>(false);
  const [songOffset, setSongOffset] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Custom lyrics dialog state
  const [isAddingLyrics, setIsAddingLyrics] = useState<boolean>(false);
  const [customLyricsText, setCustomLyricsText] = useState<string>('');
  const [customLyricsError, setCustomLyricsError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const activeIndexRef = useRef<number>(-1);
  const lastUserScrollRef = useRef<number>(0);
  const songOffsetRef = useRef<number>(0);

  const currentSong = activeTrack || songsCatalog[activeSongIndex];
  const canonicalId = currentSong?.canonicalTrackId || currentSong?.id || '';

  // Synchronize offset ref for zero-latency rAF loop access
  useEffect(() => {
    songOffsetRef.current = songOffset;
  }, [songOffset]);

  // Load per-song sync offset from IndexedDB whenever song changes
  useEffect(() => {
    if (!canonicalId) return;
    lyricsStorage.getSongOffset(canonicalId).then((savedOffset) => {
      setSongOffset(savedOffset);
      songOffsetRef.current = savedOffset;
    });
  }, [canonicalId]);

  // Track change & lifecycle handling: clear, reset index, fetch fresh or cached lyrics
  useEffect(() => {
    if (!currentSong) return;

    let isMounted = true;
    cancelLyricsFetch();
    setIsLoadingLyrics(true);
    setTrackLyrics(null);
    setActiveIndex(-1);
    activeIndexRef.current = -1;
    setIsAddingLyrics(false);
    setCustomLyricsText('');
    setCustomLyricsError(null);

    fetchLyricsForTrack(currentSong).then((lyricsData) => {
      if (!isMounted) return;

      const currentCanonical = currentSong.canonicalTrackId || currentSong.id;
      if (lyricsData && lyricsData.canonicalTrackId === currentCanonical) {
        setTrackLyrics(lyricsData);

        // Immediate initial index calculation if currently playing
        if (lyricsData.type === 'synced' && lyricsData.lines.length > 0) {
          const curTime = playerCore.getCurrentTime();
          const effTime = Math.max(0, curTime + songOffsetRef.current + 0.15);
          const initialIdx = findActiveLyricIndex(lyricsData.lines, effTime);
          setActiveIndex(initialIdx);
          activeIndexRef.current = initialIdx;
        }
      } else {
        setTrackLyrics(null);
      }
      setIsLoadingLyrics(false);
    });

    return () => {
      isMounted = false;
      cancelLyricsFetch();
    };
  }, [canonicalId]);

  const handleRetry = async () => {
    if (!currentSong || isRetrying) return;
    setIsRetrying(true);
    setIsLoadingLyrics(true);
    setTrackLyrics(null);

    try {
      const lyricsData = await fetchLyricsForTrack(currentSong, true);
      const currentCanonical = currentSong.canonicalTrackId || currentSong.id;
      if (lyricsData && lyricsData.canonicalTrackId === currentCanonical) {
        setTrackLyrics(lyricsData);
      } else {
        setTrackLyrics(null);
      }
    } catch {
      setTrackLyrics(null);
    } finally {
      setIsRetrying(false);
      setIsLoadingLyrics(false);
    }
  };

  const handleSaveCustomLyrics = async () => {
    if (!currentSong || !customLyricsText.trim()) {
      setCustomLyricsError('Please paste some lyrics text first');
      return;
    }

    const parsed = parseLrcLyrics(customLyricsText.trim());
    if (parsed.lines.length === 0) {
      setCustomLyricsError('No valid lines found. Please paste lines of text.');
      return;
    }

    const newLyrics: TrackLyrics = {
      canonicalTrackId: canonicalId,
      type: parsed.type,
      lines: parsed.lines
    };

    await lyricsStorage.saveCustomLyrics(canonicalId, newLyrics);
    setTrackLyrics(newLyrics);
    setIsAddingLyrics(false);
    setCustomLyricsText('');
    setCustomLyricsError(null);
  };

  const lines = useMemo(() => trackLyrics?.lines || [], [trackLyrics]);
  const isSynced = trackLyrics?.type === 'synced';

  // Smooth centering helper that scrolls container without parent jitter
  const centerActiveLine = useCallback((idx: number) => {
    const isManualScrolling = Date.now() - lastUserScrollRef.current < 3000;
    if (isManualScrolling) return; // Pause auto-scroll for 3s on manual scroll

    const lineEl = lineRefs.current[idx];
    const container = containerRef.current;
    if (lineEl && container) {
      const targetScrollTop =
        lineEl.offsetTop - container.offsetTop - container.clientHeight / 2 + lineEl.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  }, []);

  // Real-time 60fps requestAnimationFrame loop for authoritative timing
  useEffect(() => {
    if (!isSynced || lines.length === 0) return;

    let rAFId: number;

    const tick = () => {
      // Run loop strictly when tab is visible and audio is actively playing
      if (!document.hidden && useMusicStore.getState().isPlayingAudio) {
        const curTime = playerCore.getCurrentTime();
        // 150ms look-ahead for human perception and visual rendering latency
        const effectiveTime = Math.max(0, curTime + songOffsetRef.current + 0.15);
        const nextIdx = findActiveLyricIndex(lines, effectiveTime);

        if (nextIdx !== activeIndexRef.current) {
          activeIndexRef.current = nextIdx;
          setActiveIndex(nextIdx);
          if (nextIdx >= 0) {
            centerActiveLine(nextIdx);
          }
        }
      }

      rAFId = requestAnimationFrame(tick);
    };

    rAFId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rAFId);
  }, [isSynced, lines, centerActiveLine]);

  // Handle immediate seek updates via playerCore clock subscription
  useEffect(() => {
    const unsubscribe = playerCore.subscribeClock((clock) => {
      if (!isSynced || lines.length === 0) return;
      const effectiveTime = Math.max(0, clock.currentTime + songOffsetRef.current + 0.15);
      const nextIdx = findActiveLyricIndex(lines, effectiveTime);

      if (nextIdx !== activeIndexRef.current) {
        activeIndexRef.current = nextIdx;
        setActiveIndex(nextIdx);
        if (nextIdx >= 0) {
          centerActiveLine(nextIdx);
        }
      }
    });
    return unsubscribe;
  }, [isSynced, lines, centerActiveLine]);

  // Adjust per-song sync offset (range ±10s) and save in IndexedDB
  const handleAdjustOffset = (delta: number) => {
    if (!canonicalId) return;
    const next = Math.max(-10, Math.min(10, Math.round((songOffset + delta) * 100) / 100));
    setSongOffset(next);
    songOffsetRef.current = next;
    lyricsStorage.saveSongOffset(canonicalId, next);

    // Immediately re-evaluate active index
    if (isSynced && lines.length > 0) {
      const curTime = playerCore.getCurrentTime();
      const effectiveTime = Math.max(0, curTime + next + 0.15);
      const nextIdx = findActiveLyricIndex(lines, effectiveTime);
      setActiveIndex(nextIdx);
      activeIndexRef.current = nextIdx;
      if (nextIdx >= 0) centerActiveLine(nextIdx);
    }
  };

  const handleResetOffset = () => {
    if (!canonicalId) return;
    setSongOffset(0);
    songOffsetRef.current = 0;
    lyricsStorage.saveSongOffset(canonicalId, 0);

    if (isSynced && lines.length > 0) {
      const curTime = playerCore.getCurrentTime();
      const effectiveTime = Math.max(0, curTime + 0.15);
      const nextIdx = findActiveLyricIndex(lines, effectiveTime);
      setActiveIndex(nextIdx);
      activeIndexRef.current = nextIdx;
      if (nextIdx >= 0) centerActiveLine(nextIdx);
    }
  };

  const handleLineClick = (lineTime: number) => {
    if (!isSynced) return;
    // Seek to line timestamp minus user offset
    const targetSeek = Math.max(0, lineTime - songOffsetRef.current);
    playerCore.seekTo(targetSeek);
    onSeekTime?.(targetSeek);
  };

  if (!currentSong) return null;

  // SKELETON LOADER WHILE FETCHING
  if (isLoadingLyrics) {
    return (
      <div className="flex flex-col gap-6 overflow-hidden max-h-[620px] pr-6 py-8 select-none my-auto">
        <div className="flex items-center gap-2 mb-2 px-2 animate-pulse">
          <div className="h-6 w-28 rounded-full bg-white/10" />
        </div>
        {[80, 65, 90, 75, 85, 60, 70].map((widthPct, i) => (
          <div
            key={i}
            className="h-10 rounded-2xl bg-white/5 border border-white/5 animate-pulse"
            style={{ width: `${widthPct}%`, opacity: 0.15 + (i % 3) * 0.15 }}
          />
        ))}
      </div>
    );
  }

  // EMPTY STATE WHEN NO LYRICS FOUND
  if (!trackLyrics || lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6 select-none my-auto relative">
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 shadow-2xl backdrop-blur-md">
          <Music className="w-8 h-8 text-amber-300" />
        </div>
        <h3 className="text-base md:text-lg font-extrabold text-white mb-1.5 drop-shadow-md">
          Sorry, lyrics aren't available for this track.
        </h3>
        <p className="text-xs text-white/50 max-w-xs leading-relaxed font-medium mb-6">
          Lyrics for "{currentSong.title}" by {currentSong.artist} could not be found.
        </p>

        {/* Empty State Actions: Retry and Add lyrics */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>

          <button
            onClick={() => setIsAddingLyrics(true)}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-amber-400/20"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Add lyrics</span>
          </button>
        </div>

        {/* Custom Lyrics Paste Modal */}
        {isAddingLyrics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#141622] border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div>
                  <h4 className="text-base font-bold text-white">Add Custom Lyrics</h4>
                  <p className="text-[11px] text-white/50 truncate max-w-[260px]">
                    {currentSong.title} • {currentSong.artist}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingLyrics(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-white/60 mb-2 leading-relaxed">
                Paste plain text lyrics line-by-line, or synced LRC format with timestamps (e.g. <code className="text-amber-300 font-mono text-[11px]">[00:15.20] First line</code>):
              </p>

              <textarea
                value={customLyricsText}
                onChange={(e) => {
                  setCustomLyricsText(e.target.value);
                  setCustomLyricsError(null);
                }}
                placeholder="[00:12.50] Verse 1 lyrics...&#10;[00:18.20] Next line of lyrics...&#10;&#10;Or simply paste normal plain lyrics here."
                rows={10}
                className="w-full flex-1 min-h-[160px] p-3 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-white/30 text-xs font-mono leading-relaxed focus:outline-none focus:border-amber-400/60 resize-none mb-3"
              />

              {customLyricsError && (
                <div className="text-rose-400 text-xs font-medium mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{customLyricsError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setIsAddingLyrics(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-white/60 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomLyrics}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Lyrics</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Top Status & Sync Adjustment Bar */}
      <div className="flex items-center justify-between gap-2.5 mb-3 px-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {isSynced ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] uppercase tracking-wider font-extrabold text-emerald-300 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synced Lyrics
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] uppercase tracking-wider font-extrabold text-amber-300">
              Lyrics Without Timestamps
            </span>
          )}

          {/* Version mismatch subtle hint */}
          {trackLyrics.isVersionMismatch && isSynced && (
            <span
              className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10px] font-medium text-amber-300 flex items-center gap-1"
              title="YouTube video audio may contain dialogue or intro skit not present in album recording. Use Sync buttons to adjust."
            >
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Lyrics may be for a different version
            </span>
          )}

          {isSynced && (
            <button
              onClick={() => setShowSyncControls(!showSyncControls)}
              className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1.5 cursor-pointer ${
                showSyncControls || songOffset !== 0
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title="Adjust Lyric Synchronization (-0.5s / +0.5s)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono font-medium">
                Sync: {songOffset >= 0 ? `+${songOffset.toFixed(1)}` : songOffset.toFixed(1)}s
              </span>
            </button>
          )}
        </div>

        {/* Sync Controls Dropdown/Panel */}
        {isSynced && showSyncControls && (
          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-xl border border-white/20 px-2.5 py-1 rounded-xl text-xs shadow-xl animate-in fade-in duration-200">
            <span className="text-[10px] text-white/50 uppercase font-bold mr-1">Lyrics Sync:</span>
            <button
              onClick={() => handleAdjustOffset(-0.5)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold transition active:scale-95 cursor-pointer"
              title="-0.50 seconds"
            >
              -0.5s
            </button>
            <button
              onClick={handleResetOffset}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] transition cursor-pointer ${
                songOffset === 0
                  ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/40'
                  : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
              }`}
              title="Reset offset to 0.0s"
            >
              0s
            </button>
            <button
              onClick={() => handleAdjustOffset(0.5)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold transition active:scale-95 cursor-pointer"
              title="+0.50 seconds"
            >
              +0.5s
            </button>
          </div>
        )}
      </div>

      {/* Main Lyrics Scroll Area */}
      <div
        ref={containerRef}
        onWheel={() => {
          lastUserScrollRef.current = Date.now();
        }}
        onTouchMove={() => {
          lastUserScrollRef.current = Date.now();
        }}
        className="flex flex-col gap-5 overflow-y-auto max-h-[620px] pr-6 py-6 select-none scrollbar-none scroll-smooth relative"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
        }}
      >
        {lines.map((line, idx) => {
          const isActive = isSynced && idx === activeIndex;
          const isPast = isSynced && idx < activeIndex;
          const dist = isSynced ? Math.abs(idx - activeIndex) : 99;

          const stableKey = `${canonicalId}-${line.time}-${idx}`;

          let lineClass =
            'px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-lg md:text-xl text-white/70 leading-relaxed';

          if (isSynced) {
            if (isActive) {
              lineClass =
                'px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 font-black text-2xl md:text-3xl lg:text-[32px] text-white opacity-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.9)] scale-[1.02] origin-left leading-snug my-2 bg-white/15 border border-white/25 shadow-2xl backdrop-blur-lg';
            } else if (dist === 1) {
              lineClass =
                'px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 font-extrabold text-xl md:text-2xl text-white/60 opacity-60 hover:opacity-90 hover:text-white leading-relaxed origin-left';
            } else if (isPast) {
              lineClass =
                'px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 font-bold text-lg md:text-xl text-white/40 opacity-40 hover:opacity-75 hover:text-white leading-relaxed origin-left';
            } else {
              lineClass =
                'px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 font-bold text-lg md:text-xl text-white/25 opacity-25 hover:opacity-70 hover:text-white leading-relaxed origin-left';
            }
          }

          return (
            <div
              key={stableKey}
              ref={(el) => {
                lineRefs.current[idx] = el;
              }}
              onClick={() => handleLineClick(line.time)}
              className={lineClass}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

