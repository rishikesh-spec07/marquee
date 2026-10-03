import React, { useEffect, Suspense, lazy } from 'react';
import { useMusicStore } from './store/useMusicStore';
import { HeaderNav } from './components/HeaderNav';
import { SidebarDock } from './components/SidebarDock';
import { MusicGrid } from './components/MusicGrid';
import { AudioPlayer } from './components/AudioPlayer';
import { ToastContainer } from './components/ToastContainer';
import { ConnectionAndLoadingFeedback } from './components/ConnectionAndLoadingFeedback';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MarqueeWaveLogo } from './components/MarqueeWaveLogo';

// Code-split heavy non-critical views with dynamic import()
const BrowseCategories = lazy(() => import('./components/BrowseCategories').then(m => ({ default: m.BrowseCategories })));
const EqualizerDrawer = lazy(() => import('./components/EqualizerDrawer').then(m => ({ default: m.EqualizerDrawer })));
const SoundtrackExplorer = lazy(() => import('./components/SoundtrackExplorer').then(m => ({ default: m.SoundtrackExplorer })));
const FavoriteMusicView = lazy(() => import('./components/FavoriteMusicView').then(m => ({ default: m.FavoriteMusicView })));
const ProfileView = lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const VideoWatchView = lazy(() => import('./components/VideoWatchView').then(m => ({ default: m.VideoWatchView })));
const TrackOverviewModal = lazy(() => import('./components/TrackOverviewModal').then(m => ({ default: m.TrackOverviewModal })));
const ApiKeyModal = lazy(() => import('./components/ApiKeyModal').then(m => ({ default: m.ApiKeyModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const QueueModal = lazy(() => import('./components/QueueModal').then(m => ({ default: m.QueueModal })));
const PlaylistsModal = lazy(() => import('./components/PlaylistsModal').then(m => ({ default: m.PlaylistsModal })));
const IntroLogoSplash = lazy(() => import('./components/IntroLogoSplash').then(m => ({ default: m.IntroLogoSplash })));

// Seamless dark fallback matching the background to prevent white flashes and CLS
const DarkSuspenseFallback = () => (
  <div className="w-full h-full flex-1 bg-[#0c0d12] flex items-center justify-center pointer-events-none" />
);

export const App: React.FC = () => {
  const {
    viewMode,
    activeView,
    activeSubTab,
    activeVideo,
    loadAllTimeSongs,
    currentCategory,
    appSettings,
    isScrolled,
    setIsScrolled,
    isHeaderVisible,
    setIsHeaderVisible,
    hasPlaybackStarted,
    isPlayingAudio,
    showIntroSplash,
    setShowIntroSplash
  } = useMusicStore();

  const isHeaderHidden =
    activeView === 'profile' ||
    activeView === 'favorite-music' ||
    activeView === 'settings' ||
    activeView === 'categories' ||
    activeView === 'watch' ||
    (activeView === 'home' && viewMode === 'music' && (activeSubTab === 'split' || activeSubTab === 'lyrics'));

  useEffect(() => {
    loadAllTimeSongs();
  }, [loadAllTimeSongs]);

  useEffect(() => {
    const color = appSettings?.artistThemeColor || '#1DB954';
    document.documentElement.style.setProperty('--artist-theme-color', color);
  }, [appSettings?.artistThemeColor]);

  // Reset header visibility when changing views
  useEffect(() => {
    setIsHeaderVisible(true);
    setIsScrolled(false);
  }, [activeView, viewMode, currentCategory, setIsHeaderVisible, setIsScrolled]);

  // Smart Scroll Listener: Hides header when scrolling down (10px threshold via rAF), shows on scroll up
  useEffect(() => {
    let lastScrollTop = 0;
    let rAFId: number | null = null;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || typeof target.scrollTop !== 'number') return;

      if (rAFId !== null) return;

      rAFId = requestAnimationFrame(() => {
        rAFId = null;
        const currentScrollTop = target.scrollTop;

        // Near top: always show full header
        if (currentScrollTop <= 35) {
          setIsHeaderVisible(true);
          setIsScrolled(false);
          lastScrollTop = currentScrollTop;
          return;
        }

        setIsScrolled(true);
        const diff = currentScrollTop - lastScrollTop;

        // 10px threshold
        if (Math.abs(diff) >= 10) {
          if (diff > 0) {
            // Scrolling down -> hide header
            setIsHeaderVisible(false);
          } else {
            // Scrolling up -> show header
            setIsHeaderVisible(true);
          }
          lastScrollTop = currentScrollTop;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      if (rAFId !== null) cancelAnimationFrame(rAFId);
    };
  }, [setIsHeaderVisible, setIsScrolled]);

  useEffect(() => {
    if (appSettings?.enableCursorFollower === false) return;

    let rAFId: number | null = null;
    let latestE: MouseEvent | null = null;

    const updateFollower = () => {
      if (!latestE) return;
      const xRatio = latestE.clientX / window.innerWidth;
      const yRatio = latestE.clientY / window.innerHeight;
      const dynamicHue = Math.round((xRatio * 220 + yRatio * 140 + 35) % 360);
      const follower = document.getElementById('spatial-cursor-follower');
      if (follower) {
        follower.style.transform = `translate3d(${latestE.clientX}px, ${latestE.clientY}px, 0px)`;
        follower.style.background = `radial-gradient(circle, hsla(${dynamicHue}, 50%, 75%, 0.35) 0%, transparent 70%)`;
      }
      rAFId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      latestE = e;
      if (rAFId === null) {
        rAFId = requestAnimationFrame(updateFollower);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rAFId !== null) cancelAnimationFrame(rAFId);
    };
  }, [appSettings?.enableCursorFollower]);

  return (
    <div className="h-[100svh] w-full overflow-hidden flex flex-col md:flex-row md:items-center md:justify-center p-0 md:p-3 lg:p-6 text-white select-none relative bg-[#0c0d12]">
      {/* Ambient Spotlight Layer */}
      <div id="spatial-cursor-follower" className="spatial-cursor hidden md:block" />

      {/* Main VisionOS Spatial Container */}
      <div className="relative flex flex-col md:flex-row gap-0 md:gap-5 w-full md:max-w-[1560px] h-full md:h-[92vh] md:max-h-[940px] z-10 overflow-hidden">
        {/* Floating Side Dock - Desktop Only */}
        <div className="hidden md:flex h-full items-center">
          <SidebarDock />
        </div>

        {/* Main Vision Panel */}
        <main className="flex-1 w-full h-full glass-panel rounded-none md:rounded-[40px] shadow-none md:shadow-2xl flex flex-col overflow-hidden relative border-0 md:border md:border-white/20">
          {/* Header Bar - Auto-hides on mobile scroll down with 200ms slide-up */}
          {!isHeaderHidden && (
            <div
              className={`w-full z-40 transition-all duration-200 ease-out transform absolute top-0 left-0 right-0 md:top-4 md:left-6 md:right-6 ${
                isHeaderVisible
                  ? 'translate-y-0 opacity-100 pointer-events-auto'
                  : '-translate-y-full opacity-0 pointer-events-none md:-translate-y-28 md:opacity-0'
              }`}
            >
              <div className="w-full">
                <HeaderNav />
              </div>
            </div>
          )}

          {/* Slim Pinned Header (44px) when full header is scrolled up on mobile */}
          <div
            className={`md:hidden fixed top-0 left-0 right-0 z-30 h-11 px-4 bg-[#0c0d12]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between transition-all duration-200 ease-out ${
              !isHeaderVisible
                ? 'translate-y-0 opacity-100 pointer-events-auto'
                : '-translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-2">
              <MarqueeWaveLogo isPlaying={isPlayingAudio} height={20} />
              <span className="font-extrabold text-xs tracking-wider text-white uppercase font-sans">
                MARQUEE
              </span>
            </div>
            <span className="text-xs font-bold text-amber-400 capitalize">
              {activeView === 'favorite-music'
                ? 'My Library'
                : viewMode === 'movie'
                ? currentCategory === 'Animation'
                  ? 'Animation'
                  : 'Movies'
                : 'Music'}
            </span>
          </div>

          <div className="flex-1 h-full w-full overflow-hidden relative flex flex-col">
            <Suspense fallback={<DarkSuspenseFallback />}>
              {activeView === 'watch' ? (
                <VideoWatchView />
              ) : activeView === 'profile' ? (
                <ProfileView />
              ) : activeView === 'settings' ? (
                <SettingsView />
              ) : activeView === 'favorite-music' ? (
                <FavoriteMusicView />
              ) : activeView === 'categories' ? (
                <BrowseCategories />
              ) : viewMode === 'movie' ? (
                <SoundtrackExplorer />
              ) : (
                <MusicGrid />
              )}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Floating Bottom Audio Player */}
      {viewMode === 'music' && currentCategory === 'Music' && !activeVideo && activeView !== 'watch' && (hasPlaybackStarted || isPlayingAudio) && <AudioPlayer />}

      {/* Floating Mobile Bottom Navigation Bar (< 768px) */}
      {activeView !== 'watch' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(12px,env(safe-area-inset-bottom,12px))] pointer-events-none">
          <div className="pointer-events-auto w-full">
            <MobileBottomNav />
          </div>
        </div>
      )}

      {/* Modals with Dark Suspense Fallback */}
      <Suspense fallback={null}>
        <TrackOverviewModal />
        <EqualizerDrawer />
        <ApiKeyModal />
        <AuthModal />
        <SearchModal />
        <QueueModal />
        <PlaylistsModal />
        {showIntroSplash && (
          <IntroLogoSplash onFinish={() => setShowIntroSplash(false)} />
        )}
      </Suspense>

      <ToastContainer />
      <ConnectionAndLoadingFeedback />
    </div>
  );
};
