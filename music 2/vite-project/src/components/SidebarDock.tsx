import React from 'react';
import { Home, Tv, Sparkles, Eye, Bookmark, Download, Disc, Mic, ListMusic, Sliders, Library, Heart, Film, Settings, LayoutGrid, User } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

export const SidebarDock: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    activeView,
    setActiveView,
    setCategory,
    toggleLyricsPanel,
    toggleQueueModal,
    toggleEqualizer,
    togglePlaylistsModal,
    toggleApiKeyModal,
    appSettings
  } = useMusicStore();

  const movieMenuItems = [
    { action: 'home', icon: Home, title: 'Movie Dashboard' },
    { action: 'profile', icon: User, title: 'User Profile' },
    { action: 'tv-series', icon: Tv, title: 'TV Series Hub' },
    { action: 'animation-hub', icon: Sparkles, title: 'Animation & Anime' },
    { action: 'mystery-universe', icon: Eye, title: 'Mystery Universe' },
    { action: 'categories', icon: LayoutGrid, title: 'Browse Categories' },
    { action: 'favorite-music', icon: Heart, title: 'Favorite Music' },
    { action: 'switch-music', icon: Disc, title: '3D Music Mode' }
  ];

  const musicMenuItems = [
    { action: 'profile', icon: User, title: 'User Profile' },
    { action: 'music-3d', icon: Disc, title: '3D Cover Flow' },
    { action: 'categories', icon: LayoutGrid, title: 'Browse Categories' },
    { action: 'favorite-music', icon: Heart, title: 'Favorite Music' },
    { action: 'lyrics', icon: Mic, title: 'Live Synced Lyrics' },
    { action: 'queue', icon: ListMusic, title: 'Upcoming Queue' },
    { action: 'switch-movie', icon: Film, title: 'Movie Dashboard' }
  ];

  const items = viewMode === 'movie' ? movieMenuItems : musicMenuItems;

  const handleAction = (action: string) => {
    if (action === 'profile') {
      setActiveView('profile');
    } else if (action === 'home') {
      setViewMode('movie');
      setActiveView('home');
      setCategory('Movies');
    } else if (action === 'tv-series') {
      setViewMode('movie');
      setActiveView('home');
      setCategory('TV Series');
    } else if (action === 'animation-hub') {
      setViewMode('movie');
      setActiveView('home');
      setCategory('Animation');
    } else if (action === 'mystery-universe') {
      setViewMode('movie');
      setActiveView('home');
      setCategory('Mystery');
    } else if (action === 'library') {
      setViewMode('movie');
      setActiveView('favorites');
    } else if (action === 'categories') {
      setViewMode('music');
      setActiveView('categories');
    } else if (action === 'favorite-music') {
      setViewMode('music');
      setActiveView('favorite-music');
    } else if (action === 'switch-music' || action === 'music-3d') {
      setViewMode('music');
      setActiveView('home');
      useMusicStore.getState().setActiveSubTab('split');
    } else if (action === 'lyrics') {
      setViewMode('music');
      setActiveView('home');
      useMusicStore.getState().setActiveSubTab('lyrics');
    } else if (action === 'queue') {
      toggleQueueModal();
    } else if (action === 'playlists') {
      togglePlaylistsModal();
    } else if (action === 'switch-movie') {
      setViewMode('movie');
      setActiveView('home');
    }
  };

  return (
    <aside className="flex flex-col items-center justify-between py-5 px-3 glass-dock rounded-full shadow-2xl w-14 my-auto h-auto min-h-[480px] flex-shrink-0 z-20 transition-all duration-300">
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isItemActive =
            (item.action === 'favorite-music' && activeView === 'favorite-music') ||
            (item.action === 'categories' && activeView === 'categories') ||
            (item.action === 'music-3d' && viewMode === 'music' && activeView === 'home') ||
            (item.action === 'home' && viewMode === 'movie' && activeView === 'home') ||
            (item.action === 'library' && activeView === 'favorites');

          return (
            <button
              key={item.action}
              onClick={() => handleAction(item.action)}
              className={`dock-btn p-2.5 rounded-full transition relative group flex items-center justify-center ${
                isItemActive
                  ? item.action === 'favorite-music'
                    ? 'text-rose-400 bg-rose-500/20 border border-rose-500/30 shadow-lg shadow-rose-500/20'
                    : 'text-white bg-white/20 border border-white/25 shadow-lg'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title={item.title}
            >
              <Icon className={`w-5 h-5 ${isItemActive && item.action === 'favorite-music' ? 'fill-rose-500' : ''}`} />
              <span className="absolute left-16 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-medium opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setActiveView('settings')}
        className={`dock-btn p-2.5 rounded-full transition relative group mt-2 ${
          activeView === 'settings'
            ? 'text-black font-bold shadow-lg ring-2 ring-white/30'
            : 'text-white/50 hover:text-white hover:bg-white/10'
        }`}
        style={{
          backgroundColor: activeView === 'settings' ? (appSettings?.artistThemeColor || '#1DB954') : undefined
        }}
        title="Settings & Artist Theme"
      >
        <Settings className="w-5 h-5" />
        <span className="absolute left-16 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-medium opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
          Settings & Theme
        </span>
      </button>
    </aside>
  );
};
