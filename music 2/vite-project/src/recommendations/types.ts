// Recommendation Engine Types (types.ts)
import type { Song } from '../types';

export interface PlayHistoryEntry {
  id: string;
  trackId: string;
  canonicalTrackId: string;
  title: string;
  artist: string;
  genre: string;
  albumArt: string;
  timestamp: number;
  duration: number;
  listenDuration: number;
  completionRate: number; // 0.0 - 1.0
  skipped: boolean;       // skipped before 30 seconds
  liked: boolean;
}

export interface TasteProfile {
  artistWeights: Record<string, number>;
  genreWeights: Record<string, number>;
  moodWeights: Record<string, number>;
  totalPlays: number;
  lastUpdated: number;
  coldStartCompleted: boolean;
  preferredGenres: string[];
  preferredArtists: string[];
}

export interface CollaborativePair {
  trackA: string;
  trackB: string;
  count: number;
  lastCoOccurred: number;
}

export interface RecommendationScore {
  song: Song;
  contentScore: number;
  collaborativeScore: number;
  trendingScore: number;
  finalScore: number;
  reason: string;
}

export interface SavedPlaybackState {
  trackId: string;
  currentTime: number;
  queue: string[];
  history: string[];
  timestamp: number;
}
