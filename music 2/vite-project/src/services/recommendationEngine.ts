import type { Song } from '../types';

interface UserInteraction {
  trackId: string;
  listenSecs: number;
  totalSecs: number;
  isLiked: boolean;
  timestamp: number;
}

class FrontendRecommendationEngine {
  private history: UserInteraction[] = [];
  private userPreferenceVector: number[] = new Array(8).fill(0.5);

  public logInteraction(track: Song, listenSecs: number, totalSecs: number, isLiked: boolean) {
    const ratio = totalSecs > 0 ? listenSecs / totalSecs : 0;
    let score = 0;

    if (ratio < 0.25) {
      score = -0.8; // Skip penalty
    } else if (ratio > 0.8) {
      score = 1.0; // Full completion
    } else {
      score = 0.2 * ratio;
    }

    if (isLiked) score += 2.5;

    this.history.push({
      trackId: track.id,
      listenSecs,
      totalSecs,
      isLiked,
      timestamp: Date.now()
    });

    // Update vector weights
    const features = this.extractAcousticVector(track);
    for (let i = 0; i < features.length; i++) {
      this.userPreferenceVector[i] = 0.85 * this.userPreferenceVector[i] + 0.15 * score * features[i];
    }
  }

  public getSongRadioQueue(seedTrack: Song, catalog: Song[], limit: number = 15): Song[] {
    const seedVector = this.extractAcousticVector(seedTrack);
    const candidates = catalog.filter((s) => s.id !== seedTrack.id);

    const scored = candidates.map((song) => {
      const vec = this.extractAcousticVector(song);
      const similarity = this.cosineSimilarity(seedVector, vec);
      const genreMatch = song.genre?.toLowerCase() === seedTrack.genre?.toLowerCase() ? 0.25 : 0;
      return { song, score: similarity + genreMatch };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((item) => item.song);
  }

  public getDiscoverWeekly(catalog: Song[], favorites: Set<string>, limit: number = 15): Song[] {
    const unlistened = catalog.filter((s) => !favorites.has(s.id));
    const scored = unlistened.map((song) => {
      const vec = this.extractAcousticVector(song);
      const score = this.cosineSimilarity(this.userPreferenceVector, vec);
      return { song, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // 80% Exploitation + 20% Exploration
    const numExploit = Math.floor(limit * 0.8);
    const numExplore = limit - numExploit;

    const exploit = scored.slice(0, numExploit).map((x) => x.song);
    const explorePool = scored.slice(numExploit, numExploit + 20).map((x) => x.song);
    const explore = explorePool.sort(() => 0.5 - Math.random()).slice(0, numExplore);

    return [...exploit, ...explore];
  }

  public getDailyMixes(catalog: Song[]): Record<string, Song[]> {
    const genres = Array.from(new Set(catalog.map((s) => s.genre || '3D Audio')));
    const mixes: Record<string, Song[]> = {};

    genres.slice(0, 4).forEach((genre, idx) => {
      const tracks = catalog.filter((s) => (s.genre || '3D Audio') === genre);
      mixes[`Daily Mix ${idx + 1} (${genre})`] = tracks;
    });

    return mixes;
  }

  private extractAcousticVector(song: Song): number[] {
    const tempoNorm = (song.title.length * 7) % 100 / 100;
    const energy = song.genre === 'Pop' ? 0.8 : song.genre === 'Synthwave' ? 0.9 : 0.6;
    const danceability = (song.artist.length * 5) % 100 / 100;
    const valence = (song.id.length * 9) % 100 / 100;
    return [energy, danceability, valence, tempoNorm, 0.5, 0.5, 0.5, 0.5];
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const recommendationEngine = new FrontendRecommendationEngine();
