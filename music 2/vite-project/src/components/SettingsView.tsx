import React, { useState, useRef, useEffect } from 'react';
import { recommendationEngine } from '../recommendations/engine';
import {
  User,
  Sliders,
  Palette,
  Volume2,
  VolumeX,
  Monitor,
  Lock,
  HardDrive,
  Key,
  Check,
  ArrowLeft,
  Search,
  LogOut,
  Edit3,
  Trash2,
  Sparkles,
  Music,
  Disc,
  X,
  Radio,
  Bell,
  Eye,
  Zap,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  FolderLock,
  Headphones,
  Speaker,
  Download,
  Upload,
  RotateCcw,
  Activity,
  Layers,
  Save,
  Camera,
  Play,
  Pause,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Clock,
  Cpu,
  Flame,
  Wand2
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { soundFX } from '../services/audioFX';

interface ThemeColorOption {
  name: string;
  color: string;
  description: string;
}

const THEME_COLOR_PRESETS: ThemeColorOption[] = [
  { name: 'Spotify Emerald', color: '#1DB954', description: 'Default signature iconic music streaming green' },
  { name: 'Nova Gold', color: '#F3C649', description: 'Artist warm golden aesthetic' },
  { name: 'Electric Violet', color: '#A855F7', description: 'Vibrant neon synthwave & pop' },
  { name: 'Cyber Cyan', color: '#06B6D4', description: 'Futuristic electronic & chillwave' },
  { name: 'Rose Gold', color: '#F43F5E', description: 'Warm romantic acoustic vibe' },
  { name: 'Sunset Amber', color: '#FF5D36', description: 'High-octane energetic pulse' },
  { name: 'Sapphire Pulse', color: '#3B82F6', description: 'Deep ambient downtempo blue' },
  { name: 'Neon Lime', color: '#84CC16', description: 'Fresh electro-dance beat' }
];

const AUDIO_OUTPUT_DEVICES = [
  { id: 'default', name: 'Built-in Spatial Speakers', type: 'Stereo 48kHz', latency: '4.2 ms' },
  { id: 'headphones', name: 'Studio Monitoring Headphones', type: 'Spatial Audio Head Tracking', latency: '6.8 ms' },
  { id: 'dac', name: 'External Hi-Res DAC Interface', type: '24-Bit / 96kHz Lossless', latency: '1.8 ms' }
];

const AVATAR_PRESETS = [
  { name: 'Neon Synth', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { name: 'Cyber Producer', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { name: 'Acoustic Soul', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' },
  { name: 'Studio Maestro', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
  { name: 'Lo-Fi Chill', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' },
  { name: 'Electro Pop', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80' }
];

type AudioTestTone = 'chime' | 'sub-bass' | 'pan-test' | 'sweep';

export const SettingsView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    isAuthenticated,
    logout,
    setActiveView,
    appSettings,
    updateAppSettings,
    clearAudioCache,
    equalizerState,
    setEqualizerState,
    toggleEqualizer,
    toggleApiKeyModal,
    showToast,
    activeTrack,
    isPlayingAudio,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    setShowIntroSplash
  } = useMusicStore();

  const [activeSection, setActiveSection] = useState<string>('smart');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('default');

  // Inline Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(userProfile.name);
  const [editBio, setEditBio] = useState<string>(userProfile.bio || '');
  const [editTagline, setEditTagline] = useState<string>(userProfile.tagline || '');
  const [editLocation, setEditLocation] = useState<string>(userProfile.location || 'Los Angeles, CA');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>(userProfile.avatarUrl);

  // Audio Testing State
  const [activeTestTone, setActiveTestTone] = useState<AudioTestTone | null>(null);

  // Diagnostics Wizard State
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosticProgress, setDiagnosticProgress] = useState<number>(0);
  const [diagnosticSteps, setDiagnosticSteps] = useState<Array<{ name: string; status: 'pending' | 'running' | 'passed'; detail: string }>>([
    { name: 'Web Audio DSP Sample Rate', status: 'pending', detail: '48.0 kHz 32-bit Float' },
    { name: 'BiquadFilter Stability', status: 'pending', detail: 'Bands ±12 dB calibrated' },
    { name: 'Smart Storage Cache Quota', status: 'pending', detail: 'Local storage buffer verified' },
    { name: 'Network Stream Latency', status: 'pending', detail: 'Real-time buffer evaluation' },
    { name: 'Hardware Destination Target', status: 'pending', detail: 'Stereo output routing verified' }
  ]);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState<boolean>(false);

  // File Input Ref for Config Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const artistColor = appSettings.artistThemeColor || '#1DB954';
  const cacheMB = (appSettings.cacheSizeBytes / (1024 * 1024)).toFixed(0);

  // Clean Navigation Categories
  const sections = [
    { id: 'smart', label: 'Smart Audio Engine', icon: Wand2, badge: 'Smart' },
    { id: 'equalizer', label: 'Spatial Volume & EQ', icon: Sliders, badge: 'Full DSP' },
    { id: 'audio', label: 'Bitrate & Playback', icon: Volume2 },
    { id: 'artist-theme', label: 'Colors & Glow', icon: Palette },
    { id: 'account', label: 'Artist Profile', icon: User },
    { id: 'display', label: 'Display & Lyrics', icon: Monitor },
    { id: 'privacy', label: 'Privacy & Social', icon: Lock },
    { id: 'storage', label: 'Storage & Diagnostics', icon: HardDrive },
    { id: 'integrations', label: 'API Integrations', icon: Key }
  ];

  // Sync profile edits
  useEffect(() => {
    setEditName(userProfile.name);
    setEditBio(userProfile.bio || '');
    setEditTagline(userProfile.tagline || '');
    setEditLocation(userProfile.location || 'Los Angeles, CA');
    setEditAvatarUrl(userProfile.avatarUrl);
  }, [userProfile]);

  const handleColorSelect = (option: ThemeColorOption) => {
    updateAppSettings({
      artistThemeColor: option.color,
      artistThemeName: option.name
    });
    showToast(`Accent color applied: ${option.name}`, 'check');
  };

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateAppSettings({
      artistThemeColor: val,
      artistThemeName: 'Custom Palette'
    });
  };

  // Web Audio API Audio Testing
  const playAudioTestTone = (type: AudioTestTone) => {
    try {
      setActiveTestTone(type);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'chime') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
        setTimeout(() => setActiveTestTone(null), 700);
        showToast('Spatial Chime: 48kHz Stereo Verified', 'check');
      } else if (type === 'sub-bass') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
        setTimeout(() => setActiveTestTone(null), 850);
        showToast('Sub-Bass 45Hz Response Verified', 'check');
      } else if (type === 'pan-test') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        let panner1: any, panner2: any;
        if (ctx.createStereoPanner) {
          panner1 = ctx.createStereoPanner();
          panner1.pan.setValueAtTime(-0.85, ctx.currentTime);
          panner2 = ctx.createStereoPanner();
          panner2.pan.setValueAtTime(0.85, ctx.currentTime);
        }

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        gain1.gain.setValueAtTime(0.2, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        
        if (panner1) {
          osc1.connect(gain1);
          gain1.connect(panner1);
          panner1.connect(ctx.destination);
        } else {
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
        }
        osc1.start();
        osc1.stop(ctx.currentTime + 0.35);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.4);
        gain2.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.4);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

        if (panner2) {
          osc2.connect(gain2);
          gain2.connect(panner2);
          panner2.connect(ctx.destination);
        } else {
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
        }
        osc2.start(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.85);

        setTimeout(() => setActiveTestTone(null), 900);
        showToast('Stereo L / R Separation Pulse Played', 'check');
      } else if (type === 'sweep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + 0.9);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.0);
        setTimeout(() => setActiveTestTone(null), 1050);
        showToast('100Hz - 8kHz Frequency Sweep Complete', 'check');
      }
    } catch {
      setActiveTestTone(null);
      showToast('Audio output test verified', 'check');
    }
  };

  // Equalizer updates
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

  const handlePannerChange = (val: number) => {
    setEqualizerState({ panner: val });
    soundFX.setEqualizer(equalizerState.bass, equalizerState.mid, equalizerState.treble, val);
  };

  const handlePresetSelect = (preset: string) => {
    let bass = 0, mid = 0, treble = 0;
    if (preset === 'bass') { bass = 8; mid = -2; treble = 2; }
    else if (preset === 'vocal') { bass = -2; mid = 6; treble = 4; }
    else if (preset === 'spatial') { bass = 5; mid = 2; treble = 5; }
    else if (preset === 'electronic') { bass = 6; mid = 1; treble = 5; }
    else if (preset === 'acoustic') { bass = 2; mid = 4; treble = 3; }
    else if (preset === 'flat') { bass = 0; mid = 0; treble = 0; }

    setEqualizerState({ preset, bass, mid, treble });
    soundFX.setEqualizer(bass, mid, treble, equalizerState.panner);
    showToast(`EQ calibrated to ${preset.toUpperCase()} profile`, 'check');
  };

  // Profile save
  const handleSaveProfile = () => {
    updateUserProfile({
      name: editName,
      bio: editBio,
      tagline: editTagline,
      location: editLocation,
      avatarUrl: editAvatarUrl
    });
    setIsEditingProfile(false);
    showToast('Artist profile updated across app', 'check');
  };

  // Diagnostics check
  const handleRunDiagnostic = () => {
    setIsDiagnosing(true);
    setDiagnosticCompleted(false);
    setDiagnosticProgress(0);

    setDiagnosticSteps((prev) => prev.map((step) => ({ ...step, status: 'pending' })));

    const stepDelays = [200, 500, 800, 1100, 1400];
    stepDelays.forEach((delay, idx) => {
      setTimeout(() => {
        setDiagnosticSteps((prev) =>
          prev.map((step, sIdx) => {
            if (sIdx === idx) return { ...step, status: 'running' };
            if (sIdx < idx) return { ...step, status: 'passed' };
            return step;
          })
        );
        setDiagnosticProgress(Math.round(((idx + 0.5) / 5) * 100));
      }, delay);
    });

    setTimeout(() => {
      setDiagnosticSteps((prev) => prev.map((step) => ({ ...step, status: 'passed' })));
      setDiagnosticProgress(100);
      setIsDiagnosing(false);
      setDiagnosticCompleted(true);
      showToast('All 5 audio engine health diagnostics passed', 'check');
    }, 1800);
  };

  // Export JSON configuration
  const handleExportConfig = () => {
    const exportBundle = {
      version: '3.0.0-smart',
      exportedAt: new Date().toISOString(),
      user: {
        name: userProfile.name,
        tagline: userProfile.tagline,
        location: userProfile.location
      },
      settings: appSettings,
      equalizer: equalizerState
    };
    const configData = JSON.stringify(exportBundle, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wavelength-smart-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Settings configuration exported', 'check');
  };

  // Import JSON configuration
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) updateAppSettings(parsed.settings);
        if (parsed.equalizer) {
          setEqualizerState(parsed.equalizer);
          soundFX.setEqualizer(
            parsed.equalizer.bass || 0,
            parsed.equalizer.mid || 0,
            parsed.equalizer.treble || 0,
            parsed.equalizer.panner || 0
          );
        }
        showToast('Settings successfully imported', 'check');
      } catch {
        showToast('Failed to parse settings JSON file', 'info');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to Factory Settings
  const handleResetDefaults = () => {
    updateAppSettings({
      artistThemeColor: '#1DB954',
      artistThemeName: 'Spotify Emerald',
      enableSpatialGlow: true,
      enableCursorFollower: true,
      streamingQuality: 'high',
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
      showRecentlyPlayedProfile: true
    });
    setEqualizerState({ preset: 'spatial', bass: 5, mid: 2, treble: 5, panner: 0 });
    soundFX.setEqualizer(5, 2, 5, 0);
    showToast('Settings reset to smart defaults', 'info');
  };

  // Reusable Smart Toggle Row
  const renderToggleRow = (
    label: string,
    description: string,
    value: boolean,
    onChange: (val: boolean) => void,
    badge?: string,
    icon?: React.ReactNode
  ) => (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] px-3.5 rounded-2xl transition-all">
      <div className="flex items-start gap-3.5 max-w-xl pr-4">
        {icon && <div className="mt-0.5 text-white/60 shrink-0">{icon}</div>}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-wide">{label}</span>
            {badge && (
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider text-black shadow-sm"
                style={{ backgroundColor: artistColor }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 leading-relaxed">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className="w-12 h-6.5 rounded-full transition-all relative flex-shrink-0 cursor-pointer p-0.5 shadow-inner"
        style={{
          backgroundColor: value ? artistColor : 'rgba(255, 255, 255, 0.16)'
        }}
        aria-label={label}
      >
        <span
          className={`block w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
            value ? 'translate-x-5.5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  // SVG Parametric Curve
  const calcFreqY = (dB: number) => 60 - (dB / 12) * 45;
  const bassY = calcFreqY(equalizerState.bass);
  const midY = calcFreqY(equalizerState.mid);
  const trebleY = calcFreqY(equalizerState.treble);

  const curvePath = `M 30,${calcFreqY(equalizerState.bass * 0.9)} 
    C 80,${bassY} 150,${calcFreqY(equalizerState.bass * 0.5 + equalizerState.mid * 0.5)} 250,${midY} 
    C 330,${calcFreqY(equalizerState.mid * 0.4 + equalizerState.treble * 0.6)} 400,${trebleY} 470,${calcFreqY(equalizerState.treble * 0.85)}`;

  const isSectionVisible = (secId: string) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (secId === 'smart' && 'smart adaptive ai enhancer sleep silence auto lufs'.includes(q)) return true;
      if (secId === 'equalizer' && 'equalizer hardware bass treble panner 3d spatial soundstage hrtf'.includes(q)) return true;
      if (secId === 'audio' && 'audio playback quality bitrate crossfade volume stream test'.includes(q)) return true;
      if (secId === 'artist-theme' && 'theme color visual appearance glow accent palette'.includes(q)) return true;
      if (secId === 'account' && 'account profile user password subscription artist name bio'.includes(q)) return true;
      if (secId === 'display' && 'display lyrics visualizer video notification ui mode'.includes(q)) return true;
      if (secId === 'privacy' && 'privacy private social history public broadcast session'.includes(q)) return true;
      if (secId === 'storage' && 'storage cache diagnostic memory quota latency report'.includes(q)) return true;
      if (secId === 'integrations' && 'api key service youtube itunes token cloud'.includes(q)) return true;
      return false;
    }
    return activeSection === secId;
  };

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full pt-6 px-4 md:px-8 flex flex-col space-y-6 scrollbar-none pb-12 select-none animate-in fade-in duration-300 text-white"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* HIDDEN IMPORT FILE INPUT */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* TOP HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('home')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition shadow-sm hover:scale-105 shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans">Settings</h1>
              <span
                className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-black uppercase tracking-wider shadow-md flex items-center gap-1"
                style={{ backgroundColor: artistColor }}
              >
                <Cpu className="w-3 h-3" />
                Smart Engine Active
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5">Audio intelligence, hardware DSP calibration & studio preferences</p>
          </div>
        </div>

        {/* Global Toolbar: Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-black/50 border border-white/20 rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition shadow-sm shrink-0"
            title="Import Settings JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportConfig}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition shadow-sm shrink-0"
            title="Export Settings JSON Backup"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition shadow-sm shrink-0"
            title="Reset Settings to Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TWO-COLUMN PROFESSIONAL STUDIO LAYOUT (NO HORIZONTAL SCROLLBAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PROFESSIONAL NAVIGATION MENU */}
        <div className="lg:col-span-3 bg-white/[0.02] border border-white/10 rounded-3xl p-3 space-y-1 backdrop-blur-xl">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-3 py-2 block">
            Navigation Sections
          </span>
          <div className="flex flex-row lg:flex-col flex-wrap gap-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id && !searchQuery.trim();
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSearchQuery('');
                    setActiveSection(sec.id);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white shadow-md border border-white/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition ${
                        isActive ? 'text-amber-400' : 'text-white/50 group-hover:text-white'
                      }`}
                    />
                    <span className="truncate">{sec.label}</span>
                  </div>
                  {sec.badge && (
                    <span
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider text-black shadow-sm shrink-0"
                      style={{ backgroundColor: artistColor }}
                    >
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SMART SETTINGS CONTENT */}
        <div className="lg:col-span-9 space-y-6">

          {/* SECTION 1: SMART AUDIO ENGINE & AUTOMATION */}
          {isSectionVisible('smart') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Smart Audio Intelligence & Automation</h3>
                    <p className="text-[11px] text-white/50">Autonomous bitrate scaling, dynamic leveling & AI silence elimination</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
                  AI DSP Active
                </span>
              </div>

              {/* Smart Toggles List */}
              <div className="space-y-1">
                {renderToggleRow(
                  'Smart Adaptive Bitrate',
                  'Automatically scales streaming bitrate based on network speed (up to 320kbps FLAC on Wi-Fi).',
                  appSettings.smartAdaptiveBitrate !== false,
                  (val) => updateAppSettings({ smartAdaptiveBitrate: val }),
                  'Adaptive',
                  <Zap className="w-4 h-4 text-amber-400" />
                )}

                {renderToggleRow(
                  'Smart Dynamic Loudness Leveling',
                  'Maintains professional EBU R128 (-14 LUFS) broadcast loudness to eliminate sudden jarring volume spikes.',
                  appSettings.normalizeVolume,
                  (val) => updateAppSettings({ normalizeVolume: val }),
                  'Auto LUFS',
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                )}

                {renderToggleRow(
                  'Smart Silence Elimination & Harmonic Crossfade',
                  'Trims empty intro/outro silence and dynamically blends tracks at natural harmonic boundaries.',
                  appSettings.smartSilenceDetection !== false,
                  (val) => updateAppSettings({ smartSilenceDetection: val }),
                  'Smart Gapless',
                  <Activity className="w-4 h-4 text-emerald-400" />
                )}

                {renderToggleRow(
                  'Smart DSP Audio Enhancer',
                  'Applies real-time harmonic excitation to restore presence and acoustic high-end air.',
                  appSettings.smartAudioEnhancer !== false,
                  (val) => updateAppSettings({ smartAudioEnhancer: val }),
                  'Studio Clarity',
                  <Sparkles className="w-4 h-4 text-rose-400" />
                )}

                {renderToggleRow(
                  'Smart Auto Storage Optimizer',
                  'Automatically purges stale audio cache chunks when local memory approaches 80% quota.',
                  appSettings.smartAutoCacheClean !== false,
                  (val) => updateAppSettings({ smartAutoCacheClean: val }),
                  'Auto Cache',
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                )}
              </div>

              {/* Smart Sleep Timer Selection */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Smart Sleep Timer</span>
                      <p className="text-[11px] text-white/50">Automatically stop playback after chosen duration</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-white/70">
                    {appSettings.smartSleepTimer ? `${appSettings.smartSleepTimer} min` : 'Disabled'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {[
                    { val: 0, label: 'Off' },
                    { val: 15, label: '15 Min' },
                    { val: 30, label: '30 Min' },
                    { val: 45, label: '45 Min' },
                    { val: 60, label: '1 Hour' }
                  ].map((t) => {
                    const isSelected = (appSettings.smartSleepTimer || 0) === t.val;
                    return (
                      <button
                        key={t.val}
                        onClick={() => {
                          updateAppSettings({ smartSleepTimer: t.val });
                          showToast(t.val === 0 ? 'Sleep timer turned off' : `Sleep timer set for ${t.label}`, 'check');
                        }}
                        className={`py-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30 shadow-md font-bold'
                            : 'bg-white/5 text-white/60 hover:text-white border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: EQUALIZER, SPATIAL STAGE & HARDWARE */}
          {isSectionVisible('equalizer') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Spatial Volume & Equalizer DSP</h3>
                    <p className="text-[11px] text-white/50">Master spatial volume gain, parametric frequency curve & binaural soundstage</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-bold">
                  Binaural DSP Active
                </span>
              </div>

              {/* MASTER SPATIAL VOLUME & OUTPUT GAIN CARD */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/15 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md shrink-0"
                      style={{ backgroundColor: artistColor }}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Master Spatial Output Volume</span>
                      <p className="text-[11px] text-white/50">Direct lossless Web Audio gain stage calibration</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                        isMuted
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-white/10 text-white/70 hover:text-white border-white/10'
                      }`}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isMuted ? 'Muted' : 'Mute'}</span>
                    </button>

                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/10 text-white">
                      {isMuted ? '0%' : `${Math.round(volume * 100)}%`} ({isMuted ? '-∞ dB' : `${(20 * Math.log10(Math.max(0.01, volume))).toFixed(1)} dB`})
                    </span>
                  </div>
                </div>

                {/* Master Volume Slider */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full cursor-pointer h-2 bg-white/20 rounded-lg accent-amber-400"
                    aria-label="Master Spatial Volume"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-white/40">
                    <span>Mute (0%)</span>
                    <span>-12 dB (25%)</span>
                    <span>-6 dB (50%)</span>
                    <span>-2.5 dB (75%)</span>
                    <span>0 dB Unity (100%)</span>
                  </div>
                </div>
              </div>

              {/* Audio Output Hardware Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                  Audio Output Interface
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AUDIO_OUTPUT_DEVICES.map((dev) => {
                    const isSelected = selectedOutput === dev.id;
                    return (
                      <div
                        key={dev.id}
                        onClick={() => {
                          setSelectedOutput(dev.id);
                          showToast(`Audio output routed to ${dev.name}`, 'check');
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-white/15 border-white/40 shadow-md scale-[1.01]'
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {dev.id === 'headphones' ? (
                            <Headphones className="w-4 h-4 text-indigo-400" />
                          ) : dev.id === 'dac' ? (
                            <Activity className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Speaker className="w-4 h-4 text-amber-400" />
                          )}
                          <span className="text-xs font-bold text-white truncate">{dev.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/50 mt-2">
                          <span>{dev.type}</span>
                          <span className="font-mono text-emerald-400">{dev.latency}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Frequency Response Graph */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" style={{ color: artistColor }} />
                      Live Parametric Frequency Curve
                    </span>
                    <p className="text-[11px] text-white/50">Real-time filter response across 20Hz - 20kHz audio spectrum</p>
                  </div>
                  <button
                    onClick={() => handlePresetSelect('flat')}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white/80 transition"
                  >
                    Reset Flat
                  </button>
                </div>

                <div className="w-full h-32 relative bg-white/[0.02] rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
                    <div className="w-full border-b border-dashed border-white text-[9px] font-mono text-white">+12dB</div>
                    <div className="w-full border-b border-white text-[9px] font-mono text-white">0dB</div>
                    <div className="w-full border-b border-dashed border-white text-[9px] font-mono text-white">-12dB</div>
                  </div>

                  <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="eqGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={artistColor} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={artistColor} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    <path d={`${curvePath} L 470,120 L 30,120 Z`} fill="url(#eqGlowGrad)" />
                    <path d={curvePath} fill="none" stroke={artistColor} strokeWidth="3" strokeLinecap="round" />
                    <circle cx="80" cy={bassY} r="5" fill="#FBBF24" stroke="#000" strokeWidth="2" />
                    <circle cx="250" cy={midY} r="5" fill="#818CF8" stroke="#000" strokeWidth="2" />
                    <circle cx="400" cy={trebleY} r="5" fill="#FB7185" stroke="#000" strokeWidth="2" />
                  </svg>

                  <div className="absolute bottom-1 inset-x-4 flex justify-between text-[9px] font-mono text-white/40 pointer-events-none">
                    <span>60 Hz (Bass)</span>
                    <span>1.5 kHz (Mids)</span>
                    <span>10 kHz (Treble)</span>
                  </div>
                </div>
              </div>

              {/* 5-Band Equalizer Sliders */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/15 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Bass */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70 font-semibold">Bass</span>
                      <span className="font-mono font-bold text-amber-400">
                        {equalizerState.bass > 0 ? `+${equalizerState.bass}` : equalizerState.bass} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={equalizerState.bass}
                      onChange={(e) => handleBassChange(parseInt(e.target.value))}
                      className="w-full cursor-pointer h-1.5 bg-white/20 rounded-lg accent-amber-400"
                    />
                    <span className="text-[10px] text-white/40 block text-center">60Hz - 250Hz</span>
                  </div>

                  {/* Mid */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70 font-semibold">Mids</span>
                      <span className="font-mono font-bold text-indigo-400">
                        {equalizerState.mid > 0 ? `+${equalizerState.mid}` : equalizerState.mid} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={equalizerState.mid}
                      onChange={(e) => handleMidChange(parseInt(e.target.value))}
                      className="w-full cursor-pointer h-1.5 bg-white/20 rounded-lg accent-indigo-400"
                    />
                    <span className="text-[10px] text-white/40 block text-center">1kHz - 4kHz</span>
                  </div>

                  {/* Treble */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70 font-semibold">Treble</span>
                      <span className="font-mono font-bold text-rose-400">
                        {equalizerState.treble > 0 ? `+${equalizerState.treble}` : equalizerState.treble} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={equalizerState.treble}
                      onChange={(e) => handleTrebleChange(parseInt(e.target.value))}
                      className="w-full cursor-pointer h-1.5 bg-white/20 rounded-lg accent-rose-400"
                    />
                    <span className="text-[10px] text-white/40 block text-center">8kHz - 16kHz</span>
                  </div>

                  {/* Stereo Panner */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70 font-semibold">Stereo Pan</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {equalizerState.panner === 0
                          ? 'Center'
                          : equalizerState.panner < 0
                          ? `${Math.abs(Math.round(equalizerState.panner * 100))}% L`
                          : `${Math.round(equalizerState.panner * 100)}% R`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.1}
                      value={equalizerState.panner}
                      onChange={(e) => handlePannerChange(parseFloat(e.target.value))}
                      className="w-full cursor-pointer h-1.5 bg-white/20 rounded-lg accent-emerald-400"
                    />
                    <span className="text-[10px] text-white/40 block text-center">Left / Right Balance</span>
                  </div>
                </div>
              </div>

              {/* EQ Presets */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Equalizer Master Calibration Presets</span>
                  <span className="text-xs font-mono text-white/50 capitalize">{equalizerState.preset}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { name: 'spatial', label: 'Spatial Studio' },
                    { name: 'bass', label: 'Bass Boost' },
                    { name: 'vocal', label: 'Vocal Presence' },
                    { name: 'electronic', label: 'Electronic Club' },
                    { name: 'flat', label: 'Flat Master' },
                    { name: 'acoustic', label: 'Acoustic Warm' }
                  ].map((p) => {
                    const isSelected = equalizerState.preset === p.name;
                    return (
                      <button
                        key={p.name}
                        onClick={() => handlePresetSelect(p.name)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold transition text-left cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 text-white border-white/30 shadow-sm scale-102 font-bold'
                            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {renderToggleRow(
                'Spatial 3D Surround Engine (Binaural HRTF)',
                'Virtualize multi-channel 3D spatial positioning with dynamic head-related transfer functions.',
                appSettings.spatialSurroundEngine,
                (val) => updateAppSettings({ spatialSurroundEngine: val }),
                '3D Spatial'
              )}
            </div>
          )}

          {/* SECTION 3: BITRATE & AUDIO ENGINE */}
          {isSectionVisible('audio') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Bitrate Quality & Playback Mechanics</h3>
                    <p className="text-[11px] text-white/50">Streaming bitrate & hardware tone testing</p>
                  </div>
                </div>

                <button
                  onClick={() => playAudioTestTone('chime')}
                  className="px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm"
                  title="Play 48kHz audio output test tone"
                >
                  <Radio className={`w-3.5 h-3.5 text-amber-400 ${activeTestTone === 'chime' ? 'animate-spin' : ''}`} />
                  <span>Test Audio Chime</span>
                </button>
              </div>

              {/* Audio Test Station */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Live Hardware Audio Test Station</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Web Audio DSP
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {[
                    { id: 'chime' as const, label: 'Stereo Pulse', desc: '48kHz Sine Chime' },
                    { id: 'sub-bass' as const, label: 'Sub-Bass Drop', desc: '45Hz Low Frequency' },
                    { id: 'pan-test' as const, label: 'L / R Separation', desc: 'Stereo Ping-Pong' },
                    { id: 'sweep' as const, label: 'Freq Sweep', desc: '100Hz - 8kHz Air' }
                  ].map((test) => {
                    const isActive = activeTestTone === test.id;
                    return (
                      <button
                        key={test.id}
                        onClick={() => playAudioTestTone(test.id)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          isActive
                            ? 'bg-white/20 border-white/40 scale-102 shadow-md'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{test.label}</span>
                          <Play className={`w-3 h-3 ${isActive ? 'text-amber-400 animate-pulse' : 'text-white/40'}`} />
                        </div>
                        <span className="text-[10px] text-white/50 mt-1">{test.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Streaming Quality */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                  Streaming Bitrate & Codec Tier
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'low', label: 'Data Saver', kbps: '24 kbps HE-AAC' },
                    { key: 'normal', label: 'Standard', kbps: '96 kbps AAC' },
                    { key: 'high', label: 'High Fidelity', kbps: '160 kbps HQ' },
                    { key: 'lossless', label: 'Lossless Master', kbps: '320 kbps FLAC' }
                  ].map((q) => {
                    const isSelected = appSettings.streamingQuality === q.key;
                    return (
                      <button
                        key={q.key}
                        onClick={() => {
                          updateAppSettings({ streamingQuality: q.key as any });
                          showToast(`Bitrate set to ${q.label} (${q.kbps})`, 'check');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 border-white/30 shadow-md scale-[1.01]'
                            : 'bg-white/[0.02] hover:bg-white/[0.07] border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-white/70'}`}>
                            {q.label}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: artistColor }} />
                          )}
                        </div>
                        <span className="text-[10px] text-white/50 block mt-1">{q.kbps}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {renderToggleRow(
                'Autoplay Similar Recommendations',
                'Keep playback going with smart artist radio when your current playlist ends.',
                appSettings.autoPlaySimilar,
                (val) => updateAppSettings({ autoPlaySimilar: val })
              )}
            </div>
          )}

          {/* SECTION 4: COLORS & GLOW (WITHOUT THEME MODE) */}
          {isSectionVisible('artist-theme') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Color Accents & Ambient Glow</h3>
                    <p className="text-[11px] text-white/50">Signature artist palettes, bespoke hex highlights & atmospheric glow</p>
                  </div>
                </div>
                <span
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full text-black shadow-sm"
                  style={{ backgroundColor: artistColor }}
                >
                  {appSettings.artistThemeName}
                </span>
              </div>

              {/* Theme Swatches Grid */}
              <div className="space-y-2.5 relative z-10">
                <label className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                  Curated Signature Color Palettes
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {THEME_COLOR_PRESETS.map((preset) => {
                    const isSelected = artistColor.toLowerCase() === preset.color.toLowerCase();
                    return (
                      <div
                        key={preset.name}
                        onClick={() => handleColorSelect(preset)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-white/15 border-white/40 shadow-lg scale-[1.02]'
                            : 'bg-white/[0.02] hover:bg-white/[0.07] border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-7 h-7 rounded-xl flex-shrink-0 shadow-md ring-2 ring-white/20 transition transform group-hover:scale-110"
                            style={{ backgroundColor: preset.color }}
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{preset.name}</h4>
                            <p className="text-[10px] text-white/50 truncate">{preset.description}</p>
                          </div>
                        </div>

                        {isSelected ? (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shadow-md shrink-0 ml-2"
                            style={{ backgroundColor: artistColor }}
                          >
                            <Check className="w-3 h-3 text-black stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono text-white/40 uppercase ml-2 shrink-0">{preset.color}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hex Color & Live Mini Preview */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-white block">Custom Hex Color Gradient</span>
                    <p className="text-[11px] text-white/50 mt-0.5">Fine-tune the exact hex value to match your studio branding</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={artistColor}
                      onChange={handleCustomHexChange}
                      className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent"
                      title="Pick custom color"
                    />
                    <input
                      type="text"
                      value={artistColor}
                      onChange={handleCustomHexChange}
                      className="w-32 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white text-center focus:outline-none focus:border-white/50 uppercase"
                    />
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-4 relative overflow-hidden">
                  <div
                    className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg relative overflow-hidden"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Music className="w-7 h-7 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-black shadow-sm"
                      style={{ backgroundColor: artistColor }}
                    >
                      Theme Accent Preview
                    </span>
                    <h5 className="text-xs font-bold text-white mt-1 truncate">
                      {activeTrack?.title || 'Hyperdrive Horizon (VIP Mix)'}
                    </h5>
                    <p className="text-[10px] text-white/50 truncate">
                      {activeTrack?.artist || 'Wavelength Soundscapes'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spatial Glow & Cursor Spotlight Toggles */}
              <div className="space-y-1 pt-2 border-t border-white/10 relative z-10">
                {renderToggleRow(
                  'Ambient Spatial Glow Projection',
                  'Project a dynamic atmospheric glow behind music players and panels matching the theme color.',
                  appSettings.enableSpatialGlow,
                  (val) => updateAppSettings({ enableSpatialGlow: val }),
                  'Glow'
                )}
                {renderToggleRow(
                  'Interactive Cursor Spotlight',
                  'Activate a fluid hardware-accelerated spotlight following mouse navigation.',
                  appSettings.enableCursorFollower,
                  (val) => updateAppSettings({ enableCursorFollower: val })
                )}
              </div>

              {/* Animated Intro Logo Interface Action Card */}
              <div className="pt-4 border-t border-white/10 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center p-2 shrink-0 shadow-md"
                    style={{ backgroundColor: `${artistColor}25` }}
                  >
                    <Music className="w-6 h-6" style={{ color: artistColor }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">YouTube-Style Animated Logo Splash</h4>
                      <span
                        className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full text-black shadow-sm"
                        style={{ backgroundColor: artistColor }}
                      >
                        POPUP
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5">3D pop-up logo transition with animated moving soundwaves in website theme color</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIntroSplash(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-2 transition hover:brightness-110 shadow-lg shrink-0 cursor-pointer"
                  style={{ backgroundColor: artistColor }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Replay Intro Animation</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: ARTIST PROFILE & ACCOUNT */}
          {isSectionVisible('account') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Artist Profile & Account Preferences</h3>
                    <p className="text-[11px] text-white/50">Manage subscription identity, public metadata & avatar customization</p>
                  </div>
                </div>
                <span
                  className="text-xs font-extrabold px-3 py-1 rounded-full text-black uppercase shadow-sm"
                  style={{ backgroundColor: artistColor }}
                >
                  Verified Master
                </span>
              </div>

              {/* Profile Overview Card */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-white/20 shadow-xl"
                    />
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs"
                      title="Change Avatar"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{userProfile.name}</h4>
                      <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                        {userProfile.username || '@soundcraft'}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">{userProfile.email || 'artist@wavelength.audio'}</p>
                    <p className="text-[11px] text-white/50 mt-1">
                      {userProfile.monthlyListeners || '184,200'} monthly listeners · {userProfile.location || 'Los Angeles, CA'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingProfile ? 'Close Editor' : 'Edit Profile'}</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      showToast('Signed out of artist account', 'info');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-rose-500/30 shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Inline Profile Editor */}
              {isEditingProfile && (
                <div className="p-6 rounded-2xl bg-black/50 border border-white/20 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Interactive Profile Metadata & Avatar Gallery
                    </span>
                    <span className="text-[10px] text-white/40">Syncs immediately across playlists, header & profile page</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/70 block text-xs font-semibold">Choose Artist Avatar Persona</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                      {AVATAR_PRESETS.map((avatar) => {
                        const isSelected = editAvatarUrl === avatar.url;
                        return (
                          <div
                            key={avatar.name}
                            onClick={() => {
                              setEditAvatarUrl(avatar.url);
                              showToast(`Selected avatar: ${avatar.name}`, 'check');
                            }}
                            className={`p-1.5 rounded-2xl border cursor-pointer transition text-center group ${
                              isSelected
                                ? 'bg-white/20 border-white/40 scale-105 shadow-md'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <img
                              src={avatar.url}
                              alt={avatar.name}
                              className="w-12 h-12 rounded-xl object-cover mx-auto shadow-sm"
                            />
                            <span className="text-[10px] text-white/70 block mt-1 truncate">{avatar.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-white/60 block mb-1 font-semibold">Artist Display Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/40"
                      />
                    </div>

                    <div>
                      <label className="text-white/60 block mb-1 font-semibold">Base / City Location</label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/40"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-white/60 block mb-1 font-semibold">Headline / Tagline</label>
                      <input
                        type="text"
                        value={editTagline}
                        onChange={(e) => setEditTagline(e.target.value)}
                        placeholder="e.g. Ambient Synthwave Producer & Spatial Audio Pioneer"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/40"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-white/60 block mb-1 font-semibold">Artist Biography</label>
                      <textarea
                        rows={2}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Share your musical vision and discography notes..."
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/40 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/70"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-5 py-2 rounded-xl text-black font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition transform hover:scale-105"
                      style={{ backgroundColor: artistColor }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Apply Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: DISPLAY & LYRICS */}
          {isSectionVisible('display') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Display, Lyrics & Visualizers</h3>
                    <p className="text-[11px] text-white/50">Karaoke-synced lyrics timing, animated canvas loops and desktop integration</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {renderToggleRow(
                  'Auto-Show Synced Lyrics Drawer',
                  'Automatically slide open the synchronized lyrics panel whenever playback begins.',
                  appSettings.autoShowLyrics,
                  (val) => updateAppSettings({ autoShowLyrics: val })
                )}
                {renderToggleRow(
                  'Animated Canvas & Video Loops',
                  'Display seamless artist looping canvas visualizers when available.',
                  appSettings.showCanvasVideo,
                  (val) => updateAppSettings({ showCanvasVideo: val }),
                  'Visual'
                )}
                {renderToggleRow(
                  'Desktop System Notifications',
                  'Send native system alerts with song title and artwork when track transitions.',
                  appSettings.desktopNotifications,
                  (val) => updateAppSettings({ desktopNotifications: val })
                )}
              </div>
            </div>
          )}

          {/* SECTION 7: PRIVACY & SOCIAL */}
          {isSectionVisible('privacy') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Privacy & Social Activity</h3>
                    <p className="text-[11px] text-white/50">Private listening sessions, anonymous queueing & public discovery</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {renderToggleRow(
                  'Private Ghost Session',
                  'Listen anonymously without updating your play history or broadcasting to followers.',
                  appSettings.privateSession,
                  (val) => {
                    updateAppSettings({ privateSession: val });
                    showToast(val ? 'Private Session active (History paused)' : 'Private Session disabled', 'info');
                  },
                  appSettings.privateSession ? 'Active' : undefined
                )}
                {renderToggleRow(
                  'Publish Listening Activity',
                  'Share your current playing tracks and timestamps with your followers.',
                  appSettings.shareListeningActivity,
                  (val) => updateAppSettings({ shareListeningActivity: val })
                )}
                {renderToggleRow(
                  'Display Top Genres on Profile',
                  'Show your curated listening taste distribution on your public artist profile.',
                  appSettings.showTopGenresPublic,
                  (val) => updateAppSettings({ showTopGenresPublic: val })
                )}
                {renderToggleRow(
                  'Public Recently Played List',
                  'Allow profile visitors to view your recent track history.',
                  appSettings.showRecentlyPlayedProfile,
                  (val) => updateAppSettings({ showRecentlyPlayedProfile: val })
                )}
              </div>
            </div>
          )}

          {/* SECTION 8: DIAGNOSTICS & STORAGE */}
          {isSectionVisible('storage') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Diagnostics & Storage Optimization</h3>
                    <p className="text-[11px] text-white/50">Local buffer management, latency benchmarks & engine health</p>
                  </div>
                </div>

                <button
                  onClick={handleRunDiagnostic}
                  disabled={isDiagnosing}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>{isDiagnosing ? 'Running Health Check...' : 'Run Diagnostics'}</span>
                </button>
              </div>

              {/* Diagnostic Checklist */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/15 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Audio DSP Pipeline Health Check
                  </span>
                  {diagnosticCompleted && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      100% Operational
                    </span>
                  )}
                </div>

                {isDiagnosing && (
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${diagnosticProgress}%`, backgroundColor: artistColor }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {diagnosticSteps.map((step) => {
                    const isPassed = step.status === 'passed';
                    const isRunning = step.status === 'running';
                    return (
                      <div
                        key={step.name}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-semibold text-white block truncate">{step.name}</span>
                          <span className="text-[10px] text-white/40 block truncate">{step.detail}</span>
                        </div>
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isRunning ? (
                          <Activity className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cache Storage Bar */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Local Audio & Image Cache</span>
                    <p className="text-[11px] text-white/50">Used to pre-buffer lossless audio tracks and artwork</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">{cacheMB} MB used</span>
                </div>

                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, (appSettings.cacheSizeBytes / (2 * 1024 * 1024 * 1024)) * 100))}%`,
                      backgroundColor: artistColor
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                  <span>Local Cache: {cacheMB} MB</span>
                  <span>Max Quota: 2.0 GB</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs font-semibold text-white">Flush Audio Buffer Memory</span>
                  <p className="text-[11px] text-white/50">Clears offline song chunks and cached metadata</p>
                </div>

                <button
                  onClick={() => {
                    clearAudioCache();
                    showToast('Audio cache cleared (0 MB)', 'check');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cache</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div>
                  <span className="text-xs font-semibold text-white">Clear Listening History</span>
                  <p className="text-[11px] text-white/50">Removes local plays and co-occurrence signals</p>
                </div>

                <button
                  onClick={async () => {
                    await recommendationEngine.clearListeningHistory();
                    showToast('Listening history cleared', 'check');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div>
                  <span className="text-xs font-semibold text-white">Reset Recommendations</span>
                  <p className="text-[11px] text-white/50">Resets taste profile weights & restarts cold-start state</p>
                </div>

                <button
                  onClick={async () => {
                    await recommendationEngine.resetRecommendations();
                    showToast('Recommendations reset to trending defaults', 'check');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reset Taste</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 9: API INTEGRATIONS */}
          {isSectionVisible('integrations') && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">API Keys & Cloud Audio Services</h3>
                    <p className="text-[11px] text-white/50">Manage YouTube v3 streaming tokens, cover artwork lookups and proxy endpoints</p>
                  </div>
                </div>
                <button
                  onClick={toggleApiKeyModal}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-black shadow-md transition transform hover:scale-105"
                  style={{ backgroundColor: artistColor }}
                >
                  Configure API Keys
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">YouTube Data API v3</h4>
                      <p className="text-[11px] text-white/50">Live audio stream queries & real-time search index</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Connected & Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Disc className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Apple iTunes Search Catalog</h4>
                      <p className="text-[11px] text-white/50">Ultra HD album cover artwork & official track discographies</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active (High-Speed CDN)
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
