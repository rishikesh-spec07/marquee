import React, { useState, useEffect } from 'react';
import { LayoutGrid, ArrowLeft, Search, Music, Play, Heart, Loader2 } from 'lucide-react';
import { BROWSE_CATEGORIES } from '../data/categoriesData';
import type { CategoryCard } from '../data/categoriesData';
import { useMusicStore } from '../store/useMusicStore';
import { fetchCategorySongs, getTrackFallbackArtwork } from '../services/musicService';
import { BollywoodCategoryHub } from './BollywoodCategoryHub';
import { PopCategoryHub } from './PopCategoryHub';
import type { Song } from '../types';

export const BrowseCategories: React.FC = () => {
  const { playSong, activeTrack, songsCatalog, favoriteSongs, toggleSongFavorite } = useMusicStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryCard | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [categorySongs, setCategorySongs] = useState<Song[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  const filteredCategories = BROWSE_CATEGORIES.filter((cat) =>
    cat.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  useEffect(() => {
    if (!selectedCategory) {
      setCategorySongs([]);
      return;
    }

    const catTitle = selectedCategory.title.toLowerCase();
    if (catTitle === 'bollywood' || catTitle === 'pop') {
      return;
    }

    let isMounted = true;
    setIsLoadingCategory(true);

    fetchCategorySongs(selectedCategory.title, 30).then((songs) => {
      if (isMounted) {
        setCategorySongs(songs);
        setIsLoadingCategory(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const localFilteredSongs = selectedCategory
    ? songsCatalog.filter(
        (s) =>
          s.genre?.toLowerCase() === selectedCategory.genreTag.toLowerCase() ||
          s.title.toLowerCase().includes(selectedCategory.title.toLowerCase()) ||
          s.artist.toLowerCase().includes(selectedCategory.title.toLowerCase())
      )
    : songsCatalog;

  const displayCategorySongs = categorySongs.length > 0 ? categorySongs : localFilteredSongs;

  if (selectedCategory) {
    if (selectedCategory.title.toLowerCase() === 'bollywood') {
      return <BollywoodCategoryHub onBack={() => setSelectedCategory(null)} />;
    }
    if (selectedCategory.title.toLowerCase() === 'pop') {
      return <PopCategoryHub onBack={() => setSelectedCategory(null)} />;
    }

    return (
      <div className="flex-1 flex flex-col justify-between pt-6 px-6 pb-6 overflow-hidden relative w-full">
        {/* Sub-Header with Back Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Categories
            </button>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight">{selectedCategory.title}</h2>
              <p className="text-[11px] text-white/60">
                {isLoadingCategory ? 'Fetching live songs...' : `${displayCategorySongs.length} Tracks in this Category`}
              </p>
            </div>
          </div>
          {isLoadingCategory && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading Songs...
            </div>
          )}
        </div>

        {/* Songs Grid matching exact card interface */}
        <div className="flex-1 w-full min-w-full overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pb-20">
            {displayCategorySongs.map((song) => {
              const isActive = (activeTrack?.canonicalTrackId || activeTrack?.id) === (song.canonicalTrackId || song.id);
              const isFav = favoriteSongs.has(song.id);

              return (
                <div
                  key={song.canonicalTrackId || song.id}
                  onClick={() => playSong(song)}
                  className={`group relative rounded-3xl overflow-hidden p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.02] shadow-xl border ${
                    isActive
                      ? 'border-emerald-400/80 ring-2 ring-emerald-400/40 bg-emerald-950/20 shadow-emerald-500/20'
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
                          target.src = getTrackFallbackArtwork(song.title, song.artist);
                        }
                      }}
                    />

                    {/* Top Active Badge & Heart Button */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                      {isActive ? (
                        <span className="bg-emerald-500 text-black font-extrabold text-[9px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" /> Now Playing
                        </span>
                      ) : (
                        <span />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSongFavorite(song.id);
                        }}
                        className="pointer-events-auto w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-rose-400 hover:bg-black/80 hover:scale-110 transition shadow-lg ml-auto"
                        title="Favorite Track"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Center Play Button Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition duration-300">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Clean Song Meta Details */}
                  <div className="flex flex-col min-w-0 px-0.5">
                    <h4 className="text-xs font-extrabold text-white truncate leading-snug group-hover:text-amber-300 transition-colors drop-shadow-md">
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
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between pt-24 px-4 pb-28 md:pt-6 md:px-6 md:pb-6 overflow-hidden relative w-full">
      {/* Top Header & Search Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-400" /> Browse Categories
          </h2>
          <p className="text-[11px] text-white/60">Explore genre collections & curated spatial playlists</p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full bg-black/40 border border-white/15 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:bg-black/60 focus:border-white/30 transition shadow-inner"
          />
        </div>
      </div>

      {/* 25-Category Vibrant Cards Grid */}
      <div className="flex-1 w-full overflow-y-auto pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat);
              }}
              className="relative h-32 rounded-3xl overflow-hidden p-4 cursor-pointer glass-card-hover transition duration-300 group border border-white/15 flex flex-col justify-between shadow-xl"
              style={{ background: cat.gradient }}
            >
              {/* Background Art with Duotone Overlay */}
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50 group-hover:scale-110 transition duration-500 pointer-events-none -z-10"
              />

              {/* Title & Micro Tag */}
              <div className="flex justify-between items-start z-10">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  Genre
                </span>
                <Music className="w-4 h-4 text-white/70 group-hover:text-white group-hover:scale-110 transition" />
              </div>

              <h3 className="text-sm font-extrabold text-white leading-tight drop-shadow-md z-10 group-hover:translate-x-1 transition-transform">
                {cat.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
