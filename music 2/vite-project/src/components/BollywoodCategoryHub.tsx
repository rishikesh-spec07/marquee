import React from 'react';
import { ArrowLeft, Play, MoreHorizontal, ChevronRight, Plus, Heart } from 'lucide-react';
import {
  BOLLYWOOD_FEATURED_BANNERS,
  BOLLYWOOD_PLAYLISTS,
  BOLLYWOOD_BEST_NEW_SONGS,
  BOLLYWOOD_NEW_RELEASES,
  BOLLYWOOD_ARTIST_PLAYLISTS,
  BOLLYWOOD_ESSENTIAL_ALBUMS,
  BOLLYWOOD_ARTISTS_WE_LOVE
} from '../data/bollywoodData';
import { useMusicStore } from '../store/useMusicStore';
import type { Song } from '../types';

interface BollywoodCategoryHubProps {
  onBack?: () => void;
}

export const BollywoodCategoryHub: React.FC<BollywoodCategoryHubProps> = ({ onBack }) => {
  const { playSong, activeTrack, isPlayingAudio, showToast } = useMusicStore();

  const handlePlayBollyTrack = (track: Song) => {
    playSong(track);
  };

  return (
    <div className="flex-1 flex flex-col justify-between pt-20 px-6 pb-6 overflow-y-auto pr-2 relative w-full space-y-8 select-none">
      {/* Top Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Bollywood</h1>
        </div>
        <span className="text-xs text-white/50 font-medium">Apple Music Bollywood Hub</span>
      </div>

      {/* 1. Top Featured Banners (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {BOLLYWOOD_FEATURED_BANNERS.map((banner) => (
          <div
            key={banner.id}
            onClick={() => handlePlayBollyTrack({
              id: banner.id,
              canonicalTrackId: `youtube:${banner.title.toLowerCase().includes('throwback') ? 'TrdDy-NPdV8' : (banner.title.toLowerCase().includes('safed') ? 'Etkd-07gnxM' : 'Umqb9KENgmk')}`,
              providerTrackId: banner.title.toLowerCase().includes('throwback') ? 'TrdDy-NPdV8' : (banner.title.toLowerCase().includes('safed') ? 'Etkd-07gnxM' : 'Umqb9KENgmk'),
              provider: 'youtube',
              title: banner.title,
              artist: banner.subtitle,
              album: banner.title,
              albumArt: banner.image,
              audioUrl: banner.audioUrl,
              duration: 240,
              playbackType: 'full'
            })}
            className="relative h-64 rounded-3xl overflow-hidden border border-white/15 p-5 flex flex-col justify-between cursor-pointer group glass-card-hover shadow-2xl"
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 brightness-90 -z-10"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 -z-10" />

            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 mb-1">
                {banner.tag}
              </span>
              <h3 className="text-lg font-extrabold text-white leading-tight drop-shadow-md">
                {banner.title}
              </h3>
              <span className="text-xs text-white/70 font-medium mt-0.5">{banner.subtitle}</span>
            </div>

            <div className="flex items-end justify-between">
              <p className="text-[11px] text-white/80 line-clamp-2 max-w-[200px] leading-tight">
                {banner.caption}
              </p>
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition flex-shrink-0">
                <Play className="w-5 h-5 fill-black ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Playlists Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition">
            <span>Playlists</span> <ChevronRight className="w-4 h-4 text-white/60" />
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {BOLLYWOOD_PLAYLISTS.map((pl) => (
            <div
              key={pl.id}
              onClick={() => handlePlayBollyTrack({
                id: pl.id,
                canonicalTrackId: `youtube:${pl.id}`,
                providerTrackId: pl.id.includes('1') ? 'ElZfdU54Cp8' : (pl.id.includes('2') ? 'orYf6VDtj_k' : (pl.id.includes('3') ? '4uLBiZVSGH4' : (pl.id.includes('4') ? 'RLzC55ai0eo' : '7CdpHATpXXU'))),
                provider: 'youtube',
                title: pl.title,
                artist: pl.subtitle,
                album: pl.title,
                albumArt: pl.image,
                audioUrl: pl.audioUrl,
                duration: 220,
                playbackType: 'full'
              })}
              className="group cursor-pointer flex flex-col gap-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 shadow-xl glass-card-hover">
                <img src={pl.image} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">{pl.title}</h4>
                <span className="text-[10px] text-white/50 truncate">{pl.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Best New Songs (4 Columns x 4 Rows = 16 Tracks) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition">
            <span>Best New Songs</span> <ChevronRight className="w-4 h-4 text-white/60" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {BOLLYWOOD_BEST_NEW_SONGS.map((song) => {
            const isCurrentPlaying = (activeTrack?.canonicalTrackId || activeTrack?.id) === (song.canonicalTrackId || song.id) && isPlayingAudio;

            return (
              <div
                key={song.id}
                onClick={() => handlePlayBollyTrack(song)}
                className={`flex items-center justify-between p-2 rounded-2xl border transition duration-200 cursor-pointer group ${
                  isCurrentPlaying
                    ? 'bg-emerald-950/30 border-emerald-400/80 shadow-md'
                    : 'bg-white/5 border-white/10 hover:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <img src={song.albumArt} alt={song.title} className="w-11 h-11 rounded-xl object-cover shadow-md flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-amber-300 transition">
                      {song.title}
                    </h4>
                    <span className="text-[10px] text-white/60 truncate leading-tight mt-0.5">
                      {song.artist}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-white/50 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlayBollyTrack(song); }}
                    className="p-1.5 rounded-full hover:text-emerald-400 hover:bg-white/10 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1.5 rounded-full hover:text-white hover:bg-white/10 transition"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. New Releases Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition">
            <span>New Releases</span> <ChevronRight className="w-4 h-4 text-white/60" />
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {BOLLYWOOD_NEW_RELEASES.map((rel) => (
            <div
              key={rel.id}
              onClick={() => handlePlayBollyTrack({
                id: rel.id,
                title: rel.title,
                artist: rel.artist,
                album: rel.title,
                albumArt: rel.image,
                audioUrl: rel.audioUrl
              })}
              className="group cursor-pointer flex flex-col gap-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 shadow-xl glass-card-hover">
                <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">{rel.title}</h4>
                <span className="text-[10px] text-white/50 truncate">{rel.artist}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Artist Playlists */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition">
            <span>Artist Playlists</span> <ChevronRight className="w-4 h-4 text-white/60" />
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {BOLLYWOOD_ARTIST_PLAYLISTS.map((artPl) => (
            <div
              key={artPl.id}
              onClick={() => handlePlayBollyTrack({
                id: artPl.id,
                title: artPl.title,
                artist: artPl.subtitle,
                album: artPl.title,
                albumArt: artPl.image,
                audioUrl: artPl.audioUrl
              })}
              className="group cursor-pointer flex flex-col gap-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 shadow-xl glass-card-hover">
                <img src={artPl.image} alt={artPl.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">{artPl.title}</h4>
                <span className="text-[10px] text-white/50 truncate">{artPl.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Essential Albums */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition">
            <span>Essential Albums</span> <ChevronRight className="w-4 h-4 text-white/60" />
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {BOLLYWOOD_ESSENTIAL_ALBUMS.map((alb) => (
            <div
              key={alb.id}
              onClick={() => handlePlayBollyTrack({
                id: alb.id,
                title: alb.title,
                artist: alb.artist,
                album: alb.title,
                albumArt: alb.image,
                audioUrl: alb.audioUrl
              })}
              className="group cursor-pointer flex flex-col gap-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 shadow-xl glass-card-hover">
                <img src={alb.image} alt={alb.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">{alb.title}</h4>
                <span className="text-[10px] text-white/50 truncate">{alb.artist}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Artists We Love Section */}
      <div className="space-y-3 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition">
            <span>Artists We Love</span> <ChevronRight className="w-4 h-4 text-white/60" />
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-3">
          {BOLLYWOOD_ARTISTS_WE_LOVE.map((artist) => (
            <div
              key={artist.id}
              className="flex flex-col items-center gap-2 cursor-pointer group text-center"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-xl group-hover:scale-110 group-hover:border-amber-400 transition duration-300">
                <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold text-white/80 group-hover:text-white truncate max-w-[90px] leading-tight">
                {artist.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
