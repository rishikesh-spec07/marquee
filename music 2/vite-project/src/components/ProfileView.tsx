import React, { useState, useRef } from 'react';
import { AuthCard } from './AuthCard';
import {
  Play,
  Pause,
  Heart,
  Plus,
  Edit3,
  Camera,
  Check,
  ChevronRight,
  MoreHorizontal,
  Music,
  Trash2,
  X,
  Settings,
  ArrowLeft,
  Search,
  ListPlus,
  LayoutGrid,
  Disc,
  Film,
  ListMusic,
  Sliders
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import type { Song } from '../types';

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    isAuthenticated,
    favoriteSongs,
    songsCatalog,
    playSong,
    activeTrack,
    isPlayingAudio,
    togglePlay,
    playlists,
    addPlaylist,
    removePlaylist,
    editPlaylist,
    removeSongFromPlaylist,
    clearFavoriteSongs,
    setActiveView,
    showToast,
    appSettings
  } = useMusicStore();

  // Profile Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editBio, setEditBio] = useState(userProfile.bio || userProfile.tagline || '');
  const [editLocation, setEditLocation] = useState(userProfile.location || 'Los Angeles, CA');
  const [editListeners, setEditListeners] = useState(userProfile.monthlyListeners || '62,140');
  const [genresList, setGenresList] = useState<string[]>(
    userProfile.genres && userProfile.genres.length > 0
      ? userProfile.genres
      : ['Synth-pop', 'Dream pop', 'Downtempo', 'Chillwave']
  );
  const [newGenreInput, setNewGenreInput] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const artistColor = appSettings?.artistThemeColor || '#1DB954';

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'overview' | 'create-playlist' | 'edit-playlist' | 'liked-songs'>('overview');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  
  // Create Playlist State
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Default Preset Playlists based on Reference Image 2
  const presetPlaylists = [
    {
      id: 'preset-pl-1',
      name: 'Night Drive',
      tracksCount: '24 tracks',
      gradient: 'from-[#C3AB74] via-[#8C7B53] to-[#363539]'
    },
    {
      id: 'preset-pl-2',
      name: 'Studio Sessions',
      tracksCount: '11 tracks',
      gradient: 'from-[#4A5D6E] via-[#354654] to-[#1F2730]'
    }
  ];

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        if (resultUrl) {
          setAvatarUrl(resultUrl);
          updateUserProfile({ avatarUrl: resultUrl });
          showToast('Profile photo updated', 'check');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateUserProfile({
      name: editName.trim() || userProfile.name,
      bio: editBio.trim(),
      tagline: editBio.trim(),
      location: editLocation.trim(),
      monthlyListeners: editListeners.trim(),
      genres: genresList,
      avatarUrl
    });
    setIsEditing(false);
    showToast('Profile changes saved successfully', 'check');
  };

  const handleDiscardChanges = () => {
    setEditName(userProfile.name);
    setEditBio(userProfile.bio || userProfile.tagline || '');
    setEditLocation(userProfile.location || 'Los Angeles, CA');
    setEditListeners(userProfile.monthlyListeners || '62,140');
    setGenresList(userProfile.genres || ['Synth-pop', 'Dream pop', 'Downtempo', 'Chillwave']);
    setAvatarUrl(userProfile.avatarUrl);
    setIsEditing(false);
  };

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      addPlaylist(newPlaylistName.trim());
      showToast(`Created playlist "${newPlaylistName.trim()}"`, 'check');
      setNewPlaylistName('');
      setActiveTab('overview');
    }
  };

  const handleAddGenre = () => {
    if (newGenreInput.trim() && !genresList.includes(newGenreInput.trim())) {
      setGenresList([...genresList, newGenreInput.trim()]);
      setNewGenreInput('');
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setGenresList(genresList.filter((g) => g !== genreToRemove));
  };

  // UNAUTHENTICATED PROFILE -> CENTERED AUTH CARD
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center pt-8 p-4 md:p-8 relative overflow-y-auto select-none animate-in fade-in duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#FF5D36]/20 via-purple-600/15 to-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <AuthCard initialMode="signup" />
      </div>
    );
  }

  const activePlaylist = playlists.find(p => p.id === editingPlaylistId);

  // AUTHENTICATED PROFILE VIEW
  return (
    <div className="flex-1 overflow-y-auto pt-6 px-6 pr-4 flex flex-col space-y-8 custom-scrollbar pb-32 select-none animate-in fade-in duration-300 relative text-white">
      {/* Hidden File Input for Avatar Upload */}
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      {/* TOP HEADER BAR WITH EDIT PROFILE & SETTINGS BUTTON */}
      <div className="flex items-center justify-between pt-2 pb-1 px-1">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveView('home')}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer shadow-sm"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-full text-black flex items-center justify-center shadow-md" style={{ backgroundColor: artistColor }}>
              <Play className="w-3 h-3 fill-black ml-0.5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white font-sans cursor-pointer hover:opacity-90 transition" onClick={() => setActiveView('home')}>Wavelength</span>
          </div>
          
          {/* Custom Tabs */}
          <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full p-1 ml-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${activeTab === 'overview' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('create-playlist')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'create-playlist' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              <Plus className="w-3.5 h-3.5" /> Create Playlist
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('settings')}
            className="px-3.5 py-1.5 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md"
            title="Open Spotify Artist Settings & Theme"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          {activeTab === 'overview' && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition flex items-center gap-1.5 shadow-md ${
                isEditing ? 'text-black border-transparent shadow-md' : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
              }`}
              style={{ backgroundColor: isEditing ? artistColor : undefined }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Editing Profile' : 'Edit profile'}</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'create-playlist' && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#0c0d12]/60 backdrop-blur-3xl border border-white/5 rounded-[40px] shadow-2xl min-h-[450px] relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="absolute -top-32 -right-32 w-72 h-72 bg-gradient-to-br from-[#0EEBAA]/20 to-[#0EA5E9]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[80px] pointer-events-none opacity-20" style={{ backgroundColor: artistColor }} />

          <div className="relative z-10 flex flex-col items-center w-full max-w-md">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#13141a] to-[#1c1d25] border border-white/10 shadow-lg flex items-center justify-center mb-6">
              <ListPlus className="w-10 h-10" style={{ color: artistColor }} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Create a playlist</h2>
            <p className="text-sm text-white/50 mb-10 text-center">
              Give your playlist a name and start adding your favorite tracks from the music catalog.
            </p>
            
            <form onSubmit={handleCreatePlaylistSubmit} className="w-full flex flex-col gap-6">
              <div className="relative group">
                <label className="absolute -top-2 left-4 px-1 bg-[#13141a] text-[10px] text-white/40 font-medium z-10 rounded">
                  PLAYLIST NAME
                </label>
                <div className="relative w-full bg-[#13141a] border border-white/5 rounded-full overflow-hidden flex items-center p-2 transition-colors">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="E.g. Summer Vibes 2026"
                    className="flex-1 bg-transparent border-none text-sm text-white px-4 py-2 focus:outline-none placeholder-white/20"
                    autoFocus
                    required
                  />
                  <button
                    type="submit"
                    disabled={!newPlaylistName.trim()}
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all hover:brightness-110 shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: artistColor }}
                  >
                    <Plus className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {activeTab === 'liked-songs' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('overview')}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white">Liked Songs</h2>
              <p className="text-xs text-white/50">{favoriteSongs.size} tracks</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#A68F4D] via-[#65552F] to-[#2B281E] border border-white/10 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <Heart className="w-16 h-16 fill-white text-white opacity-90" />
              </div>
              
              <button
                onClick={() => {
                  if (favoriteSongs.size > 0) {
                    const firstFavId = Array.from(favoriteSongs)[0];
                    const song = songsCatalog.find(s => s.id === firstFavId);
                    if (song) {
                      playSong(song);
                      showToast('Playing Liked Songs', 'music');
                    }
                  }
                }}
                disabled={favoriteSongs.size === 0}
                className="w-full py-3.5 mt-2 rounded-xl text-black font-black hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                style={{ backgroundColor: artistColor }}
              >
                <Play className="w-4 h-4 fill-black" /> Play All
              </button>
            </div>

            <div className="w-full md:w-2/3 flex flex-col gap-4 bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white">Tracks ({favoriteSongs.size})</h3>
              
              {favoriteSongs.size === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-white/40">
                  <Heart className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">No liked songs yet</p>
                  <p className="text-xs text-center max-w-xs mt-1">Tap the heart on any track to add it to your Liked Songs.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from(favoriteSongs).map((songId, index) => {
                    const song = songsCatalog.find(s => s.id === songId);
                    if (!song) return null;
                    return (
                      <div 
                        key={songId + index} 
                        onClick={() => playSong(song)}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 group transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img src={song.albumArt} alt="" className="w-10 h-10 rounded-md object-cover" />
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{song.title}</p>
                            <p className="text-[11px] text-white/60">{song.artist}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = new Set(favoriteSongs);
                            updated.delete(songId);
                            useMusicStore.setState({ favoriteSongs: updated });
                            showToast('Removed from Liked Songs', 'info');
                          }}
                          className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
                          style={{ color: artistColor }}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'edit-playlist' && activePlaylist && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setActiveTab('overview');
                setEditingPlaylistId(null);
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white">Edit Playlist</h2>
              <p className="text-xs text-white/50">Manage details and tracks</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#4A5D6E] via-[#2A3744] to-[#161B22] border border-white/10 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                <Music className="w-16 h-16 text-white/20" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60">NAME</label>
                <input
                  type="text"
                  value={activePlaylist.name}
                  onChange={(e) => editPlaylist(activePlaylist.id, e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:border-white/50 outline-none"
                />
              </div>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this playlist?')) {
                    removePlaylist(activePlaylist.id);
                    setActiveTab('overview');
                    showToast('Playlist deleted', 'info');
                  }
                }}
                className="w-full py-2.5 mt-2 rounded-xl border border-rose-500/50 text-rose-400 font-bold hover:bg-rose-500/10 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Playlist
              </button>
            </div>

            <div className="w-full md:w-2/3 flex flex-col gap-4 bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white">Tracks ({activePlaylist.songs.length})</h3>
              
              {activePlaylist.songs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-white/40">
                  <Music className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">Playlist is empty</p>
                  <p className="text-xs text-center max-w-xs mt-1">Browse the music catalog and add tracks to this playlist to see them here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activePlaylist.songs.map((songId, index) => {
                    const song = songsCatalog.find(s => s.id === songId);
                    if (!song) return null;
                    return (
                      <div key={songId + index} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 group transition">
                        <div className="flex items-center gap-3">
                          <img src={song.albumArt} alt="" className="w-10 h-10 rounded-md object-cover" />
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{song.title}</p>
                            <p className="text-[11px] text-white/60">{song.artist}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeSongFromPlaylist(activePlaylist.id, songId)}
                          className="w-8 h-8 rounded-full hover:bg-rose-500/20 text-white/40 hover:text-rose-400 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* HERO ARTIST PROFILE SECTION */}
          <div className="relative pt-2 pb-2">
            <div className="absolute top-0 left-10 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-20" style={{ backgroundColor: artistColor }} />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
              <div className="relative shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 md:w-36 md:h-36 rounded-full ring-2 ring-white/20 shadow-xl overflow-hidden relative group cursor-pointer bg-gradient-to-tr from-[#313A49] via-[#485669] to-[#8C9AA8] flex items-center justify-center"
                  title="Click to change profile picture"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={userProfile.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <span className="text-4xl font-extrabold text-slate-900 tracking-wider font-sans">
                      {userProfile.name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'NR'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition duration-200">
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upload</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-black font-bold text-[11px] shadow-sm" style={{ backgroundColor: artistColor }}>
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Verified Artist</span>
                </div>

                {isEditing ? (
                  <div className="w-full max-w-md space-y-2">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="text-2xl font-black text-white bg-black/50 border border-white/20 rounded-xl px-3 py-1.5 w-full focus:outline-none focus:border-white/50" placeholder="Artist / Display Name" />
                    <div className="flex gap-2">
                      <input type="text" value={editListeners} onChange={(e) => setEditListeners(e.target.value)} className="text-xs text-white/80 bg-black/50 border border-white/20 rounded-xl px-3 py-1 flex-1 focus:outline-none focus:border-white/50" placeholder="Monthly listeners (e.g. 62,140)" />
                      <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="text-xs text-white/80 bg-black/50 border border-white/20 rounded-xl px-3 py-1 flex-1 focus:outline-none focus:border-white/50" placeholder="Location (e.g. Los Angeles, CA)" />
                    </div>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className="text-xs text-white/80 bg-black/50 border border-white/20 rounded-xl p-2.5 w-full focus:outline-none focus:border-white/50 resize-none" placeholder="Bio tagline..." />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none font-sans">{userProfile.name}</h1>
                    <p className="text-sm font-semibold text-white/50 mb-1">{userProfile.username}</p>
                    <p className="text-xs text-white/70 font-medium tracking-wide"><span className="font-bold text-white">{userProfile.monthlyListeners || '62,140'}</span> monthly listeners · {userProfile.location || 'Los Angeles, CA'}</p>
                    <p className="text-xs text-white/60 max-w-xl leading-relaxed mt-1">{userProfile.bio || userProfile.tagline || 'Synth-pop producer & vocalist — night-drive sound.'}</p>
                  </>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => { setIsFollowing(!isFollowing); showToast(isFollowing ? 'Unfollowed artist' : 'Following artist', 'check'); }} className={`px-6 py-2 rounded-full text-xs font-semibold transition border ${isFollowing ? 'bg-white/20 border-white/30 text-white' : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'}`}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={() => showToast('Profile link copied to clipboard', 'check')} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition" title="More Options">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MY PLAYLISTS SECTION */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full inline-block shadow-sm" style={{ backgroundColor: artistColor }} />
                <h3 className="text-xl font-bold text-white tracking-tight">My playlists</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {presetPlaylists.map((pl) => (
                <div key={pl.id} onClick={() => { if (songsCatalog[0]) playSong(songsCatalog[0]); showToast(`Playing playlist "${pl.name}"`, 'music'); }} className="group cursor-pointer space-y-2">
                  <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${pl.gradient} ring-1 ring-white/10 shadow-lg group-hover:scale-[1.03] transition duration-300 relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition duration-300" />
                    <div className="w-10 h-10 rounded-full bg-white text-black opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-xl transition transform translate-y-2 group-hover:translate-y-0">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:opacity-80 transition">{pl.name}</h4>
                    <p className="text-[11px] text-white/50">{pl.tracksCount}</p>
                  </div>
                </div>
              ))}

              {playlists.map((playlist) => (
                <div key={playlist.id} className="group space-y-2 relative">
                  <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#4A5D6E] via-[#2A3744] to-[#161B22] ring-1 ring-white/10 shadow-lg group-hover:scale-[1.03] transition duration-300 relative overflow-hidden flex items-center justify-center">
                    <Music className="w-8 h-8 text-white/30" />
                    
                    {/* Hover Overlay with Edit & Play Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveTab('edit-playlist'); setEditingPlaylistId(playlist.id); }}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center shadow-xl transition"
                        title="Edit Playlist"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation();
                          if (playlist.songs.length > 0) {
                            const s = songsCatalog.find((x) => x.id === playlist.songs[0]);
                            if (s) {
                              playSong(s);
                              showToast(`Playing playlist "${playlist.name}"`, 'music');
                            }
                          } else {
                            showToast(`Playlist "${playlist.name}" is empty`, 'info');
                          }
                        }}
                        className="w-10 h-10 rounded-full text-black flex items-center justify-center shadow-xl transition hover:brightness-110"
                        style={{ backgroundColor: artistColor }}
                        title="Play"
                      >
                        <Play className="w-4 h-4 ml-0.5 fill-black" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:opacity-80 transition">{playlist.name}</h4>
                    <p className="text-[11px] text-white/50">{playlist.songs.length} tracks</p>
                  </div>
                </div>
              ))}

              <div
                onClick={() => setActiveTab('create-playlist')}
                className="w-full aspect-square rounded-2xl border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/5 cursor-pointer transition flex flex-col items-center justify-center text-white/50 hover:text-white space-y-2 group"
              >
                <div className="w-8 h-8 rounded-full border border-white/30 group-hover:border-white/60 flex items-center justify-center transition">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold">New Playlist</span>
              </div>
            </div>
          </div>

          {/* LIKED SONGS SECTION */}
          <div className="pt-4 max-w-md">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full inline-block shadow-sm" style={{ backgroundColor: artistColor }} />
                <h3 className="text-xl font-bold text-white tracking-tight">Liked songs</h3>
              </div>

              <div
                onClick={() => {
                  if (isEditing) return;
                  setActiveView('favorite-music');
                }}
                className="w-full bg-[#161720]/80 hover:bg-[#1c1e2a] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition shadow-lg group relative"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#A68F4D] via-[#65552F] to-[#2B281E] flex items-center justify-center shadow-md shrink-0">
                    <Heart className="w-6 h-6 fill-white text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold tracking-wider uppercase text-white/90 group-hover:text-white transition">Liked Songs</h4>
                    <p className="text-xs text-white/50">{favoriteSongs.size || 0} songs</p>
                  </div>
                </div>

                {!isEditing && <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition" />}
                
                {isEditing && (
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Clear all liked songs?')) { clearFavoriteSongs(); showToast('Liked songs cleared', 'info'); } }} className="w-9 h-9 rounded-full bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 flex items-center justify-center transition" title="Clear Liked Songs">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* QUICK HUB & PLATFORM NAVIGATION */}
          <div className="pt-6 max-w-md">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full inline-block shadow-sm" style={{ backgroundColor: artistColor }} />
                <h3 className="text-xl font-bold text-white tracking-tight">Features &amp; Quick Access</h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setActiveView('settings')}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2.5 text-left transition active:scale-95 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white">Settings &amp; Theme</span>
                </button>

                <button
                  onClick={() => setActiveView('categories')}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2.5 text-left transition active:scale-95 cursor-pointer"
                >
                  <LayoutGrid className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-bold text-white">Browse Categories</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('home');
                    useMusicStore.getState().setViewMode('music');
                    useMusicStore.getState().setCategory('Music');
                    useMusicStore.getState().setActiveSubTab('split');
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2.5 text-left transition active:scale-95 cursor-pointer"
                >
                  <Disc className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white">3D Cover Flow</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('home');
                    useMusicStore.getState().setViewMode('movie');
                    useMusicStore.getState().setCategory('Movies');
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2.5 text-left transition active:scale-95 cursor-pointer"
                >
                  <Film className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-bold text-white">Movie Soundtracks</span>
                </button>

                <button
                  onClick={() => useMusicStore.getState().toggleQueueModal()}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2.5 text-left transition active:scale-95 cursor-pointer"
                >
                  <ListMusic className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white">Upcoming Queue</span>
                </button>

                <button
                  onClick={() => useMusicStore.getState().toggleEqualizer()}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2.5 text-left transition active:scale-95 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs font-bold text-white">Sound Equalizer</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 pb-2">
            <p className="text-[10px] font-mono tracking-widest text-white/30 uppercase">MARQUEE · ARTIST PROFILE #NR-0091</p>
          </div>
        </>
      )}

      {/* FIXED EDIT PROFILE BOTTOM BAR */}
      {isEditing && activeTab === 'overview' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#191B24]/95 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 text-xs max-w-xl w-[90%] md:w-auto animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${artistColor}25` }}>
              <Edit3 className="w-4 h-4" style={{ color: artistColor }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">Editing profile — <span className="text-white/60">changes save on this device</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleDiscardChanges} className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition">Discard</button>
            <button onClick={handleSaveProfile} className="px-5 py-1.5 rounded-xl text-black font-bold transition hover:brightness-110 shadow-lg" style={{ backgroundColor: artistColor }}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};
