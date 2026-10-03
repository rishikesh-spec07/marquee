import { musicPlayer } from './playerCore';

class AudioFXService {
  init(): void {
    // Single audio element managed directly inside musicPlayer
  }

  resume(): void {
    // Audio Context state
  }

  getAnalyserNode(): AnalyserNode | null {
    return null;
  }

  setEqualizer(_bass: number, _mid: number, _treble: number, _panner: number): void {
    // Equalizer parameters updated in store
  }
}

export const soundFX = new AudioFXService();
