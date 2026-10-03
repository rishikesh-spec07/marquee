import React from 'react';
import { Home, Sparkles, Bookmark, Search } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

export const MobileBottomNav: React.FC = () => {
  const {
    activeView,
    setActiveView,
    viewMode,
    setViewMode,
    setCategory,
    activeSubTab,
    setActiveSubTab,
    openSearchModal,
    showSearchModal,
    showFullPlayerModal
  } = useMusicStore();

  if (showFullPlayerModal) return null;

  const isHomeActive =
    activeView === 'home' &&
    viewMode === 'music' &&
    activeSubTab !== 'split' &&
    activeSubTab !== 'lyrics';

  const isDiscoverActive =
    activeView === 'home' &&
    viewMode === 'music' &&
    (activeSubTab === 'split' || activeSubTab === 'lyrics');

  const isLibraryActive = activeView === 'favorite-music' || activeView === 'categories';
  const isSearchActive = showSearchModal;

  const handleHome = () => {
    setActiveView('home');
    setViewMode('music');
    setCategory('Music');
    setActiveSubTab('grid');
  };

  const handleDiscover = () => {
    setActiveView('home');
    setViewMode('music');
    setCategory('Music');
    setActiveSubTab('split');
  };

  const handleLibrary = () => {
    setActiveView('favorite-music');
  };

  const handleSearch = () => {
    openSearchModal();
  };

  return (
    <nav
      aria-label="Mobile navigation bar"
      className="w-full h-[58px] rounded-[24px] bg-[#101116]/95 backdrop-blur-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex items-center justify-around px-3 select-none box-border"
    >
      {/* 1. Home Tab */}
      <button
        onClick={handleHome}
        className={`w-12 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
          isHomeActive
            ? 'bg-white/15 text-white shadow-inner border border-white/15'
            : 'text-white/50 hover:text-white'
        }`}
        aria-label="Home"
        title="Home"
      >
        <Home className="w-5 h-5" />
      </button>

      {/* 2. Discover / AI Tab */}
      <button
        onClick={handleDiscover}
        className={`w-12 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
          isDiscoverActive
            ? 'bg-white/15 text-white shadow-inner border border-white/15'
            : 'text-white/50 hover:text-white'
        }`}
        aria-label="Discover & AI"
        title="Discover & AI"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* 3. Library Tab */}
      <button
        onClick={handleLibrary}
        className={`w-12 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
          isLibraryActive
            ? 'bg-white/15 text-white shadow-inner border border-white/15'
            : 'text-white/50 hover:text-white'
        }`}
        aria-label="My Library"
        title="My Library"
      >
        <Bookmark className="w-5 h-5" />
      </button>

      {/* 4. Search Tab */}
      <button
        onClick={handleSearch}
        className={`w-12 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
          isSearchActive
            ? 'bg-white/15 text-white shadow-inner border border-white/15'
            : 'text-white/50 hover:text-white'
        }`}
        aria-label="Search"
        title="Search"
      >
        <Search className="w-5 h-5" />
      </button>
    </nav>
  );
};
