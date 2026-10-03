import React from 'react';
import { Sliders, X } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { soundFX } from '../services/audioFX';

export const EqualizerDrawer: React.FC = () => {
  const { showEqualizer, toggleEqualizer, equalizerState, setEqualizerState } = useMusicStore();

  if (!showEqualizer) return null;

  const handleBassChange = (val: number) => {
    setEqualizerState({ bass: val });
    soundFX.setEqualizer(val, equalizerState.mid, equalizerState.treble, equalizerState.panner);
  };

  const handleMidChange = (val: number) => {
    setEqualizerState({ mid: val });
    soundFX.setEqualizer(equalizerState.bass, val, equalizerState.treble, equalizerState.panner);
  };

  const handleTrebleChange = (val: number) => {
    setEqualizerState({ treble: val });
    soundFX.setEqualizer(equalizerState.bass, equalizerState.mid, val, equalizerState.panner);
  };

  const handlePresetSelect = (preset: string) => {
    let bass = 0, mid = 0, treble = 0;
    if (preset === 'bass') { bass = 8; mid = -2; treble = 2; }
    else if (preset === 'vocal') { bass = -2; mid = 6; treble = 4; }
    else if (preset === 'spatial') { bass = 5; mid = 2; treble = 5; }
    else if (preset === 'club') { bass = 7; mid = 3; treble = 6; }

    setEqualizerState({ preset, bass, mid, treble });
    soundFX.setEqualizer(bass, mid, treble, equalizerState.panner);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-black/85 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 w-[90vw] max-w-[460px] text-white shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold">Spatial 5-Band Equalizer & FX</h3>
          </div>
          <button
            onClick={toggleEqualizer}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {['spatial', 'bass', 'vocal', 'club', 'flat'].map((p) => (
            <button
              key={p}
              onClick={() => handlePresetSelect(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                equalizerState.preset === p
                  ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between">
            <span>Bass Boost ({equalizerState.bass} dB)</span>
            <input
              type="range"
              min="-12"
              max="12"
              value={equalizerState.bass}
              onChange={(e) => handleBassChange(parseFloat(e.target.value))}
              className="w-48 accent-indigo-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Mid Range ({equalizerState.mid} dB)</span>
            <input
              type="range"
              min="-12"
              max="12"
              value={equalizerState.mid}
              onChange={(e) => handleMidChange(parseFloat(e.target.value))}
              className="w-48 accent-indigo-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Treble ({equalizerState.treble} dB)</span>
            <input
              type="range"
              min="-12"
              max="12"
              value={equalizerState.treble}
              onChange={(e) => handleTrebleChange(parseFloat(e.target.value))}
              className="w-48 accent-indigo-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
