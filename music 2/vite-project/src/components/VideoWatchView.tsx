import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Film,
  Star,
  Play,
  ImageOff
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import {
  resolveMovieTrailer,
  getMediaByCategory,
  type MovieItem
} from '../services/mediaService';
import type { Movie } from '../types';

export const VideoWatchView: React.FC = () => {
  const { activeVideo, closeVideo, openVideo } = useMusicStore();
  const [resolvedVideoId, setResolvedVideoId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(true);
  const [relatedTitles, setRelatedTitles] = useState<MovieItem[]>([]);

  const isAnimation = activeVideo?.mediaType === 'animation' || activeVideo?.category === 'Animation';
  const isTVSeries = activeVideo?.isTv || activeVideo?.category === 'TV Series';
  const isMystery = activeVideo?.category === 'Mystery';

  useEffect(() => {
    let isMounted = true;
    setIsResolving(true);
    setResolvedVideoId(null);

    if (!activeVideo) return;

    if (activeVideo.videoId) {
      setResolvedVideoId(activeVideo.videoId);
      setIsResolving(false);
      return;
    }

    if (activeVideo.tmdbId) {
      const dummyItem: MovieItem = {
        id: activeVideo.tmdbId,
        title: activeVideo.title,
        overview: activeVideo.description || '',
        poster_path: null,
        backdrop_path: null,
        release_date: activeVideo.year || '',
        vote_average: 0,
        genre_ids: [],
        posterUrl: activeVideo.posterImg || null,
        backdropUrl: activeVideo.bannerImg || null,
        year: activeVideo.year || '',
        rating: activeVideo.rating || '',
        mediaType: isAnimation ? 'animation' : isTVSeries ? 'tv' : 'movie',
        category: activeVideo.category
      };

      resolveMovieTrailer(dummyItem)
        .then((vId) => {
          if (isMounted) {
            setResolvedVideoId(vId);
            setIsResolving(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setResolvedVideoId(null);
            setIsResolving(false);
          }
        });
    } else {
      setIsResolving(false);
    }

    return () => {
      isMounted = false;
    };
  }, [activeVideo?.id, isAnimation, isTVSeries]);

  useEffect(() => {
    let isMounted = true;
    const fetchRelated = async () => {
      try {
        const cat = activeVideo?.category || (isAnimation ? 'Animation' : isTVSeries ? 'TV Series' : isMystery ? 'Mystery' : 'Movies');
        const list = await getMediaByCategory(cat);
        if (isMounted && list) {
          const filtered = list.filter((item) => `tmdb-${item.id}` !== activeVideo?.id).slice(0, 6);
          setRelatedTitles(filtered);
        }
      } catch (e) {}
    };

    fetchRelated();
    return () => {
      isMounted = false;
    };
  }, [activeVideo?.id, isAnimation, isTVSeries, isMystery]);

  if (!activeVideo) return null;

  const handleSelectRelated = (item: MovieItem) => {
    const isAnim = item.mediaType === 'animation' || isAnimation;
    const isTv = item.mediaType === 'tv' || isTVSeries;

    const movie: Movie = {
      id: `tmdb-${item.id}`,
      tmdbId: item.id,
      mediaType: isAnim ? 'animation' : 'movie',
      isTv,
      category: isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Movies',
      title: item.title,
      description: item.overview,
      posterImg: item.posterUrl || undefined,
      bannerImg: item.backdropUrl || item.posterUrl || undefined,
      poster: item.posterUrl || undefined,
      year: item.year,
      rating: item.rating,
      quality: '4K HDR',
      duration: isTv ? 'Series' : '2h 10m',
      genre: isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Cinema',
      tags: ['TMDB 4K', isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Cinema']
    };
    openVideo(movie);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pt-20 px-6 pb-16 custom-scrollbar select-none animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <button
          onClick={closeVideo}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isAnimation ? 'Animation' : isTVSeries ? 'TV Series' : isMystery ? 'Mystery' : 'Movies'}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
            {isAnimation ? 'Animation Feature' : isTVSeries ? 'TV Series Feature' : 'Cinematic Video'}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono text-white/70">
            {activeVideo.quality || '4K HDR'}
          </span>
        </div>
      </div>

      {/* 16:9 Video Player Container */}
      <div className="w-full relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex items-center justify-center group">
        {isResolving ? (
          <div className="flex flex-col items-center justify-center text-center p-8 z-20">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-amber-400 animate-spin mb-4" />
            <p className="text-xs text-white/60 font-medium">Loading video stream...</p>
          </div>
        ) : resolvedVideoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${resolvedVideoId}?autoplay=1&enablejsapi=1&rel=0`}
            title={activeVideo.title}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 z-20">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <Film className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Video unavailable</h3>
            <p className="text-xs text-white/50 max-w-sm leading-relaxed">
              No official video or trailer stream was found for "{activeVideo.title}".
            </p>
          </div>
        )}
      </div>

      {/* Video Details Section */}
      <div className="mt-6 flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            {activeVideo.rating && (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {activeVideo.rating}
              </span>
            )}
            {activeVideo.year && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-xs text-white/60 font-medium">{activeVideo.year}</span>
              </>
            )}
            <span className="text-white/30">•</span>
            <span className="text-xs text-indigo-300 font-semibold">{isAnimation ? 'Animation' : 'Movie'}</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight mb-3">
            {activeVideo.title}
          </h1>

          <p className="text-sm text-white/70 max-w-3xl leading-relaxed mb-4 font-normal">
            {activeVideo.description || 'No overview available for this title.'}
          </p>
        </div>
      </div>

      {/* More Titles Like This */}
      {relatedTitles.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" /> More Titles Like This
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {relatedTitles.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectRelated(item)}
                className="flex flex-col gap-2 group cursor-pointer"
              >
                <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden bg-black/40 border border-white/10 relative shadow-md group-hover:scale-105 group-hover:border-amber-400/50 transition duration-300">
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white/30">
                      <ImageOff className="w-6 h-6 mb-1 text-white/20" />
                      <span className="text-[9px]">No Artwork</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-amber-300 transition">
                  {item.title}
                </h4>
                <span className="text-[10px] text-white/50">{item.year || '2024'} • {isAnimation ? 'Animation' : 'Movie'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
