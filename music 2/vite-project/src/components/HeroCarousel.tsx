import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Film } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { getMediaByCategory, type MovieItem } from '../services/mediaService';
import type { Movie } from '../types';

export const HeroCarousel: React.FC = () => {
  const { currentCategory, openVideo } = useMusicStore();
  const [heroes, setHeroes] = useState<MovieItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isAnimation = currentCategory === 'Animation';
  const isTVSeries = currentCategory === 'TV Series';
  const isMystery = currentCategory === 'Mystery';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setCurrentIndex(0);

    const fetchHeroes = async () => {
      try {
        const data = await getMediaByCategory(currentCategory);

        if (isMounted) {
          // Take top 5 items with valid artwork, or any items
          const filtered = data.filter((item) => item.backdropUrl || item.posterUrl).slice(0, 5);
          setHeroes(filtered.length > 0 ? filtered : data.slice(0, 5));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHeroes();

    return () => {
      isMounted = false;
    };
  }, [currentCategory]);

  if (isLoading && heroes.length === 0) {
    return (
      <div className="relative h-[280px] md:h-[310px] rounded-3xl overflow-hidden border border-white/10 bg-white/5 animate-pulse p-8 flex flex-col justify-between" />
    );
  }

  if (heroes.length === 0) {
    return null;
  }

  const currentMovie = heroes[currentIndex] || heroes[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + heroes.length) % heroes.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % heroes.length);
  };

  const handleStreamHeroMovie = () => {
    const isAnim = currentMovie.mediaType === 'animation' || isAnimation;
    const isTv = currentMovie.mediaType === 'tv' || isTVSeries;

    const movie: Movie = {
      id: `tmdb-${currentMovie.id}`,
      tmdbId: currentMovie.id,
      mediaType: isAnim ? 'animation' : 'movie',
      isTv,
      category: isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Movies',
      title: currentMovie.title,
      description: currentMovie.overview,
      posterImg: currentMovie.posterUrl || undefined,
      bannerImg: currentMovie.backdropUrl || currentMovie.posterUrl || undefined,
      poster: currentMovie.posterUrl || undefined,
      year: currentMovie.year,
      rating: currentMovie.rating,
      quality: '4K HDR',
      duration: isTv ? 'Series' : '2h 10m',
      genre: isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Cinema',
      tags: ['TMDB 4K', isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Cinema'],
      subTags: [isAnim ? 'Animation' : isTv ? 'TV Series' : 'Movie', currentMovie.rating]
    };

    openVideo(movie);
  };

  const heroBackdrop = currentMovie.backdropUrl || currentMovie.posterUrl;

  return (
    <div className="relative h-[280px] md:h-[310px] rounded-3xl overflow-hidden border border-white/15 p-6 md:p-8 flex flex-col justify-between group shadow-2xl">
      {heroBackdrop && (
        <img
          src={heroBackdrop}
          alt={currentMovie.title}
          className="absolute inset-0 w-full h-full object-cover brightness-70 transition-all duration-700 -z-10 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent -z-10" />

      {/* Top Banner Controls */}
      <div className="flex items-center justify-between z-10">
        <span className="bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 text-white shadow-md">
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isAnimation
              ? 'Featured Animation'
              : isTVSeries
              ? 'Featured TV Series'
              : isMystery
              ? 'Mystery Spotlight'
              : 'Trending Spotlight'}
          </span>
        </span>
        {heroes.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white hover:text-black transition text-white shadow-md"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white hover:text-black transition text-white shadow-md"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Movie Details */}
      <div className="max-w-xl z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] bg-white/20 backdrop-blur-md border border-white/25 px-2.5 py-0.5 rounded-full text-white font-semibold shadow-sm">
            {isAnimation ? 'Animation' : 'Movie'}
          </span>
          {currentMovie.rating && currentMovie.rating !== 'N/A' && (
            <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold px-2 py-0.5 rounded-full">
              {currentMovie.rating}
            </span>
          )}
          {currentMovie.year && (
            <span className="text-[10px] text-white/70 font-medium">
              {currentMovie.year}
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-2 drop-shadow-lg text-white">
          {currentMovie.title}
        </h1>
        <p className="text-xs text-white/80 line-clamp-2 mb-4 leading-relaxed font-normal max-w-lg">
          {currentMovie.overview}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStreamHeroMovie}
            className="bg-white text-black font-bold text-xs px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/90 transition shadow-xl hover:scale-105 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Watch Trailer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
