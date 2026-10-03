import type { Song } from '../types';
import type { FeaturedBanner, PlaylistCard, ReleaseCard, ArtistAvatar } from './bollywoodData';

export interface RadioStationCard {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  gradient: string;
  audioUrl: string;
}

export const POP_FEATURED_BANNERS: FeaturedBanner[] = [
  {
    id: 'pop-feat-1',
    tag: 'UPDATED PLAYLIST',
    title: 'A-List Pop',
    subtitle: 'Apple Music Pop',
    caption: 'Sam Smith found their "Constant Companion". Listen now.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'pop-feat-2',
    tag: 'UPDATED PLAYLIST',
    title: "Today's Hits",
    subtitle: 'Apple Music Hits',
    caption: 'This week, Anirudh Ravichander\'s "Hangova" tops Today\'s Hits.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'pop-feat-3',
    tag: 'NEW ALBUM',
    title: 'petal',
    subtitle: 'Ariana Grande • Spatial Audio with Dolby Atmos',
    caption: 'The pop icon brings all the elements of her formidable artistry into balance.',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

export const POP_PLAYLISTS: PlaylistCard[] = [
  {
    id: 'pop-pl-1',
    title: 'Pop Latte',
    subtitle: 'Apple Music Pop',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'pop-pl-2',
    title: 'Global Pop',
    subtitle: 'Apple Music Pop',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'pop-pl-3',
    title: 'Sad Bangers',
    subtitle: 'Apple Music Pop',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 'pop-pl-4',
    title: 'Viral Remixed',
    subtitle: 'Apple Music',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'pop-pl-5',
    title: 'Viral Rewind',
    subtitle: 'Apple Music',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 'pop-pl-6',
    title: 'Puro Pop',
    subtitle: 'Apple Music Pop Latino',
    image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  }
];

export const POP_BEST_NEW_SONGS: Song[] = [
  {
    id: 'pop-song-1',
    canonicalTrackId: 'youtube:Mdi8Pty_-OU',
    providerTrackId: 'Mdi8Pty_-OU',
    provider: 'youtube',
    title: 'Constant Companion',
    artist: 'Sam Smith',
    album: 'Constant Companion Single',
    albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    genre: 'Pop',
    duration: 210,
    playbackType: 'full',
    lyrics: [
      { time: 0, text: "Found my constant companion in the dark..." },
      { time: 6, text: "Hold me close before the morning light" },
      { time: 14, text: "Every beat of my heart sings for you" }
    ]
  },
  {
    id: 'pop-song-2',
    canonicalTrackId: 'youtube:eVli-tstM5E',
    providerTrackId: 'eVli-tstM5E',
    provider: 'youtube',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Espresso Single',
    albumArt: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    genre: 'Pop',
    duration: 175,
    playbackType: 'full'
  },
  {
    id: 'pop-song-3',
    canonicalTrackId: 'youtube:G7KNmW9a75Y',
    providerTrackId: 'G7KNmW9a75Y',
    provider: 'youtube',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    albumArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    genre: 'Pop',
    duration: 200,
    playbackType: 'full'
  },
  {
    id: 'pop-song-4',
    canonicalTrackId: 'youtube:H5v3kku4y6Q',
    providerTrackId: 'H5v3kku4y6Q',
    provider: 'youtube',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: 'Harry\'s House',
    albumArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    genre: 'Pop',
    duration: 167,
    playbackType: 'full'
  },
  {
    id: 'pop-song-5',
    canonicalTrackId: 'youtube:TUVcZfQe-Kw',
    providerTrackId: 'TUVcZfQe-Kw',
    provider: 'youtube',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    albumArt: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
    genre: 'Pop',
    duration: 203,
    playbackType: 'full'
  },
  {
    id: 'pop-song-6',
    canonicalTrackId: 'youtube:kTJczUoc26U',
    providerTrackId: 'kTJczUoc26U',
    provider: 'youtube',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3',
    albumArt: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
    genre: 'Pop',
    duration: 141,
    playbackType: 'full'
  },
  {
    id: 'pop-song-7',
    canonicalTrackId: 'youtube:orJSJGHjBLI',
    providerTrackId: 'orJSJGHjBLI',
    provider: 'youtube',
    title: 'Bad Habits',
    artist: 'Ed Sheeran',
    album: '=',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    genre: 'Pop',
    duration: 231,
    playbackType: 'full'
  },
  {
    id: 'pop-song-8',
    canonicalTrackId: 'youtube:b1kbLwvqugk',
    providerTrackId: 'b1kbLwvqugk',
    provider: 'youtube',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    album: 'Midnights',
    albumArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    genre: 'Pop',
    duration: 200,
    playbackType: 'full'
  },
  {
    id: 'pop-song-9',
    canonicalTrackId: 'youtube:RlPNh_PBZb4',
    providerTrackId: 'RlPNh_PBZb4',
    provider: 'youtube',
    title: 'Vampire',
    artist: 'Olivia Rodrigo',
    album: 'GUTS',
    albumArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    genre: 'Pop',
    duration: 219,
    playbackType: 'full'
  },
  {
    id: 'pop-song-10',
    canonicalTrackId: 'youtube:ic8j13piAhQ',
    providerTrackId: 'ic8j13piAhQ',
    provider: 'youtube',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    album: 'Lover',
    albumArt: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    genre: 'Pop',
    duration: 178,
    playbackType: 'full'
  },
  {
    id: 'pop-song-11',
    canonicalTrackId: 'youtube:To4SWGZkEPk',
    providerTrackId: 'To4SWGZkEPk',
    provider: 'youtube',
    title: 'Greedy',
    artist: 'Tate McRae',
    album: 'THINK LATER',
    albumArt: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    genre: 'Pop',
    duration: 131,
    playbackType: 'full'
  },
  {
    id: 'pop-song-12',
    canonicalTrackId: 'youtube:XoiOOiuH8iI',
    providerTrackId: 'XoiOOiuH8iI',
    provider: 'youtube',
    title: 'Water',
    artist: 'Tyla',
    album: 'TYLA',
    albumArt: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    genre: 'Pop',
    duration: 200,
    playbackType: 'full'
  },
  {
    id: 'pop-song-13',
    canonicalTrackId: 'youtube:JGwWNGJdvx8',
    providerTrackId: 'JGwWNGJdvx8',
    provider: 'youtube',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    genre: 'Pop',
    duration: 233,
    playbackType: 'full'
  },
  {
    id: 'pop-song-14',
    canonicalTrackId: 'youtube:4NRXx6U8ABQ',
    providerTrackId: '4NRXx6U8ABQ',
    provider: 'youtube',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    albumArt: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
    genre: 'Pop',
    duration: 200,
    playbackType: 'full'
  },
  {
    id: 'pop-song-15',
    canonicalTrackId: 'youtube:34Na4j8AVgA',
    providerTrackId: '34Na4j8AVgA',
    provider: 'youtube',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    albumArt: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
    genre: 'Pop',
    duration: 230,
    playbackType: 'full'
  },
  {
    id: 'pop-song-16',
    canonicalTrackId: 'youtube:XXYlFuWEuKI',
    providerTrackId: 'XXYlFuWEuKI',
    provider: 'youtube',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    albumArt: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
    genre: 'Pop',
    duration: 215,
    playbackType: 'full'
  }
];

export const POP_RADIO_STATIONS: RadioStationCard[] = [
  {
    id: 'radio-1',
    title: 'Hits Station',
    subtitle: 'Apple Music Hits',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'radio-2',
    title: 'Pop Station',
    subtitle: 'Apple Music Pop',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #db2777 0%, #9d174d 100%)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'radio-3',
    title: 'Classic Hits Station',
    subtitle: 'Apple Music Hits',
    color: '#ca8a04',
    gradient: 'linear-gradient(135deg, #854d0e 0%, #713f12 100%)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'radio-4',
    title: 'Dance Pop Station',
    subtitle: 'Apple Music Dance',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'radio-5',
    title: 'K-Pop Station',
    subtitle: 'Apple Music K-Pop',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'radio-6',
    title: 'Latin Pop Station',
    subtitle: 'Apple Music Latin',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #881337 100%)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  }
];

export const POP_NEW_RELEASES: ReleaseCard[] = [
  {
    id: 'pop-rel-1',
    title: 'Hazel Eyes',
    artist: 'Sam Smith',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'pop-rel-2',
    title: 'THERAPY AT THE CLUB',
    artist: 'FLO',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 'pop-rel-3',
    title: 'Easier',
    artist: 'Joshua Bassett',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: 'pop-rel-4',
    title: 'THE SIN : BLISS - EP',
    artist: 'ENHYPEN',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  {
    id: 'pop-rel-5',
    title: 'Reborn',
    artist: 'Nate Sib',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'
  },
  {
    id: 'pop-rel-6',
    title: 'Young',
    artist: 'Dan + Shay',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
  }
];

export const POP_ESSENTIAL_ALBUMS: ReleaseCard[] = [
  {
    id: 'pop-ess-1',
    title: "1989 (Taylor's Version) [Deluxe]",
    artist: 'Taylor Swift',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'
  },
  {
    id: 'pop-ess-2',
    title: "Harry's House",
    artist: 'Harry Styles',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'
  },
  {
    id: 'pop-ess-3',
    title: 'SOUR (Video Version)',
    artist: 'Olivia Rodrigo',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'
  },
  {
    id: 'pop-ess-4',
    title: 'After Hours (Deluxe)',
    artist: 'The Weeknd',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/6e/bf/a66ebf79-5008-8948-b352-a790fc87446b/19UM1IM04638.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'pop-ess-5',
    title: 'ANTI (Deluxe)',
    artist: 'Rihanna',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'pop-ess-6',
    title: 'The Fame Monster (Deluxe Edition)',
    artist: 'Lady Gaga',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'pop-ess-7',
    title: 'Back To Black',
    artist: 'Amy Winehouse',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'pop-ess-8',
    title: 'Future Nostalgia',
    artist: 'Dua Lipa',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'pop-ess-9',
    title: 'Planet Her (Deluxe)',
    artist: 'Doja Cat',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 'pop-ess-10',
    title: 'Lemonade',
    artist: 'Beyoncé',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'pop-ess-11',
    title: 'Thriller',
    artist: 'Michael Jackson',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 'pop-ess-12',
    title: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
    artist: 'Billie Eilish',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  }
];

export const POP_ARTISTS_WE_LOVE: ArtistAvatar[] = [
  { id: 'pop-art-1', name: 'Olivia Rodrigo', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-2', name: 'Ariana Grande', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-3', name: 'Steve Lacy', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-4', name: 'Olivia Dean', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-5', name: 'Alex Warren', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-6', name: 'SIENNA SPIRO', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-7', name: 'KATSEYE', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-8', name: 'KAROL G', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-9', name: 'Bruno Mars', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
  { id: 'pop-art-10', name: 'Shakira', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' }
];
