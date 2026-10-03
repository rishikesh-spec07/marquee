import { create } from 'zustand';
import type { Song, Movie, Playlist, EqualizerState, VisualizerMode, RepeatMode, ViewMode, Category, SourceType, PlayerAudioState, PlaybackStatus } from '../types';
import { SONGS_CATALOG } from '../data/songsData';
import { musicPlayer } from '../services/playerCore';
import { fetchAllTimeSongs } from '../services/musicService';
import { youtubeDataService } from '../services/youtubeDataService';
import { songRadioService } from '../services/songRadioService';

export interface AppSettings {
  artistThemeColor: string;
  artistThemeName: string;
  themeMode?: 'vision-glass' | 'oled-dark' | 'deep-charcoal';
  enableSpatialGlow: boolean;
  enableCursorFollower: boolean;
  streamingQuality: 'low' | 'normal' | 'high' | 'lossless';
  smartAdaptiveBitrate: boolean;
  smartAudioEnhancer: boolean;
  smartSilenceDetection: boolean;
  smartSleepTimer: number;
  smartAutoCacheClean: boolean;
  normalizeVolume: boolean;
  volumeLevel: 'quiet' | 'normal' | 'loud';
  crossfadeDuration: number;
  gaplessPlayback: boolean;
  spatialSurroundEngine: boolean;
  autoPlaySimilar: boolean;
  autoShowLyrics: boolean;
  showCanvasVideo: boolean;
  desktopNotifications: boolean;
  privateSession: boolean;
  shareListeningActivity: boolean;
  showTopGenresPublic: boolean;
  showRecentlyPlayedProfile: boolean;
  cacheSizeBytes: number;
}

export interface UserProfile {
  name: string;
  email?: string;
  username?: string;
  role?: string;
  avatarUrl: string;
  location?: string;
  monthlyListeners?: string;
  followersCount?: number;
  followingCount?: number;
  tagline?: string;
  bio?: string;
  genres?: string[];
}

interface ToastItem {
  id: string;
  message: string;
  icon: string;
}

interface MusicStoreState {
  // Application & Theme Settings
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  clearAudioCache: () => void;

  // User Profile & Authentication
  isScrolled: boolean;
  setIsScrolled: (scrolled: boolean) => void;
  isHeaderVisible: boolean;
  setIsHeaderVisible: (visible: boolean) => void;

  userProfile: UserProfile;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  showSearchModal: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  toggleSearchModal: () => void;
  recentlyPlayed: Song[];
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithX: () => Promise<void>;
  loginWithInstagram: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  loginWithTwitter: () => Promise<void>;
  toggleAuthModal: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  addToRecentlyPlayed: (song: Song) => void;

  // Playback state - Single Source of Truth activeTrack & lifecycle
  selectedTrack: Song | null;
  loadingTrack: Song | null;
  activeTrack: Song | null;
  activeTrackId: string | null;
  playbackRequestId: number;
  playbackStatus: PlaybackStatus;
  songsCatalog: Song[];
  activeSongIndex: number;
  isPlayingAudio: boolean;
  hasPlaybackStarted: boolean;
  setHasPlaybackStarted: (started: boolean) => void;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  currentTime: number;
  duration: number | null;

  // Real-time Audio Diagnostics & Engine State
  audioState: PlayerAudioState;
  activeEngine: SourceType;
  mediaErrorMsg: string | null;
  debugLogs: string[];
  showDebugPanel: boolean;

  // Layout & UI State
  isSidebarExpanded: boolean;
  showContextDrawer: boolean;
  contextDrawerView: 'lyrics' | 'visualizer';

  // View & UI Toggles
  currentCategory: Category;
  viewMode: ViewMode;
  activeView: string;
  activeSubTab: 'grid' | 'split' | 'lyrics';
  setActiveSubTab: (tab: 'grid' | 'split' | 'lyrics') => void;
  searchQuery: string;
  showLyricsPanel: boolean;
  showQueueModal: boolean;
  showEqualizer: boolean;
  showApiKeyModal: boolean;
  showPlaylistsModal: boolean;
  showFullPlayerModal: boolean;
  showIntroSplash: boolean;
  setShowIntroSplash: (show: boolean) => void;
  visualizerMode: VisualizerMode;
  equalizerState: EqualizerState;

  // Movies & Recommendations
  moviesList: Movie[];
  heroMovies: Movie[];

  // User Library & Queues
  favorites: Set<string>;
  favoriteSongs: Set<string>;
  playlists: Playlist[];
  toasts: ToastItem[];
  manualQueue: Song[];
  autoQueue: Song[];
  addToManualQueue: (song: Song, playNext?: boolean) => void;
  removeFromManualQueue: (id: string) => void;
  clearManualQueue: () => void;
  setAutoQueue: (songs: Song[]) => void;

  // Actions
  loadAllTimeSongs: () => Promise<void>;
  playSong: (song: Song) => Promise<boolean>;
  playTrack: (song: Song) => Promise<boolean>;
  playSongAtIndex: (index: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number | null) => void;

  setAudioState: (state: PlayerAudioState) => void;
  setActiveEngine: (engine: SourceType) => void;
  setMediaErrorMsg: (msg: string | null) => void;
  addDebugLog: (log: string) => void;
  toggleDebugPanel: () => void;

  toggleSidebar: () => void;
  toggleContextDrawer: () => void;
  setContextDrawerView: (view: 'lyrics' | 'visualizer') => void;

  setCategory: (category: Category) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveView: (view: string) => void;
  setSearchQuery: (query: string) => void;
  setSongsCatalog: (songs: Song[]) => void;
  setMoviesList: (movies: Movie[]) => void;

  toggleLyricsPanel: () => void;
  toggleQueueModal: () => void;
  toggleEqualizer: () => void;
  toggleApiKeyModal: () => void;
  togglePlaylistsModal: () => void;
  toggleFullPlayerModal: () => void;
  openFullPlayerModal: () => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setEqualizerState: (eq: Partial<EqualizerState>) => void;

  // Dedicated Video State & Actions (Separated from Music Player)
  activeVideo: Movie | null;
  isVideoPlaying: boolean;
  videoCurrentTime: number;
  videoDuration: number;
  videoVolume: number;
  isVideoMuted: boolean;
  videoError: string | null;

  openVideo: (movie: Movie) => void;
  closeVideo: () => void;
  setVideoPlaying: (playing: boolean) => void;
  setVideoCurrentTime: (time: number) => void;
  setVideoDuration: (dur: number) => void;
  setVideoVolume: (vol: number) => void;
  toggleVideoMute: () => void;
  setVideoError: (err: string | null) => void;

  toggleMovieFavorite: (id: string) => void;
  toggleSongFavorite: (id: string) => void;
  clearFavoriteSongs: () => void;
  isFavorite: (id: string) => boolean;
  addPlaylist: (name: string) => void;
  removePlaylist: (id: string) => void;
  editPlaylist: (id: string, name: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  showToast: (message: string, icon?: string) => void;
  removeToast: (id: string) => void;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  artistThemeColor: '#1DB954',
  artistThemeName: 'Spotify Emerald',
  themeMode: 'vision-glass',
  enableSpatialGlow: true,
  enableCursorFollower: true,
  streamingQuality: 'lossless',
  smartAdaptiveBitrate: true,
  smartAudioEnhancer: true,
  smartSilenceDetection: true,
  smartSleepTimer: 0,
  smartAutoCacheClean: true,
  normalizeVolume: true,
  volumeLevel: 'normal',
  crossfadeDuration: 0,
  gaplessPlayback: true,
  spatialSurroundEngine: true,
  autoPlaySimilar: true,
  autoShowLyrics: true,
  showCanvasVideo: true,
  desktopNotifications: false,
  privateSession: false,
  shareListeningActivity: true,
  showTopGenresPublic: true,
  showRecentlyPlayedProfile: true,
  cacheSizeBytes: 1420000000
};

const getInitialAppSettings = (): AppSettings => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('app_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.artistThemeColor === '#F3C649' || parsed.artistThemeName?.includes('Nova Gold')) {
          parsed.artistThemeColor = '#1DB954';
          parsed.artistThemeName = 'Spotify Emerald';
          localStorage.setItem('app_settings', JSON.stringify(parsed));
        }
        return { ...DEFAULT_APP_SETTINGS, ...parsed };
      }
    }
  } catch (e) {}
  return DEFAULT_APP_SETTINGS;
};

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Nova Ross',
  email: 'nova.ross@wavelength.io',
  username: '@novaross',
  role: 'Verified Artist',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  location: 'Los Angeles, CA',
  monthlyListeners: '62,140',
  tagline: 'Synth-pop producer & vocalist — night-drive sound.',
  bio: 'Synth-pop producer & vocalist — night-drive sound.',
  genres: ['Synth-pop', 'Dream pop', 'Downtempo', 'Chillwave']
};

const getInitialUserProfile = (): UserProfile => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        return { ...DEFAULT_USER_PROFILE, ...JSON.parse(stored) };
      }
    }
  } catch (e) {}
  return DEFAULT_USER_PROFILE;
};

const getInitialAuthState = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const session = localStorage.getItem('music_auth_session');
      if (session !== null) {
        if (session === 'false') return false;
        if (session === 'true') return true;
        try {
          const parsed = JSON.parse(session);
          return !!parsed?.email;
        } catch (e) {
          return true;
        }
      }
    }
  } catch (e) {}
  return true; // Default session so app starts authenticated, can be signed out anytime
};

const getInitialRecentlyPlayed = (): Song[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('recently_played');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {}
  return [...SONGS_CATALOG.slice(0, 4)];
};

const getInitialFavoriteSongs = (): Set<string> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('liked_songs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    }
  } catch (e) {}
  return new Set(['youtube:4NRXx6U8ABQ', 'youtube:XXYlFuWEuKI']);
};

export const useMusicStore = create<MusicStoreState>((set, get) => ({
  appSettings: getInitialAppSettings(),

  updateAppSettings: (settings) =>
    set((state) => {
      const updated = { ...state.appSettings, ...settings };
      try {
        localStorage.setItem('app_settings', JSON.stringify(updated));
      } catch (e) {}
      return { appSettings: updated };
    }),

  clearAudioCache: () =>
    set((state) => {
      const updated = { ...state.appSettings, cacheSizeBytes: 0 };
      try {
        localStorage.setItem('app_settings', JSON.stringify(updated));
      } catch (e) {}
      get().showToast('Audio cache cleared successfully', 'check');
      return { appSettings: updated };
    }),

  isScrolled: false,
  setIsScrolled: (scrolled: boolean) => set({ isScrolled: scrolled }),
  isHeaderVisible: true,
  setIsHeaderVisible: (visible: boolean) => set({ isHeaderVisible: visible }),
  showIntroSplash: true,
  setShowIntroSplash: (show: boolean) => set({ showIntroSplash: show }),

  userProfile: getInitialUserProfile(),
  isAuthenticated: getInitialAuthState(),
  recentlyPlayed: getInitialRecentlyPlayed(),

  updateUserProfile: (profile) =>
    set((state) => {
      const updated = { ...state.userProfile, ...profile };
      try {
        localStorage.setItem('user_profile', JSON.stringify(updated));
      } catch (e) {}
      return { userProfile: updated };
    }),

  login: async (identifier: string) => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, error: 'Please enter your email or username.' };
    }

    const isEmail = cleanId.includes('@') && cleanId.includes('.');
    const current = get().userProfile;
    
    let updated: UserProfile;
    if (isEmail) {
      updated = {
        ...current,
        email: cleanId,
        username: current.username || `@${cleanId.split('@')[0]}`
      };
    } else {
      const usernameFormat = cleanId.startsWith('@') ? cleanId : `@${cleanId}`;
      updated = {
        ...current,
        username: usernameFormat,
        name: current.name !== 'John Doe' ? current.name : cleanId.replace('@', '') // fallback name
      };
    }

    try {
      localStorage.setItem('music_auth_session', JSON.stringify({ identifier: cleanId, loggedInAt: Date.now() }));
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}

    set({
      isAuthenticated: true,
      userProfile: updated
    });

    get().showToast('Welcome back! Signed in successfully.', 'check');
    return { success: true };
  },

  signup: async (name: string, email: string) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanName) {
      return { success: false, error: 'Please enter your name.' };
    }
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const username = `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'musiclover'}`;
    const updated: UserProfile = {
      name: cleanName,
      email: cleanEmail,
      username,
      role: 'Music Enthusiast',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      location: 'Global',
      monthlyListeners: '0',
      followersCount: 0,
      followingCount: 0,
      tagline: 'Music listener & curator.',
      bio: 'Discovering tracks and curated playlists on MARQUEE.',
      genres: ['Synth-pop', 'Pop', 'Chillwave']
    };

    try {
      localStorage.setItem('music_auth_session', JSON.stringify({ email: cleanEmail, loggedInAt: Date.now() }));
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}

    set({
      isAuthenticated: true,
      userProfile: updated
    });

    get().showToast(`Account created! Welcome, ${cleanName}.`, 'check');
    return { success: true };
  },

  logout: () => {
    try {
      localStorage.setItem('music_auth_session', 'false');
    } catch (e) {}
    set({ isAuthenticated: false });
    get().showToast('Logged out of your account.', 'info');
  },

  showAuthModal: false,
  toggleAuthModal: () => set((state) => ({ showAuthModal: !state.showAuthModal })),
  openAuthModal: () => set({ showAuthModal: true }),
  closeAuthModal: () => set({ showAuthModal: false }),

  showSearchModal: false,
  toggleSearchModal: () => set((state) => ({ showSearchModal: !state.showSearchModal })),
  openSearchModal: () => set({ showSearchModal: true }),
  closeSearchModal: () => set({ showSearchModal: false }),

  loginWithGoogle: async () => {
    const updated: UserProfile = {
      name: 'Google User',
      email: 'user@gmail.com',
      username: '@google_user',
      role: 'Music Enthusiast',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      location: 'Global',
      monthlyListeners: '0',
      tagline: 'Signed in with Google',
      genres: ['Pop', 'Ambient']
    };
    try {
      localStorage.setItem('music_auth_session', JSON.stringify({ email: updated.email, provider: 'google', loggedInAt: Date.now() }));
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}
    set({ isAuthenticated: true, userProfile: updated, showAuthModal: false });
    get().showToast('Signed in with Google', 'check');
  },

  loginWithX: async () => {
    const updated: UserProfile = {
      name: 'Twitter User',
      email: 'user@x.com',
      username: '@x_user',
      role: 'Music Enthusiast',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      location: 'Global',
      monthlyListeners: '0',
      tagline: 'Signed in with X / Twitter',
      genres: ['Electronic', 'Synthwave']
    };
    try {
      localStorage.setItem('music_auth_session', JSON.stringify({ email: updated.email, provider: 'x', loggedInAt: Date.now() }));
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}
    set({ isAuthenticated: true, userProfile: updated, showAuthModal: false });
    get().showToast('Signed in with Twitter / X', 'check');
  },

  loginWithInstagram: async () => {
    const updated: UserProfile = {
      name: 'Instagram User',
      email: 'user@instagram.com',
      username: '@insta_vibes',
      role: 'Music Curator',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
      location: 'Los Angeles, CA',
      monthlyListeners: '1.2k',
      tagline: 'Signed in with Instagram',
      genres: ['Pop', 'R&B', 'Chillwave']
    };
    try {
      localStorage.setItem('music_auth_session', JSON.stringify({ email: updated.email, provider: 'instagram', loggedInAt: Date.now() }));
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}
    set({ isAuthenticated: true, userProfile: updated, showAuthModal: false });
    get().showToast('Signed in with Instagram', 'check');
  },

  loginWithFacebook: async () => {
    const updated: UserProfile = {
      name: 'Facebook User',
      email: 'user@facebook.com',
      username: '@fb_user',
      role: 'Music Listener',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      location: 'New York, NY',
      monthlyListeners: '500',
      tagline: 'Signed in with Facebook',
      genres: ['Rock', 'Classics']
    };
    try {
      localStorage.setItem('music_auth_session', JSON.stringify({ email: updated.email, provider: 'facebook', loggedInAt: Date.now() }));
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}
    set({ isAuthenticated: true, userProfile: updated, showAuthModal: false });
    get().showToast('Signed in with Facebook', 'check');
  },

  loginWithLinkedIn: async () => {
    const updated: UserProfile = {
      name: 'LinkedIn User',
      email: 'pro@linkedin.com',
      username: '@pro_music',
      role: 'Audio Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      location: 'London, UK',
      monthlyListeners: '3.4k',
      tagline: 'Signed in with LinkedIn',
      genres: ['Classical', 'Ambient', 'Jazz']
    };
    try {
      localStorage.setItem('music_auth_session', JSON.stringify({ email: updated.email, provider: 'linkedin', loggedInAt: Date.now() }));
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}
    set({ isAuthenticated: true, userProfile: updated, showAuthModal: false });
    get().showToast('Signed in with LinkedIn', 'check');
  },

  loginWithTwitter: async () => {
    const updated: UserProfile = {
      name: 'Twitter User',
      email: 'user@twitter.com',
      username: '@twitter_tunes',
      role: 'Beat Producer',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      location: 'Tokyo, Japan',
      monthlyListeners: '890',
      tagline: 'Signed in with Twitter',
      genres: ['Lo-Fi', 'Hip-Hop']
    };
    try {
      localStorage.setItem('music_auth_session', JSON.stringify({ email: updated.email, provider: 'twitter', loggedInAt: Date.now() }));
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}
    set({ isAuthenticated: true, userProfile: updated, showAuthModal: false });
    get().showToast('Signed in with Twitter', 'check');
  },

  addToRecentlyPlayed: (song: Song) => {
    set((state) => {
      const filtered = state.recentlyPlayed.filter((s) => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 20);
      try {
        localStorage.setItem('recently_played', JSON.stringify(updated));
      } catch (e) {}
      return { recentlyPlayed: updated };
    });
  },

  // Dedicated Video State (Isolated from Music)
  activeVideo: null,
  isVideoPlaying: false,
  videoCurrentTime: 0,
  videoDuration: 0,
  videoVolume: 1.0,
  isVideoMuted: false,
  videoError: null,

  openVideo: (movie: Movie) => {
    // 1. Pause any running music
    if (get().isPlayingAudio) {
      musicPlayer.togglePlay();
    }
    // 2. Open dedicated video view
    set({
      activeVideo: movie,
      activeView: 'watch',
      isVideoPlaying: true,
      videoCurrentTime: 0,
      videoDuration: 0,
      videoError: null
    });
  },

  closeVideo: () => {
    set({
      activeVideo: null,
      isVideoPlaying: false,
      activeView: 'home'
    });
  },

  setVideoPlaying: (playing: boolean) => set({ isVideoPlaying: playing }),
  setVideoCurrentTime: (time: number) => set({ videoCurrentTime: time }),
  setVideoDuration: (dur: number) => set({ videoDuration: dur }),
  setVideoVolume: (vol: number) => set({ videoVolume: Math.max(0, Math.min(1, vol)) }),
  toggleVideoMute: () => set((s) => ({ isVideoMuted: !s.isVideoMuted })),
  setVideoError: (err: string | null) => set({ videoError: err }),

  selectedTrack: SONGS_CATALOG[0] || null,
  loadingTrack: null,
  activeTrack: SONGS_CATALOG[0] || null,
  activeTrackId: SONGS_CATALOG[0]?.canonicalTrackId || SONGS_CATALOG[0]?.id || null,
  playbackRequestId: 0,
  playbackStatus: 'idle',
  songsCatalog: [...SONGS_CATALOG],
  activeSongIndex: 0,
  isPlayingAudio: false,
  hasPlaybackStarted: false,
  setHasPlaybackStarted: (started: boolean) => set({ hasPlaybackStarted: started }),
  volume: 1.0,
  isMuted: false,
  repeatMode: 'off',
  isShuffle: false,
  currentTime: 0,
  duration: 0,

  audioState: 'idle',
  activeEngine: 'youtube',
  mediaErrorMsg: null,
  debugLogs: [`[${new Date().toLocaleTimeString()}] Canonical Audio System Initialized`],
  showDebugPanel: false,

  isSidebarExpanded: true,
  showContextDrawer: true,
  contextDrawerView: 'lyrics',

  currentCategory: 'Music',
  viewMode: 'music',
  activeView: 'home',
  activeSubTab: 'grid',
  setActiveSubTab: (tab: 'grid' | 'split' | 'lyrics') => set({ activeSubTab: tab }),
  searchQuery: '',
  showLyricsPanel: true,
  showQueueModal: false,
  showEqualizer: false,
  showApiKeyModal: false,
  showPlaylistsModal: false,
  showFullPlayerModal: false,
  visualizerMode: 'bars',
  equalizerState: {
    preset: 'spatial',
    bass: 3,
    mid: 0,
    treble: 2,
    panner: 0
  },

  moviesList: [],
  heroMovies: [],

  favorites: new Set(),
  favoriteSongs: getInitialFavoriteSongs(),
  playlists: [
    { id: 'pl-1', name: 'VisionOS Spatial Ambient', songs: ['youtube:4NRXx6U8ABQ', 'youtube:34Na4j8AVgA'] },
    { id: 'pl-2', name: 'Sci-Fi Epic OSTs', songs: ['itunes:1721543292'] }
  ],
  toasts: [],
  manualQueue: [],
  autoQueue: [],

  addToManualQueue: (song: Song, playNext = false) => {
    set((state) => {
      const targetId = song.canonicalTrackId || song.id;
      const filtered = state.manualQueue.filter((s) => (s.canonicalTrackId || s.id) !== targetId);
      const updated = playNext ? [song, ...filtered] : [...filtered, song];
      return { manualQueue: updated };
    });
    get().showToast(playNext ? `Playing "${song.title}" next` : `Added "${song.title}" to queue`, 'check');
  },

  removeFromManualQueue: (id: string) => {
    set((state) => ({
      manualQueue: state.manualQueue.filter((s) => (s.canonicalTrackId || s.id) !== id && s.id !== id)
    }));
  },

  clearManualQueue: () => {
    set({ manualQueue: [] });
    get().showToast('Cleared manual queue', 'trash');
  },

  setAutoQueue: (songs: Song[]) => {
    set({ autoQueue: songs });
  },

  loadAllTimeSongs: async () => {
    try {
      // 1. Quota-aware YouTube Data API fetch: 1-unit mostPopular for IN (Hindi/Bollywood) & US (English)
      const [hindiTrending, usTrending] = await Promise.all([
        youtubeDataService.getTrendingMusicVideos('IN', 30),
        youtubeDataService.getTrendingMusicVideos('US', 25)
      ]);

      let youtubeSongs: Song[] = [];
      if (hindiTrending.length > 0 || usTrending.length > 0) {
        youtubeSongs = youtubeDataService.interleaveTracks(hindiTrending, usTrending);
      }

      if (youtubeSongs.length > 0) {
        const currentActive = get().activeTrack;
        const currentCatalog = get().songsCatalog;
        const existingIds = new Set(currentCatalog.map((s) => s.canonicalTrackId || s.id));
        const newSongs = youtubeSongs.filter((s) => !existingIds.has(s.canonicalTrackId || s.id));
        const merged = [...currentCatalog, ...newSongs];
        set({ songsCatalog: merged });
        if (!currentActive && merged.length > 0) {
          set({
            activeTrack: merged[0],
            activeTrackId: merged[0].canonicalTrackId || merged[0].id,
            duration: 0
          });
        }
        return;
      }

      // Fallback to local/cached songs if offline or quota limit reached
      const allTime = await fetchAllTimeSongs();
      if (allTime && allTime.length > 0) {
        const currentActive = get().activeTrack;
        const currentCatalog = get().songsCatalog;
        const existingIds = new Set(currentCatalog.map((s) => s.canonicalTrackId || s.id));
        const newSongs = allTime.filter((s) => !existingIds.has(s.canonicalTrackId || s.id));
        const merged = [...currentCatalog, ...newSongs];
        set({ songsCatalog: merged });
        if (!currentActive && merged.length > 0) {
          set({
            activeTrack: merged[0],
            activeTrackId: merged[0].canonicalTrackId || merged[0].id,
            duration: 0
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load all time songs:', e);
    }
  },

  playSong: async (song: Song) => {
    set({ hasPlaybackStarted: true });
    get().addToRecentlyPlayed(song);
    const success = await musicPlayer.playTrack(song);

    // Asynchronously populate Auto Queue (Song Radio) based on seed track
    songRadioService.generateRadioForTrack(song, get().songsCatalog).then((radioTracks) => {
      set({ autoQueue: radioTracks });
    }).catch((e) => console.warn('Song radio error:', e));

    return success;
  },

  playTrack: async (song: Song) => {
    set({ hasPlaybackStarted: true });
    get().addToRecentlyPlayed(song);
    const success = await musicPlayer.playTrack(song);

    songRadioService.generateRadioForTrack(song, get().songsCatalog).then((radioTracks) => {
      set({ autoQueue: radioTracks });
    }).catch((e) => console.warn('Song radio error:', e));

    return success;
  },

  playSongAtIndex: (index: number) => {
    set({ hasPlaybackStarted: true });
    const { songsCatalog } = get();
    if (index < 0 || index >= songsCatalog.length) return;
    const song = songsCatalog[index];
    if (song) {
      get().playTrack(song);
    }
  },

  togglePlay: () => {
    musicPlayer.togglePlay();
  },

  playNext: () => {
    const { manualQueue, autoQueue, songsCatalog, activeSongIndex, isShuffle } = get();

    // 1. Manual Queue ("Play Next" / "Add to Queue") ALWAYS plays before auto queue
    if (manualQueue && manualQueue.length > 0) {
      const [nextSong, ...remaining] = manualQueue;
      set({ manualQueue: remaining });
      musicPlayer.playTrack(nextSong);
      return;
    }

    // 2. Auto Queue (Song Radio) plays next
    if (autoQueue && autoQueue.length > 0) {
      const [nextSong, ...remaining] = autoQueue;
      set({ autoQueue: remaining });

      // If fewer than 5 remain, refill without blocking
      if (remaining.length < 5) {
        songRadioService.refillRadioQueue(songsCatalog).then((moreTracks) => {
          if (moreTracks.length > 0) {
            set((state) => ({ autoQueue: [...state.autoQueue, ...moreTracks] }));
          }
        }).catch((e) => console.warn('Radio refill error:', e));
      }

      musicPlayer.playTrack(nextSong);
      return;
    }

    // 3. Fallback to catalog sequential / shuffle
    if (!songsCatalog || songsCatalog.length === 0) return;
    let nextIdx = activeSongIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * songsCatalog.length);
    } else if (nextIdx >= songsCatalog.length) {
      nextIdx = 0;
    }
    const nextSong = songsCatalog[nextIdx];
    if (nextSong) {
      musicPlayer.playTrack(nextSong);
    }
  },

  playPrev: () => {
    const { activeSongIndex, songsCatalog } = get();
    if (!songsCatalog || songsCatalog.length === 0) return;
    let prevIdx = activeSongIndex - 1;
    if (prevIdx < 0) prevIdx = songsCatalog.length - 1;
    const prevSong = songsCatalog[prevIdx];
    if (prevSong) {
      musicPlayer.playTrack(prevSong);
    }
  },

  setVolume: (vol) => {
    musicPlayer.setVolume(vol);
    set({ volume: Math.max(0, Math.min(1, vol)) });
  },

  toggleMute: () => {
    const nextMute = !get().isMuted;
    musicPlayer.setVolume(nextMute ? 0 : get().volume);
    set({ isMuted: nextMute });
  },

  setRepeatMode: (mode) => set({ repeatMode: mode }),
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (dur) => set({ duration: dur }),

  setAudioState: (state) => set({ audioState: state }),
  setActiveEngine: (engine) => set({ activeEngine: engine }),
  setMediaErrorMsg: (msg) => set({ mediaErrorMsg: msg }),
  addDebugLog: (log) =>
    set((state) => ({
      debugLogs: [`[${new Date().toLocaleTimeString()}] ${log}`, ...state.debugLogs.slice(0, 49)]
    })),
  toggleDebugPanel: () => set((state) => ({ showDebugPanel: !state.showDebugPanel })),

  toggleSidebar: () => set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
  toggleContextDrawer: () => set((state) => ({ showContextDrawer: !state.showContextDrawer })),
  setContextDrawerView: (view) => set({ contextDrawerView: view }),

  setCategory: (category) => set({ currentCategory: category }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveView: (view) => set({ activeView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSongsCatalog: (songs) => set({ songsCatalog: songs }),
  setMoviesList: (movies) => set({ moviesList: movies }),

  toggleLyricsPanel: () => set((state) => ({ showLyricsPanel: !state.showLyricsPanel })),
  toggleQueueModal: () => set((state) => ({ showQueueModal: !state.showQueueModal })),
  toggleEqualizer: () => set((state) => ({ showEqualizer: !state.showEqualizer })),
  toggleApiKeyModal: () => set((state) => ({ showApiKeyModal: !state.showApiKeyModal })),
  togglePlaylistsModal: () => set((state) => ({ showPlaylistsModal: !state.showPlaylistsModal })),
  toggleFullPlayerModal: () => set((state) => ({ showFullPlayerModal: !state.showFullPlayerModal })),
  openFullPlayerModal: () => set({ showFullPlayerModal: true }),
  setVisualizerMode: (mode) => set({ visualizerMode: mode }),
  setEqualizerState: (eq) => set((state) => ({ equalizerState: { ...state.equalizerState, ...eq } })),

  toggleMovieFavorite: (id) =>
    set((state) => {
      const newFavs = new Set(state.favorites);
      if (newFavs.has(id)) newFavs.delete(id);
      else newFavs.add(id);
      return { favorites: newFavs };
    }),

  toggleSongFavorite: (id) =>
    set((state) => {
      const newFavs = new Set(state.favoriteSongs);
      if (newFavs.has(id)) newFavs.delete(id);
      else newFavs.add(id);
      try {
        localStorage.setItem('liked_songs', JSON.stringify(Array.from(newFavs)));
      } catch (e) {}
      return { favoriteSongs: newFavs };
    }),

  clearFavoriteSongs: () =>
    set(() => {
      try {
        localStorage.removeItem('liked_songs');
      } catch (e) {}
      return { favoriteSongs: new Set() };
    }),

  isFavorite: (id) => get().favorites.has(id),

  addPlaylist: (name) =>
    set((state) => ({
      playlists: [...state.playlists, { id: `pl-${Date.now()}`, name, songs: [] }]
    })),

  removePlaylist: (id) =>
    set((state) => ({
      playlists: state.playlists.filter(pl => pl.id !== id)
    })),

  editPlaylist: (id, name) =>
    set((state) => ({
      playlists: state.playlists.map(pl => pl.id === id ? { ...pl, name } : pl)
    })),

  addSongToPlaylist: (playlistId, songId) =>
    set((state) => ({
      playlists: state.playlists.map(pl => pl.id === playlistId ? { ...pl, songs: pl.songs.includes(songId) ? pl.songs : [...pl.songs, songId] } : pl)
    })),

  removeSongFromPlaylist: (playlistId, songId) =>
    set((state) => ({
      playlists: state.playlists.map(pl => pl.id === playlistId ? { ...pl, songs: pl.songs.filter(s => s !== songId) } : pl)
    })),

  showToast: (message, icon = 'info') => {
    // Suppress popups when music is played or options are clicked
    if (
      !message ||
      message.startsWith('Now Playing:') ||
      message.startsWith('Playing') ||
      message.startsWith('Options for') ||
      message.startsWith('Opened') ||
      message.startsWith('Opening Artist:') ||
      message.startsWith('Streaming Soundtrack') ||
      message.startsWith('Shuffling Favorite:')
    ) {
      return;
    }

    const id = `toast-${Date.now()}`;
    set({ toasts: [{ id, message, icon }] });

    setTimeout(() => {
      get().removeToast(id);
    }, 2000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}));
