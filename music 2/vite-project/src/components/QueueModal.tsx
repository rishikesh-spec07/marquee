import React from 'react';
import { X, Play, Pause, Trash2, ListMusic, Sparkles, GripVertical, Radio, Music } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { formatTime, musicPlayer } from '../services/playerCore';
import { MarqueeWaveLogo } from './MarqueeWaveLogo';

export const QueueModal: React.FC = () => {
  const {
    showQueueModal,
    toggleQueueModal,
    activeTrack,
    isPlayingAudio,
    manualQueue,
    autoQueue,
    removeFromManualQueue,
    clearManualQueue,
    playSong
  } = useMusicStore();

  if (!showQueueModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={toggleQueueModal}
    >
      <div
        className="w-full max-w-xl bg-[#12131a]/95 border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Playback Queue</h3>
              <p className="text-[11px] text-white/50">
                {manualQueue.length} manual • {autoQueue.length} autoplay radio tracks
              </p>
            </div>
          </div>

          <button
            onClick={toggleQueueModal}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {/* NOW PLAYING SECTION */}
          {activeTrack && (
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <MarqueeWaveLogo isPlaying={isPlayingAudio} height={10} />
                Now Playing
              </span>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.08] border border-white/20 shadow-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={activeTrack.albumArt}
                    alt={activeTrack.title}
                    className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0 border border-white/15"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-bold text-white truncate leading-tight">
                      {activeTrack.title}
                    </span>
                    <span className="text-xs text-white/60 truncate leading-tight mt-0.5">
                      {activeTrack.artist}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-mono text-white/50">
                    {formatTime(activeTrack.duration || 0)}
                  </span>
                  <button
                    onClick={() => musicPlayer.togglePlay()}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition"
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-4 h-4 fill-black" />
                    ) : (
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MANUAL QUEUE ("Next Up") */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
                Next In Queue ({manualQueue.length})
              </span>
              {manualQueue.length > 0 && (
                <button
                  onClick={clearManualQueue}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {manualQueue.length > 0 ? (
              <div className="space-y-1.5">
                {manualQueue.map((song, idx) => (
                  <div
                    key={`${song.canonicalTrackId || song.id}-${idx}`}
                    className="flex items-center justify-between p-2.5 px-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition group"
                  >
                    <div
                      onClick={() => playSong(song)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="text-xs font-mono text-white/30 w-4 text-center">
                        {idx + 1}
                      </span>
                      <img
                        src={song.albumArt}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate transition leading-tight">
                          {song.title}
                        </span>
                        <span className="text-[11px] text-white/60 truncate leading-tight mt-0.5">
                          {song.artist}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] font-mono text-white/40">
                        {formatTime(song.duration || 0)}
                      </span>
                      <button
                        onClick={() => removeFromManualQueue(song.canonicalTrackId || song.id)}
                        className="p-1 text-white/30 hover:text-rose-400 transition"
                        title="Remove from queue"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40 italic py-1 px-1">
                Your manual queue is empty. Songs you add via "Play Next" appear here.
              </p>
            )}
          </div>

          {/* AUTO QUEUE (Song Radio - Related Tracks) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                Autoplay Radio ({autoQueue.length})
              </span>
              <span className="text-[10px] text-white/40">
                Seeded by current track
              </span>
            </div>

            {autoQueue.length > 0 ? (
              <div className="space-y-1.5">
                {autoQueue.map((song, idx) => (
                  <div
                    key={`${song.canonicalTrackId || song.id}-${idx}`}
                    onClick={() => playSong(song)}
                    className="flex items-center justify-between p-2.5 px-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={song.albumArt}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate transition leading-tight">
                          {song.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-white/60 truncate">
                            {song.artist}
                          </span>
                          {song.language && (
                            <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] uppercase font-bold text-white/60">
                              {song.language}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] font-mono text-white/40">
                        {formatTime(song.duration || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40 italic py-1 px-1">
                Autoplay radio will populate once a song starts playing.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-white/40">
          <span>Manual queue always plays before radio</span>
          <button
            onClick={toggleQueueModal}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
