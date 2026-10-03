import React, { useState, useEffect } from 'react';
import { X, Plus, Play, Trash2, Heart, Music, Check, FolderPlus, Download, ListPlus } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { playlistStorage, type LocalPlaylist } from '../services/playlistStorage';
import type { Song } from '../types';

export const PlaylistsModal: React.FC = () => {
  const {
    showPlaylistsModal,
    togglePlaylistsModal,
    activeTrack,
    favoriteSongs,
    showToast,
    playSong
  } = useMusicStore();

  const [playlists, setPlaylists] = useState<LocalPlaylist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [showImportInput, setShowImportInput] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (showPlaylistsModal) {
      loadPlaylists();
      setAddedMap({});
    }
  }, [showPlaylistsModal]);

  const loadPlaylists = async () => {
    const list = await playlistStorage.getAllPlaylists();
    setPlaylists(list);
  };

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    const pl = await playlistStorage.createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateInput(false);
    showToast(`Created playlist "${pl.name}"`, 'check');
    await loadPlaylists();

    // If activeTrack was set, add it automatically
    if (activeTrack) {
      await handleAddToPlaylist(pl.id, activeTrack);
    }
  };

  const handleAddToPlaylist = async (playlistId: string, song: Song) => {
    const success = await playlistStorage.addSongToPlaylist(playlistId, song);
    if (success) {
      setAddedMap((prev) => ({ ...prev, [playlistId]: true }));
      showToast(`Added "${song.title}" to playlist`, 'check');
      loadPlaylists();
    } else {
      showToast('Track is already in this playlist', 'info');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    await playlistStorage.deletePlaylist(id);
    showToast(`Deleted playlist "${name}"`, 'trash');
    loadPlaylists();
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setIsImporting(true);
    const pl = await playlistStorage.importPublicYouTubePlaylist(importUrl.trim());
    setIsImporting(false);
    if (pl) {
      setImportUrl('');
      setShowImportInput(false);
      showToast(`Imported ${pl.songs.length} tracks into "${pl.name}"`, 'check');
      loadPlaylists();
    } else {
      showToast('Failed to import YouTube playlist. Verify URL or ID.', 'alert');
    }
  };

  const handlePlayPlaylist = (playlist: LocalPlaylist) => {
    if (playlist.songs.length === 0) {
      showToast('Playlist is empty', 'info');
      return;
    }
    // Enqueue playlist and play first track
    useMusicStore.setState({
      manualQueue: playlist.songs.slice(1)
    });
    playSong(playlist.songs[0]);
    togglePlaylistsModal();
  };

  if (!showPlaylistsModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={togglePlaylistsModal}
    >
      <div
        className="w-full max-w-xl bg-[#12131a]/95 border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {activeTrack ? `Add to Playlist` : `Your Playlists`}
              </h3>
              <p className="text-[11px] text-white/50">
                {activeTrack ? `Select a playlist for "${activeTrack.title}"` : `${playlists.length} playlists stored offline`}
              </p>
            </div>
          </div>

          <button
            onClick={togglePlaylistsModal}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (New Playlist / Import) */}
        <div className="p-3 px-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
          <button
            onClick={() => {
              setShowCreateInput(true);
              setShowImportInput(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold transition flex items-center gap-1.5 hover:bg-white/90 active:scale-95 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Playlist</span>
          </button>

          <button
            onClick={() => {
              setShowImportInput(true);
              setShowCreateInput(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Import YouTube Playlist</span>
          </button>
        </div>

        {/* Inputs Dropdown */}
        {showCreateInput && (
          <div className="p-3 bg-white/[0.04] border-b border-white/10 flex items-center gap-2 animate-in slide-in-from-top-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateInput(false)}
              className="p-1.5 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {showImportInput && (
          <div className="p-3 bg-white/[0.04] border-b border-white/10 flex items-center gap-2 animate-in slide-in-from-top-2">
            <input
              type="text"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Paste YouTube playlist URL or ID..."
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            />
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-3 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-400 disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
            <button
              onClick={() => setShowImportInput(false)}
              className="p-1.5 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Playlist List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {/* Liked Songs Special Row */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-950/30 to-purple-950/20 border border-rose-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Liked Songs</span>
                <span className="text-xs text-white/50">{favoriteSongs.size} tracks saved</span>
              </div>
            </div>

            <span className="text-xs font-semibold text-rose-300">Auto-Synced</span>
          </div>

          {/* User Playlists */}
          {playlists.map((pl) => {
            const hasActiveSong = activeTrack && pl.songs.some((s) => (s.canonicalTrackId || s.id) === (activeTrack.canonicalTrackId || activeTrack.id));
            const isAdded = addedMap[pl.id];

            return (
              <div
                key={pl.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition group"
              >
                <div
                  onClick={() => !activeTrack && handlePlayPlaylist(pl)}
                  className={`flex items-center gap-3 min-w-0 flex-1 ${!activeTrack ? 'cursor-pointer' : ''}`}
                >
                  {pl.coverArt ? (
                    <img
                      src={pl.coverArt}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/40 shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-bold text-white group-hover:text-amber-300 truncate leading-tight">
                      {pl.name}
                    </span>
                    <span className="text-xs text-white/50 truncate mt-0.5">
                      {pl.songs.length} tracks
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {/* If opened to add activeTrack */}
                  {activeTrack ? (
                    <button
                      onClick={() => handleAddToPlaylist(pl.id, activeTrack)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        hasActiveSong || isAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white text-black hover:bg-white/90 shadow-md'
                      }`}
                    >
                      {hasActiveSong || isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ListPlus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePlayPlaylist(pl)}
                        className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition"
                        title="Play Playlist"
                      >
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(pl.id, pl.name)}
                        className="p-2 text-white/30 hover:text-rose-400 transition"
                        title="Delete Playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {playlists.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center text-white/40">
              <FolderPlus className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm font-bold text-white/70">No custom playlists yet</p>
              <p className="text-xs text-white/40 mt-0.5">
                Click "New Playlist" or import one from YouTube to get started.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-white/40">
          <span>Playlists continue into Song Radio when completed</span>
          <button
            onClick={togglePlaylistsModal}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
