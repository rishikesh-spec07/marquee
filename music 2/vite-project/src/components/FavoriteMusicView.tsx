import React, { useState } from 'react';
import { Heart, Play, Shuffle, Search, Disc, Sparkles } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

export const FavoriteMusicView: React.FC = () => {
  const { songsCatalog, activeSongIndex, favoriteSongs, toggleSongFavorite, playSong, isPlayingAudio, setActiveView, setViewMode, showToast } =
    useMusicStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Get all favorited songs from the catalog
  const favoriteSongsList = songsCatalog.filter((song) => favoriteSongs.has(song.id));

  // Filter favorited songs by search query if present
  const filteredFavoriteSongs = favoriteSongsList.filter((song) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.album.toLowerCase().includes(q) ||
      (song.genre && song.genre.toLowerCase().includes(q))
    );
  });

  const handlePlayAll = () => {
    if (favoriteSongsList.length === 0) return;
    playSong(favoriteSongsList[0]);
  };

  const handleShufflePlay = () => {
    if (favoriteSongsList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * favoriteSongsList.length);
    playSong(favoriteSongsList[randomIndex]);
  };

  const handlePlaySong = (song: any) => {
    playSong(song);
  };

  return (
    <div className="flex-1 flex flex-col justify-between pt-24 px-4 pb-48 md:pt-6 md:px-6 md:pb-6 overflow-hidden relative w-full h-full">
      {/* Top Header Banner for Favorites */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/25 ring-2 ring-white/20">
              <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white leading-tight flex items-center gap-2">
                Favorite Music
                <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  {favoriteSongsList.length} {favoriteSongsList.length === 1 ? 'Track' : 'Tracks'}
                </span>
              </h2>
              <p className="text-xs text-white/60">Your personal collection of favorited songs. Click any track to play!</p>
            </div>
          </div>

          {/* Action Buttons */}
          {favoriteSongsList.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayAll}
                className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition shadow-lg shadow-rose-500/30 flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Play All
              </button>
              <button
                onClick={handleShufflePlay}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
            </div>
          )}
        </div>

        {/* Filter Search Input within Favorites */}
        {favoriteSongsList.length > 0 && (
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your favorite songs..."
              className="w-full bg-black/40 border border-white/15 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:bg-black/60 focus:border-rose-400/50 transition shadow-inner"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {favoriteSongsList.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 glass-panel rounded-3xl border border-white/15 text-center my-auto min-h-[380px]">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 shadow-2xl">
            <Heart className="w-10 h-10 text-rose-400 fill-rose-500/30" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No liked tracks yet</h3>
          <p className="text-xs text-white/60 max-w-md mb-6 leading-relaxed">
            Tap the heart on any song to add it to your favorites.
          </p>
          <button
            onClick={() => {
              setViewMode('music');
              setActiveView('home');
            }}
            className="px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs shadow-xl hover:bg-white/90 hover:scale-105 transition flex items-center gap-2"
          >
            <Disc className="w-4 h-4 text-black" /> Browse All Songs
          </button>
        </div>
      ) : filteredFavoriteSongs.length === 0 ? (
        /* Search Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 glass-panel rounded-3xl border border-white/15 text-center my-auto">
          <p className="text-sm font-semibold text-white/70">No favorite songs match "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs text-rose-400 hover:text-rose-300 underline font-medium"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        /* Favorite Music Cards Grid */
        <div className="flex-1 w-full overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 pb-28 md:pb-20">
            {filteredFavoriteSongs.map((song) => {
              const actualIndex = songsCatalog.findIndex((s) => s.id === song.id);
              const isActive = actualIndex === activeSongIndex;

              return (
                <div
                  key={song.canonicalTrackId || song.id}
                  onClick={() => handlePlaySong(song)}
                  className={`group relative rounded-3xl overflow-hidden p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.02] shadow-xl border ${
                    isActive
                      ? 'border-rose-400/80 ring-2 ring-rose-400/40 bg-rose-950/20 shadow-rose-500/20'
                      : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  {/* Clean 1:1 Square Poster Artwork Frame */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-3 shadow-lg border border-white/10 bg-black/40">
                    {/* Ambient Fill Background for Widescreen 16:9 Thumbnails */}
                    <img
                      src={song.albumArt}
                      alt={song.title}
                      className="absolute inset-0 w-full h-full object-cover filter blur-md scale-110 opacity-50 pointer-events-none"
                    />

                    {/* Main High-Res 1:1 Poster Image */}
                    <img
                      src={song.albumArt}
                      alt={song.title}
                      className="relative w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 z-0"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.includes('maxresdefault.jpg')) {
                          target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                        } else {
                          target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                        }
                      }}
                    />

                    {/* Top Active Badge & Heart Action Button */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                      {isActive && isPlayingAudio ? (
                        <span className="bg-rose-500 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Playing Now
                        </span>
                      ) : (
                        <span />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSongFavorite(song.id);
                        }}
                        className="pointer-events-auto w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-rose-500/40 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-600 hover:scale-110 transition shadow-md ml-auto"
                        title="Remove from favorites"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500 hover:fill-white" />
                      </button>
                    </div>

                    {/* Center Play Button Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition duration-300">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Clean Song Meta Details */}
                  <div className="flex flex-col min-w-0 px-0.5">
                    <h4 className="text-xs font-extrabold text-white truncate leading-snug group-hover:text-rose-300 transition-colors drop-shadow-md">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-white/60 truncate font-medium leading-tight mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
