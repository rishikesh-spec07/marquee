import type { Song } from '../types';

export interface FeaturedBanner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  caption?: string;
  image: string;
  audioUrl: string;
}

export interface PlaylistCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  audioUrl: string;
}

export interface ReleaseCard {
  id: string;
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
}

export interface ArtistAvatar {
  id: string;
  name: string;
  image: string;
}

export const BOLLYWOOD_FEATURED_BANNERS: FeaturedBanner[] = [
  {
    id: 'bolly-feat-1',
    tag: 'ADD TO YOUR LIBRARY',
    title: 'Bollywood Throwback',
    subtitle: 'Apple Music Bollywood',
    caption: 'Revisit classic songs from a lifetime of movies.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'bolly-feat-2',
    tag: 'NEW ALBUM',
    title: 'Operation Safed Sagar: The Untold Story',
    subtitle: 'Anurag Saikia • Spatial Audio with Dolby Atmos',
    caption: 'The battle story of the Kargil War.',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'bolly-feat-3',
    tag: 'UPDATED PLAYLIST',
    title: 'Bollywood Hits',
    subtitle: 'Apple Music Bollywood',
    caption: 'A.R. Rahman tops Bollywood Hits this week with his composition "Tabassum."',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

export const BOLLYWOOD_PLAYLISTS: PlaylistCard[] = [
  {
    id: 'bolly-pl-1',
    title: 'Breaking Bollywood',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'bolly-pl-2',
    title: 'Bollywood Romance Videos',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'bolly-pl-3',
    title: 'Bollywood Chill',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 'bolly-pl-4',
    title: 'Bollywood Throwback',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'bolly-pl-5',
    title: 'Ultimate Bollywood',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 'bolly-pl-6',
    title: 'Bollywood Rewind',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  }
];

export const BOLLYWOOD_BEST_NEW_SONGS: Song[] = [
  {
    id: 'bolly-song-1',
    canonicalTrackId: 'youtube:y9mJNwPly44',
    providerTrackId: 'y9mJNwPly44',
    provider: 'youtube',
    title: 'Darmiyaan',
    artist: 'Rekha Bhardwaj, Raghav Kaushik',
    album: 'Darmiyaan Single',
    albumArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Bollywood',
    duration: 240,
    playbackType: 'full',
    lyrics: [
      { time: 0, text: "Darmiyaan... kuch toh naya hai" },
      { time: 6, text: "Dil ki baatein ab samajhna hai" },
      { time: 14, text: "Darmiyaan raahi mile yaaron..." },
      { time: 25, text: "♪ Melodic acoustic flute & violin harmonies ♪" }
    ]
  },
  {
    id: 'bolly-song-2',
    canonicalTrackId: 'youtube:0RxUcKE13ZI',
    providerTrackId: '0RxUcKE13ZI',
    provider: 'youtube',
    title: 'Bandhu 2.0 (From "Cocktail 2")',
    artist: 'Pritam, Kavita Seth, Neeraj Shridhar',
    album: 'Cocktail 2 OST',
    albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Bollywood',
    duration: 220,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-3',
    canonicalTrackId: 'youtube:w-uBtXpgEGI',
    providerTrackId: 'w-uBtXpgEGI',
    provider: 'youtube',
    title: 'Ishq Mastana (From "Main Vaapsi")',
    artist: 'A.R. Rahman, Irshad Kamil',
    album: 'Main Vaapsi OST',
    albumArt: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'Bollywood',
    duration: 255,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-4',
    canonicalTrackId: 'youtube:6-60kFPNa6U',
    providerTrackId: '6-60kFPNa6U',
    provider: 'youtube',
    title: 'Ucha Lamba Kad Forever',
    artist: 'Anand Raj Anand, Vikram Montrose',
    album: 'Welcome Back OST',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    genre: 'Bollywood',
    duration: 230,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-5',
    canonicalTrackId: 'youtube:LX2zshAgECQ',
    providerTrackId: 'LX2zshAgECQ',
    provider: 'youtube',
    title: 'Aankhon Se Tune 2.0',
    artist: 'Lijo George, Dev Negi, Palak Muchhal',
    album: 'Bhai Tera Star Hai OST',
    albumArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    genre: 'Bollywood',
    duration: 215,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-6',
    canonicalTrackId: 'youtube:WPzCW8Ze_iI',
    providerTrackId: 'WPzCW8Ze_iI',
    provider: 'youtube',
    title: 'Tum Hi Se Pyaar',
    artist: 'Jubin Nautiyal, Payal Dev',
    album: 'Tum Hi Se Pyaar Single',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    genre: 'Bollywood',
    duration: 245,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-7',
    canonicalTrackId: 'youtube:gXT7KShqn8w',
    providerTrackId: 'gXT7KShqn8w',
    provider: 'youtube',
    title: 'Yeh Awarapan (From "Awarapan 2")',
    artist: 'Amaal Mallik, Arijit Singh',
    album: 'Awarapan 2 OST',
    albumArt: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    genre: 'Bollywood',
    duration: 235,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-8',
    canonicalTrackId: 'youtube:HVkBoM5sQIQ',
    providerTrackId: 'HVkBoM5sQIQ',
    provider: 'youtube',
    title: 'Rozaana',
    artist: 'Lisa Mishra, Neel Adhikari',
    album: 'Rozaana OST',
    albumArt: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    genre: 'Bollywood',
    duration: 250,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-9',
    canonicalTrackId: 'youtube:TsUS5ddz6cE',
    providerTrackId: 'TsUS5ddz6cE',
    provider: 'youtube',
    title: 'Tera Yaar Hoon Main Title Track',
    artist: 'Sachet Tandon, Payal Dev',
    album: 'Tera Yaar Hoon Main OST',
    albumArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    genre: 'Bollywood',
    duration: 260,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-10',
    canonicalTrackId: 'youtube:BNARONXQjYc',
    providerTrackId: 'BNARONXQjYc',
    provider: 'youtube',
    title: 'Tera Hua Sahiba',
    artist: 'Garvit - Priyansh, Garvit Soni',
    album: 'Tera Hua Sahiba Single',
    albumArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    genre: 'Bollywood',
    duration: 210,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-11',
    canonicalTrackId: 'youtube:m3sK2gP89k',
    providerTrackId: 'm3sK2gP89k',
    provider: 'youtube',
    title: 'Madhosh (From "Toxic")',
    artist: 'Tanishk Bagchi, Faheem Abdul',
    album: 'Toxic OST',
    albumArt: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    genre: 'Bollywood',
    duration: 225,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-12',
    canonicalTrackId: 'youtube:b3G8s5P99k',
    providerTrackId: 'b3G8s5P99k',
    provider: 'youtube',
    title: 'Ve Junoon (From "Awarapan 2")',
    artist: 'Mithoon, Sayeed Quadri',
    album: 'Awarapan 2 OST',
    albumArt: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    genre: 'Bollywood',
    duration: 240,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-13',
    canonicalTrackId: 'youtube:d4s9s28KkFk',
    providerTrackId: 'd4s9s28KkFk',
    provider: 'youtube',
    title: 'Kaafi Hai Na',
    artist: 'Garvit - Priyansh, Priyansh Srivastava',
    album: 'Kaafi Hai Na Single',
    albumArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    genre: 'Bollywood',
    duration: 205,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-14',
    canonicalTrackId: 'youtube:e2K4s9P88k',
    providerTrackId: 'e2K4s9P88k',
    provider: 'youtube',
    title: 'Bhai Tera Star Hai - Title Track',
    artist: 'Amit Trivedi, Kumaar',
    album: 'Bhai Tera Star Hai OST',
    albumArt: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
    genre: 'Bollywood',
    duration: 220,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-15',
    canonicalTrackId: 'youtube:f5Z7s28KkFk',
    providerTrackId: 'f5Z7s28KkFk',
    provider: 'youtube',
    title: 'Chatni',
    artist: 'Aditya Dev, Neelkamal Singh',
    album: 'Chatni Single',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
    genre: 'Bollywood',
    duration: 215,
    playbackType: 'full'
  },
  {
    id: 'bolly-song-16',
    canonicalTrackId: 'youtube:g6Z8s39KkFk',
    providerTrackId: 'g6Z8s39KkFk',
    provider: 'youtube',
    title: 'Nach Le Lalariya (From "Bhai Tera Star")',
    artist: 'Amit Trivedi, Kumaar, Sachet',
    album: 'Bhai Tera Star OST',
    albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
    genre: 'Bollywood',
    duration: 230,
    playbackType: 'full'
  }
];

export const BOLLYWOOD_NEW_RELEASES: ReleaseCard[] = [
  {
    id: 'rel-1',
    title: 'Musafir Cafe (Songs from Netflix Series)',
    artist: 'Garvit - Priyansh, Raghav Kaushik',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'rel-2',
    title: 'Bhai Tera Star Hai (Original Soundtrack)',
    artist: 'Amit Trivedi, Kumaar & Lijo George',
    image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'rel-3',
    title: 'Tera Yaar Hoon Main (Original Soundtrack)',
    artist: 'Aditya Dev, Payal Dev, Sachet Tandon',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'rel-4',
    title: 'Operation Safed Sagar (Untold Kargil War)',
    artist: 'Anurag Saikia',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'rel-5',
    title: 'Ikka (Original Motion Picture Soundtrack)',
    artist: 'Mithoon & Sayeed Quadri',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'rel-6',
    title: 'Dhamaal 4 (Original Motion Picture Soundtrack)',
    artist: 'Tanishk Bagchi, Guru Randhawa',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  }
];

export const BOLLYWOOD_ARTIST_PLAYLISTS: PlaylistCard[] = [
  {
    id: 'art-pl-1',
    title: 'Best of Ranveer Singh',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'art-pl-2',
    title: 'Sunidhi Chauhan: Love Songs',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 'art-pl-3',
    title: 'Udit Narayan Essentials',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: 'art-pl-4',
    title: 'R.D. Burman: Love Songs',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  {
    id: 'art-pl-5',
    title: 'Himesh Reshammiya Essentials',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'
  },
  {
    id: 'art-pl-6',
    title: 'Mahendra Kapoor Essentials',
    subtitle: 'Apple Music Bollywood',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
  }
];

export const BOLLYWOOD_ESSENTIAL_ALBUMS: ReleaseCard[] = [
  {
    id: 'ess-1',
    title: 'Satte Pe Satta (Original Soundtrack)',
    artist: 'R.D. Burman',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'
  },
  {
    id: 'ess-2',
    title: 'Jo Jeeta Wohi Sikandar (Original Soundtrack)',
    artist: 'Jatin-Lalit',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'
  },
  {
    id: 'ess-3',
    title: 'Shaan (Original Soundtrack)',
    artist: 'Various Artists',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'
  },
  {
    id: 'ess-4',
    title: 'Chennai Express (Original Soundtrack)',
    artist: 'Vishal & Shekhar',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'
  },
  {
    id: 'ess-5',
    title: 'Munnabhai MBBS (Original Soundtrack)',
    artist: 'Various Artists',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'ess-6',
    title: 'Rock On!! (Original Motion Picture Soundtrack)',
    artist: 'Shankar Ehsaan Loy',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'ess-7',
    title: 'Rangeela (Original Motion Picture Soundtrack)',
    artist: 'A.R. Rahman',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'ess-8',
    title: 'Taal (Original Motion Picture Soundtrack)',
    artist: 'A.R. Rahman',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'ess-9',
    title: 'Jab We Met (Original Motion Picture Soundtrack)',
    artist: 'Pritam & Sandesh Shandilya',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'ess-10',
    title: 'Rocky (Original Soundtrack)',
    artist: 'R.D. Burman',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 'ess-11',
    title: 'Roja (Original Motion Picture Soundtrack)',
    artist: 'A.R. Rahman',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'ess-12',
    title: 'Johny Mera Naam (Original Soundtrack)',
    artist: 'Kalyanji-Anandji',
    image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  }
];

export const BOLLYWOOD_ARTISTS_WE_LOVE: ArtistAvatar[] = [
  { id: 'art-1', name: 'Shalmali Kholgade', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-2', name: 'Khaiyyaam', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-3', name: 'Raftaar', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-4', name: 'Shamshad Begum', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-5', name: 'Dhvani Bhanushali', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-6', name: 'Piyush Mishra', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-7', name: 'Amaal Mallik', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-8', name: 'Himesh Reshammiya', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-9', name: 'Sachin-Jigar', image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80' },
  { id: 'art-10', name: 'Jubin Nautiyal', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' }
];
