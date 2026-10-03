// Single Authoritative Clean Player Engine (playerCore.ts)
// Powered by Official YouTube IFrame Player API with single instance reuse,
// immediate queue advance on ENDED/ERROR (2, 5, 100, 101, 150), DOM compliance,
// pre-cueing at 80% duration, tab-hidden polling pause, and Media Session API.
import { useMusicStore } from '../store/useMusicStore';
import { resolvePlaybackSource } from './youtubeResolver';
import { recommendationEngine } from '../recommendations/engine';
import type { Song, PlaybackStatus, PlaybackError } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function formatTime(seconds: number | undefined | null): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface PlaybackClock {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  engine: 'html5' | 'youtube';
}

export interface PlayerState {
  currentTime?: number;
  duration?: number | null;
  progress?: number;
  isPlaying?: boolean;
  currentTrack?: Song | null;
  mediaErrorMsg?: string | null;
}

export class MusicPlayerCore {
  public audio: HTMLAudioElement;
  public currentTrack: Song | null = null;
  public isPlaying: boolean = false;
  public callbacks: Set<(state: PlayerState) => void> = new Set();
  public clockListeners: Set<(clock: PlaybackClock) => void> = new Set();

  public ytPlayer: any = null;
  public isYtReady: boolean = false;
  public isUsingYt: boolean = false;
  public lastYtError: number | null = null;

  private clockTickerId: any = null;
  private lastStoreUpdateTime: number = 0;
  private playbackStartTime: number = 0;
  private preloadedNextTrackId: string | null = null;
  private isTabHidden: boolean = false;

  // Single global playback token to prevent race conditions
  private playbackRequestId = 0;

  constructor() {
    const isClient = typeof window !== 'undefined';
    this.audio = isClient ? new Audio() : ({} as any);

    if (this.audio && typeof this.audio.addEventListener === 'function') {
      this.audio.preload = 'auto';
      this.audio.removeAttribute?.('crossorigin');
      this.audio.muted = false;
      this.audio.volume = 1.0;

      this.audio.onended = () => {
        if (!this.isUsingYt) {
          this.handleTrackEnded(this.playbackRequestId);
        }
      };

      this.audio.onpause = () => {
        if (!this.isUsingYt && this.isPlaying) {
          this.isPlaying = false;
          this.stopAuthoritativeClock();
          useMusicStore.setState({
            isPlayingAudio: false,
            audioState: 'paused',
            playbackStatus: 'paused'
          });
          this.broadcast({ isPlaying: false });
          this.broadcastClock();
          this.updateMediaSessionState();
        }
      };

      this.audio.onplay = () => {
        if (!this.isUsingYt) {
          this.isPlaying = true;
          useMusicStore.setState({
            isPlayingAudio: true,
            hasPlaybackStarted: true,
            audioState: 'playing',
            playbackStatus: 'playing',
            mediaErrorMsg: null
          });
          this.broadcast({ isPlaying: true, mediaErrorMsg: null });
          this.startAuthoritativeClock(this.playbackRequestId);
          this.broadcastClock();
          this.updateMediaSessionState();
        }
      };
    }

    // Monitor tab visibility to pause expensive polling when user is on another tab
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isTabHidden = document.visibilityState === 'hidden';
        if (!this.isTabHidden && this.isPlaying) {
          this.startAuthoritativeClock(this.playbackRequestId);
        }
      });
    }

    // Initialize YouTube Iframe container & Media Session
    this.initYouTubeIFrame();
    this.setupMediaSessionHandlers();
  }

  // ======================== MEDIA SESSION API ========================

  private setupMediaSessionHandlers() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => useMusicStore.getState().playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => useMusicStore.getState().playNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          this.seekTo(details.seekTime);
        }
      });
    } catch (e) {
      console.warn('[MediaSession] Handler setup error:', e);
    }
  }

  private updateMediaSessionMetadata(track: Song) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'MARQUEE Vision',
        artwork: [
          { src: track.albumArt, sizes: '96x96', type: 'image/jpeg' },
          { src: track.albumArt, sizes: '256x256', type: 'image/jpeg' },
          { src: track.albumArt, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
      this.updateMediaSessionState();
    } catch (e) {}
  }

  private updateMediaSessionState() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
      const clock = this.getPlaybackClock();
      if ('setPositionState' in navigator.mediaSession && clock.duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: clock.duration,
          playbackRate: 1,
          position: Math.min(clock.currentTime, clock.duration)
        });
      }
    } catch (e) {}
  }

  // ======================== YOUTUBE IFRAME ENGINE ========================

  /**
   * Initializes single persistent YouTube IFrame in the DOM.
   * Compliant with YouTube ToS: rendered in DOM (not display:none),
   * sized in a small container, stays active on mobile.
   */
  private initYouTubeIFrame(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      let wrapper = document.getElementById('yt-player-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'yt-player-wrapper';
        // Rendered in DOM without display:none to preserve mobile playback & comply with YouTube Terms
        wrapper.style.position = 'fixed';
        wrapper.style.bottom = '8px';
        wrapper.style.right = '8px';
        wrapper.style.width = '240px';
        wrapper.style.height = '135px';
        wrapper.style.zIndex = '1';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.opacity = '0.01'; // Preserved in DOM

        const mount = document.createElement('div');
        mount.id = 'yt-player-mount';
        wrapper.appendChild(mount);
        document.body.appendChild(wrapper);
      }

      const setupPlayerInstance = () => {
        if (this.ytPlayer && this.isYtReady) return resolve(true);

        if (window.YT && window.YT.Player) {
          try {
            this.ytPlayer = new window.YT.Player('yt-player-mount', {
              height: '135',
              width: '240',
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                modestbranding: 1,
                playsinline: 1,
                enablejsapi: 1,
                origin: window.location.origin
              },
              events: {
                onReady: () => {
                  this.isYtReady = true;
                  resolve(true);
                },
                onError: (event: any) => {
                  const errCode = event?.data;
                  this.lastYtError = errCode;
                  console.warn(`[YouTube] Player error code ${errCode}. Skipping unplayable track...`);
                  this.handleYouTubeError(errCode);
                },
                onStateChange: (event: any) => {
                  this.handleYtStateChange(event.data);
                }
              }
            });
          } catch (err) {
            resolve(false);
          }
        }
      };

      if (window.YT && window.YT.Player) {
        setupPlayerInstance();
      } else {
        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevCallback) prevCallback();
          setupPlayerInstance();
        };
        if (!document.getElementById('yt-iframe-api-script')) {
          const tag = document.createElement('script');
          tag.id = 'yt-iframe-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
      }
    });
  }

  public async ensureYouTubePlayerReady(): Promise<boolean> {
    if (this.ytPlayer && this.isYtReady) return true;
    await this.initYouTubeIFrame();

    return new Promise<boolean>((resolve) => {
      if (this.ytPlayer && this.isYtReady) return resolve(true);
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (this.ytPlayer && this.isYtReady) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts >= 50) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * Handles YouTube playback errors (2, 5, 100, 101, 150) without freezing the app.
   */
  private handleYouTubeError(code: number) {
    // 2: Invalid video ID
    // 5: HTML5 player error
    // 100: Video not found / removed
    // 101 / 150: Video owner does not allow embedded playback
    useMusicStore.getState().showToast(
      'Track unavailable for embedded playback. Auto-advancing...',
      'alert'
    );

    // Immediately advance to next track in queue
    setTimeout(() => {
      useMusicStore.getState().playNext();
    }, 200);
  }

  private handleYtStateChange(state: number) {
    if (!this.isUsingYt) return;

    if (state === 0) { // ENDED -> Advance queue immediately
      this.handleTrackEnded(this.playbackRequestId);
    } else if (state === 2) { // PAUSED
      this.isPlaying = false;
      this.stopAuthoritativeClock();
      useMusicStore.setState({
        isPlayingAudio: false,
        audioState: 'paused',
        playbackStatus: 'paused'
      });
      this.broadcast({ isPlaying: false });
      this.broadcastClock();
      this.updateMediaSessionState();
    } else if (state === 1) { // PLAYING
      this.isPlaying = true;
      useMusicStore.setState({
        isPlayingAudio: true,
        audioState: 'playing',
        playbackStatus: 'playing',
        mediaErrorMsg: null
      });
      this.broadcast({ isPlaying: true, mediaErrorMsg: null });
      this.startAuthoritativeClock(this.playbackRequestId);
      this.broadcastClock();
      this.updateMediaSessionState();
    } else if (state === 3) { // BUFFERING
      useMusicStore.setState({
        audioState: 'buffering',
        playbackStatus: 'loading'
      });
    }
  }

  // ======================== AUTHORITATIVE PLAYBACK CLOCK ========================

  public getPlaybackClock(): PlaybackClock {
    let cur = 0;
    let dur = useMusicStore.getState().duration || 0;
    const engine: 'html5' | 'youtube' = this.isUsingYt ? 'youtube' : 'html5';

    if (this.isUsingYt && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
      try {
        cur = this.ytPlayer.getCurrentTime() || 0;
        const ytDur = typeof this.ytPlayer.getDuration === 'function' ? this.ytPlayer.getDuration() : 0;
        if (ytDur > 0) dur = ytDur;
      } catch (e) {}
    } else if (this.audio) {
      cur = this.audio.currentTime || 0;
      if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
        dur = this.audio.duration;
      }
    }

    return {
      currentTime: cur,
      duration: dur,
      isPlaying: this.isPlaying,
      engine
    };
  }

  public getCurrentTime(): number {
    if (this.isUsingYt && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
      try {
        return this.ytPlayer.getCurrentTime() || 0;
      } catch (e) {}
    } else if (this.audio) {
      return this.audio.currentTime || 0;
    }
    return useMusicStore.getState().currentTime || 0;
  }

  public subscribeClock(fn: (clock: PlaybackClock) => void): () => void {
    this.clockListeners.add(fn);
    fn(this.getPlaybackClock());
    return () => {
      this.clockListeners.delete(fn);
    };
  }

  public broadcastClock(explicitClock?: PlaybackClock) {
    const clock = explicitClock || this.getPlaybackClock();
    this.clockListeners.forEach((cb) => {
      try {
        cb(clock);
      } catch (e) {}
    });
  }

  /**
   * Starts high-frequency clock ticker.
   * Throttles polling when tab is hidden, and pre-cues upcoming track at 80% duration.
   */
  public startAuthoritativeClock(requestId: number) {
    this.stopAuthoritativeClock();

    const tick = () => {
      if (this.playbackRequestId !== requestId || !this.isPlaying) {
        this.stopAuthoritativeClock();
        return;
      }

      // If tab is hidden, reduce clock frequency to save CPU & battery
      if (this.isTabHidden) {
        this.clockTickerId = setTimeout(tick, 1000);
        return;
      }

      const clock = this.getPlaybackClock();
      this.broadcastClock(clock);

      // Pre-cue next track at ~80% duration for fast switch
      if (clock.duration > 0 && (clock.currentTime / clock.duration) >= 0.80) {
        this.triggerPreCueNextTrack();
      }

      const now = performance.now();
      // Throttle Zustand store text updates to 2-4 per second (every 300ms)
      if (now - this.lastStoreUpdateTime >= 300) {
        this.lastStoreUpdateTime = now;
        const dur = clock.duration;
        const cur = clock.currentTime;
        const progress = dur > 0 ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;

        useMusicStore.setState({
          currentTime: cur,
          duration: dur > 0 ? dur : useMusicStore.getState().duration,
          isPlayingAudio: clock.isPlaying
        });

        this.broadcast({ currentTime: cur, duration: dur, progress, isPlaying: clock.isPlaying });
        this.updateMediaSessionState();
      }

      this.clockTickerId = setTimeout(tick, 30);
    };

    this.clockTickerId = setTimeout(tick, 30);
  }

  public stopAuthoritativeClock() {
    if (this.clockTickerId) {
      clearTimeout(this.clockTickerId);
      this.clockTickerId = null;
    }
  }

  // ======================== PRE-CUEING ========================

  private triggerPreCueNextTrack() {
    const { manualQueue, autoQueue, songsCatalog, activeSongIndex } = useMusicStore.getState();
    const nextTrack = manualQueue[0] || autoQueue[0] || songsCatalog[(activeSongIndex + 1) % songsCatalog.length];
    if (!nextTrack) return;

    const nextVideoId = nextTrack.canonicalTrackId?.replace('youtube:', '') || nextTrack.providerTrackId;
    if (nextVideoId && nextVideoId !== this.preloadedNextTrackId) {
      this.preloadedNextTrackId = nextVideoId;
      if (this.isUsingYt && this.ytPlayer && typeof this.ytPlayer.cueVideoById === 'function') {
        try {
          this.ytPlayer.cueVideoById(nextVideoId);
          console.log(`[YouTube Engine] Pre-cued next video "${nextTrack.title}" (${nextVideoId}) at 80% mark`);
        } catch (e) {}
      }
    }
  }

  // ======================== STOP & TRACK ENDED ========================

  public stopAllPlayback() {
    this.stopAuthoritativeClock();

    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }

    if (this.ytPlayer && typeof this.ytPlayer.stopVideo === 'function') {
      try {
        this.ytPlayer.stopVideo();
      } catch (e) {}
    }

    this.isPlaying = false;
    this.isUsingYt = false;
    this.lastYtError = null;
    this.broadcastClock({ currentTime: 0, duration: 0, isPlaying: false, engine: 'youtube' });
    this.updateMediaSessionState();
  }

  private handleTrackEnded(requestId: number) {
    if (this.playbackRequestId !== requestId) return;

    const clock = this.getPlaybackClock();
    const listenDuration = (Date.now() - this.playbackStartTime) / 1000;

    // Send listen signal to recommendation engine
    if (this.currentTrack) {
      const isLiked = useMusicStore.getState().favoriteSongs.has(this.currentTrack.id);
      recommendationEngine.trackListen(this.currentTrack, clock.duration, listenDuration, isLiked);
    }

    this.isPlaying = false;
    this.stopAuthoritativeClock();
    useMusicStore.setState({
      isPlayingAudio: false,
      playbackStatus: 'ended',
      audioState: 'idle',
      currentTime: 0
    });
    this.broadcast({ isPlaying: false, currentTime: 0 });
    this.broadcastClock({ currentTime: 0, duration: 0, isPlaying: false, engine: 'youtube' });
    this.updateMediaSessionState();

    const { repeatMode, playNext } = useMusicStore.getState();
    if (repeatMode === 'one' && this.currentTrack) {
      this.playTrack(this.currentTrack);
    } else {
      playNext();
    }
  }

  // ======================== YOUTUBE PLAYBACK ENGINE ========================

  private async playYouTubeAudio(track: Song, videoId: string, requestId: number): Promise<boolean> {
    this.stopAllPlayback();
    this.isUsingYt = true;
    this.lastYtError = null;
    this.preloadedNextTrackId = null;

    useMusicStore.setState({
      playbackStatus: 'loading',
      loadingTrack: track,
      duration: 0,
      currentTime: 0,
      isPlayingAudio: false,
      audioState: 'buffering'
    });

    const ready = await this.ensureYouTubePlayerReady();
    if (!ready || this.playbackRequestId !== requestId) return false;

    return new Promise<boolean>((resolve) => {
      let resolved = false;
      let pollTimer: any = null;

      const cleanup = () => {
        resolved = true;
        if (pollTimer) clearInterval(pollTimer);
        clearTimeout(timeoutTimer);
      };

      const timeoutTimer = setTimeout(() => {
        if (resolved) return;
        cleanup();
        resolve(false);
      }, 14000);

      try {
        // Re-use existing single YT.Player instance via loadVideoById
        this.ytPlayer.loadVideoById(videoId);
        const vol = useMusicStore.getState().isMuted ? 0 : (useMusicStore.getState().volume ?? 1.0);
        if (typeof this.ytPlayer.setVolume === 'function') {
          this.ytPlayer.setVolume(vol * 100);
        }
        this.ytPlayer.playVideo();
      } catch (loadErr) {
        cleanup();
        resolve(false);
        return;
      }

      pollTimer = setInterval(() => {
        if (resolved) return;

        if (this.playbackRequestId !== requestId) {
          cleanup();
          try { this.ytPlayer.stopVideo(); } catch (e) {}
          resolve(false);
          return;
        }

        if (this.lastYtError) {
          cleanup();
          resolve(false);
          return;
        }

        try {
          const state = typeof this.ytPlayer.getPlayerState === 'function' ? this.ytPlayer.getPlayerState() : -1;

          if (state === 1) { // YT.PlayerState.PLAYING confirmed
            const rawDuration = typeof this.ytPlayer.getDuration === 'function' ? this.ytPlayer.getDuration() : 0;
            if (rawDuration > 0) {
              cleanup();
              this.isPlaying = true;
              this.currentTrack = track;
              this.playbackStartTime = Date.now();

              useMusicStore.setState({
                activeTrack: track,
                activeTrackId: track.canonicalTrackId || track.id,
                playbackStatus: 'playing',
                isPlayingAudio: true,
                audioState: 'playing',
                activeEngine: 'youtube',
                duration: rawDuration,
                currentTime: this.ytPlayer.getCurrentTime() || 0,
                mediaErrorMsg: null,
                loadingTrack: null
              });

              this.broadcast({ currentTrack: track, isPlaying: true, duration: rawDuration, currentTime: 0 });
              this.startAuthoritativeClock(requestId);
              this.broadcastClock();
              this.updateMediaSessionMetadata(track);
              resolve(true);
            }
          }
        } catch (pollErr) {}
      }, 150);
    });
  }

  // ======================== AUTHORITATIVE PLAY FUNCTION ========================

  public async playTrack(track: Song): Promise<boolean> {
    const requestId = ++this.playbackRequestId;

    if (!track || (!track.id && !track.canonicalTrackId)) {
      return false;
    }

    useMusicStore.setState({
      selectedTrack: track,
      loadingTrack: track,
      playbackStatus: 'resolving',
      audioState: 'buffering',
      isPlayingAudio: false,
      currentTime: 0,
      duration: 0,
      mediaErrorMsg: null
    });

    this.stopAllPlayback();

    // Sync catalog index
    const { songsCatalog } = useMusicStore.getState();
    const idx = songsCatalog.findIndex(s => (s.canonicalTrackId || s.id) === (track.canonicalTrackId || track.id));
    if (idx >= 0) {
      useMusicStore.setState({ activeSongIndex: idx });
    } else {
      useMusicStore.setState({
        songsCatalog: [track, ...songsCatalog],
        activeSongIndex: 0
      });
    }

    const source = await resolvePlaybackSource(track);
    if (requestId !== this.playbackRequestId) return false;

    if (!source || !source.videoId) {
      console.warn(`[Player] No YouTube video source found for "${track.title}"`);
      useMusicStore.getState().showToast('Playback source unavailable. Playing next track...', 'alert');
      setTimeout(() => useMusicStore.getState().playNext(), 300);
      return false;
    }

    const playSuccess = await this.playYouTubeAudio(track, source.videoId, requestId);
    if (requestId !== this.playbackRequestId) return false;

    if (!playSuccess) {
      console.warn(`[Player] Playback rejected for "${track.title}". Auto-advancing...`);
      setTimeout(() => useMusicStore.getState().playNext(), 300);
      return false;
    }

    return true;
  }

  public play(track: Song) {
    return this.playTrack(track);
  }

  public togglePlay() {
    if (this.ytPlayer && typeof this.ytPlayer.getPlayerState === 'function') {
      const state = this.ytPlayer.getPlayerState();
      if (state === 1) { // Playing -> Pause
        this.ytPlayer.pauseVideo();
        this.isPlaying = false;
        this.stopAuthoritativeClock();
        useMusicStore.setState({ isPlayingAudio: false, audioState: 'paused', playbackStatus: 'paused' });
        this.broadcastClock();
        this.updateMediaSessionState();
      } else { // Paused -> Play
        this.ytPlayer.playVideo();
        this.isPlaying = true;
        this.startAuthoritativeClock(this.playbackRequestId);
        useMusicStore.setState({ isPlayingAudio: true, hasPlaybackStarted: true, audioState: 'playing', playbackStatus: 'playing' });
        this.broadcastClock();
        this.updateMediaSessionState();
      }
    }
  }

  public toggle() {
    this.togglePlay();
  }

  public seek(percent: number) {
    const dur = useMusicStore.getState().duration || 0;
    if (dur > 0) {
      const targetTime = (Math.min(100, Math.max(0, percent)) / 100) * dur;
      this.seekTo(targetTime);
    }
  }

  public seekTo(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return;
    const dur = useMusicStore.getState().duration || 0;
    const clamped = dur > 0 ? Math.min(seconds, dur) : seconds;

    if (this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      this.ytPlayer.seekTo(clamped, true);
    }
    useMusicStore.setState({ currentTime: clamped });
    this.broadcastClock({
      currentTime: clamped,
      duration: dur,
      isPlaying: this.isPlaying,
      engine: 'youtube'
    });
    this.broadcast({ currentTime: clamped });
    this.updateMediaSessionState();
  }

  public setVolume(val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      this.ytPlayer.setVolume(clamped * 100);
    }
    useMusicStore.setState({ volume: clamped, isMuted: clamped === 0 });
  }

  public subscribe(fn: (state: PlayerState) => void) {
    this.callbacks.add(fn);
    return () => this.callbacks.delete(fn);
  }

  public broadcast(state: PlayerState) {
    this.callbacks.forEach((cb) => cb(state));
  }
}

export const musicPlayer = new MusicPlayerCore();
export const playerCore = musicPlayer;
