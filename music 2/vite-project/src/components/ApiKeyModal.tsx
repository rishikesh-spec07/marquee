import React, { useState } from 'react';
import { X, Key, CheckCircle, RefreshCw } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { apiKeyManager } from '../services/apiKeyManager';

export const ApiKeyModal: React.FC = () => {
  const { showApiKeyModal, toggleApiKeyModal, showToast } = useMusicStore();
  const [tmdbKey, setTmdbKey] = useState(apiKeyManager.getTMDBKey());
  const [ytKey, setYtKey] = useState(apiKeyManager.getYouTubeKey());
  const [isOffline, setIsOffline] = useState(apiKeyManager.isOfflineMode());
  const [isTestingTmdb, setIsTestingTmdb] = useState(false);
  const [isTestingYt, setIsTestingYt] = useState(false);

  if (!showApiKeyModal) return null;

  const handleTestTmdb = async () => {
    setIsTestingTmdb(true);
    const res = await apiKeyManager.testTMDBKey(tmdbKey);
    setIsTestingTmdb(false);
    showToast(res.message, res.success ? 'check-circle' : 'alert-triangle');
  };

  const handleTestYt = async () => {
    setIsTestingYt(true);
    const res = await apiKeyManager.testYouTubeKey(ytKey);
    setIsTestingYt(false);
    showToast(res.message, res.success ? 'check-circle' : 'alert-triangle');
  };

  const handleSave = () => {
    apiKeyManager.setTMDBKey(tmdbKey);
    apiKeyManager.setYouTubeKey(ytKey);
    apiKeyManager.setOfflineMode(isOffline);
    showToast('API Key & Engine Settings Saved!', 'check-circle');
    toggleApiKeyModal();
  };

  const handleReset = () => {
    apiKeyManager.resetToDefaults();
    setTmdbKey(apiKeyManager.getTMDBKey());
    setYtKey(apiKeyManager.getYouTubeKey());
    setIsOffline(false);
    showToast('Reset API Keys to Default Values', 'refresh-cw');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-black/85 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 w-[90vw] max-w-[480px] text-white shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold">API Key & Engine Settings</h3>
          </div>
          <button
            onClick={toggleApiKeyModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Offline Mode Switch */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
            <div>
              <h4 className="font-semibold text-xs text-white">Offline High-Quality Mock Mode</h4>
              <p className="text-[10px] text-white/50">Run completely offline without using external API quotas</p>
            </div>
            <input
              type="checkbox"
              checked={isOffline}
              onChange={(e) => setIsOffline(e.target.checked)}
              className="w-4 h-4 accent-indigo-400 cursor-pointer"
            />
          </div>

          {/* TMDB API Key */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white/90">TMDB API Key (Movies & TV)</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                {localStorage.getItem('visionos_tmdb_key') ? 'Custom Saved Key' : 'Default Active Key'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tmdbKey}
                onChange={(e) => setTmdbKey(e.target.value)}
                placeholder="Enter TMDB API Key..."
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
              />
              <button
                onClick={handleTestTmdb}
                disabled={isTestingTmdb}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
              >
                {isTestingTmdb ? 'Testing...' : 'Test Key'}
              </button>
            </div>
          </div>

          {/* YouTube API Key */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white/90">YouTube Data API Key</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                {localStorage.getItem('visionos_yt_key') ? 'Custom Saved Key' : 'Default (Audio Engine Active)'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={ytKey}
                onChange={(e) => setYtKey(e.target.value)}
                placeholder="Enter YouTube API Key..."
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
              />
              <button
                onClick={handleTestYt}
                disabled={isTestingYt}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
              >
                {isTestingYt ? 'Testing...' : 'Test Key'}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition text-xs flex items-center gap-1.5 shadow-lg"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Save API Settings
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl transition text-xs font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
