export interface LyricLine {
  time: number;
  text: string;
}

export type TrackSourceType = 'direct' | 'youtube' | 'html5' | 'none' | 'unavailable';
export type SourceType = TrackSourceType; // Backward compatibility alias
export type PlaybackType = 'full' | 'preview' | 'youtube' | 'unavailable';
export type PlayerAudioState = 'idle' | 'buffering' | 'playing' | 'paused' | 'error';

export type PlaybackStatus =
  | 'idle'
  | 'resolving'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export interface PlaybackError {
  trackId: string;
  engine: 'html5' | 'youtube' | 'resolver';
  code: string;
  message: string;
}

export interface ResolvedPlaybackSource {
  type: 'html5' | 'youtube';
  url?: string;
  videoId?: string;
  duration?: number;
}

export interface StreamResolutionResult {
  success: boolean;
  track?: Song;
  error?: string;
}

export type MusicErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'INVALID_RESPONSE'
  | 'NO_RESULTS'
  | 'PLAYBACK_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'AUTOPLAY_BLOCKED';

export type MediaType = 'music' | 'movie' | 'animation';

export interface Song {
  id: string; // Canonical Track ID e.g. "jiosaavn:w_RKY1SK", "itunes:1721543292", "youtube:4NRXx6U8ABQ"
  canonicalTrackId?: string;
  providerTrackId?: string;
  provider?: string;
  mediaType?: 'music';

  title: string;
  artist: string;
  album: string;
  albumArt: string; // Immutable, normalized artwork URL

  audioUrl?: string;
  sourceType?: TrackSourceType;
  playbackType?: PlaybackType;
  duration?: number | null; // Null until loadedmetadata confirms actual media duration
  isPlayable?: boolean;

  lyrics?: {
    type?: 'synced' | 'plain';
    lines?: LyricLine[];
  } | LyricLine[];

  themeGradient?: string;
  themeColor?: string;
  genre?: string;
  youtubeId?: string;
  videoUrl?: string;
  trackTimeMillis?: number;
  language?: 'hindi' | 'english' | 'punjabi' | 'regional';
  viewCount?: number;
}

export interface Movie {
  id: string;
  mediaType?: 'movie' | 'animation';
  tmdbId?: number;
  isTv?: boolean;
  title: string;
  year?: string;
  rating?: string;
  quality?: string;
  duration?: string;
  genre?: string;
  genreTag?: string;
  bannerImg?: string;
  poster?: string;
  posterImg?: string;
  description?: string;
  tags?: string[];
  subTags?: string[];
  videoUrl?: string;
  videoId?: string; // YouTube videoId for video player
  director?: string;
  cast?: string;
  isFavorite?: boolean;
  downloaded?: boolean;
  category?: string;
  time?: string;
  addedDate?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: string[]; // array of canonical song IDs
}

export interface EqualizerState {
  preset: string; // 'spatial' | 'bass' | 'vocal' | 'flat' | 'club'
  bass: number;   // -12 to 12 dB
  mid: number;    // -12 to 12 dB
  treble: number; // -12 to 12 dB
  panner: number; // -1 to 1
}

export type VisualizerMode = 'circular' | 'particles' | 'bars';
export type RepeatMode = 'off' | 'all' | 'one';
export type ViewMode = 'movie' | 'music';
export type Category = 'Movies' | 'Music' | 'Categories' | 'TV Series' | 'Animation' | 'Mystery' | 'My Library';
