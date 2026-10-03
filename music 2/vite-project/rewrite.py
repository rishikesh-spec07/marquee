import os

file_path = r"d:\Project\music 5\music 2\vite-project\src\components\MusicGrid.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to add ChevronDown, ArrowRight to the imports from lucide-react if they are not there
if 'ChevronDown' not in content:
    content = content.replace("Search, Grid, Disc, Mic, Play, Heart, Activity, Layout, Loader2", "Search, Grid, Disc, Mic, Play, Heart, Activity, Layout, Loader2, ChevronDown, ArrowRight")

# The basic structure is:
# return (
#   <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden relative w-full">
# We want to change this so it looks like SoundtrackExplorer
# Specifically, we want to add the hero section.

# Let's find the return statement
start_idx = content.find("return (")

before_return = content[:start_idx]
after_return = content[start_idx:]

# Before returning, let's calculate activePreview.
# Add these refs and activePreview
active_preview_code = """
  const catalogRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Default preview to the first filtered song
  const activePreview = activeTrack || (filteredSongs.length > 0 ? filteredSongs[0] : null);

"""

before_return = before_return + active_preview_code

new_after_return = """return (
    <div ref={containerRef} className="flex-1 overflow-y-auto -mx-6 -mb-6 -mt-[88px] relative custom-scrollbar scroll-smooth">
      {/* PAGE 1: FULL SCREEN CINEMATIC HERO COVER */}
      {activePreview && activeSubTab === 'grid' && (
        <section
          style={{ minHeight: 'calc(min(92vh, 940px))', height: 'calc(min(92vh, 940px))' }}
          className="relative w-full flex flex-col justify-between items-center text-center px-6 pt-[108px] pb-6 md:px-16 select-none shrink-0"
        >
          {/* Hero Ambient Cover Backdrop stretched across 100% of Page 1 */}
          {activePreview.albumArt && (
            <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
              <img
                key={activePreview.id}
                src={activePreview.albumArt}
                alt={activePreview.title || ''}
                className="w-full h-full object-cover object-center brightness-[0.6] transition-all duration-700 animate-in fade-in scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-black/25 to-black/85" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/85" />
            </div>
          )}

          {/* Invisible spacer to balance vertical flex centering */}
          <div className="w-full h-2" />

          {/* Centered Hero Content */}
          <div className="max-w-4xl flex flex-col items-center my-auto animate-in fade-in duration-300">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] text-center mb-3 leading-tight">
              {activePreview.title}
            </h1>

            <div className="flex items-center justify-center gap-3 text-sm md:text-base text-white/90 font-medium mb-3">
              <span className="font-semibold text-white/95">Song</span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5 font-bold text-white">
                {activePreview.artist}
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5 text-white/80">
                {activePreview.album}
              </span>
            </div>

            <p className="max-w-2xl text-center text-xs sm:text-sm md:text-base text-white/85 leading-relaxed font-normal mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] line-clamp-3 md:line-clamp-4">
              Enjoy this amazing track by {activePreview.artist}. Add it to your favorites and explore more music!
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handlePlayCard(activePreview)}
                className="px-8 py-3 rounded-xl bg-white text-black font-extrabold text-sm md:text-base flex items-center gap-2.5 hover:bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition cursor-pointer"
                title="Play Now"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Play Now</span>
              </button>

              <button
                onClick={() => handlePlayCard(activePreview)}
                className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-sm md:text-base flex items-center gap-2.5 shadow-xl hover:scale-105 active:scale-95 transition backdrop-blur-md cursor-pointer"
                title="Details"
              >
                <span>Details</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>

          <button
            onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition duration-300 group cursor-pointer pb-4 z-10"
            title="Explore titles below"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 group-hover:text-white/80 transition">
              Explore Titles
            </span>
            <ChevronDown className="w-4 h-4 animate-bounce text-amber-400/80 group-hover:text-amber-400" />
          </button>
        </section>
      )}

      {/* Grid section */}
      <section ref={catalogRef} className="px-6 md:px-8 py-8 relative z-10 bg-[#0c0d12]/80 backdrop-blur-md">
"""

# Let's replace the top div of original after_return
after_return = after_return.replace('<div className="flex-1 flex flex-col justify-between p-4 overflow-hidden relative w-full">', '')
after_return = after_return.replace('</div>\n  );\n};\n', '</section>\n    </div>\n  );\n};\n')

final_content = before_return + new_after_return + after_return

with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_content)
