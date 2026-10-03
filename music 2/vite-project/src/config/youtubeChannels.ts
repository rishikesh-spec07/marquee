// Curated YouTube Music Channels Configuration (youtubeChannels.ts)
// Channel IDs and Upload Playlist IDs for high-fidelity official music content

export interface YouTubeChannelConfig {
  id: string;
  name: string;
  uploadsPlaylistId: string;
  language: 'hindi' | 'english' | 'punjabi' | 'regional';
  genre: string;
  priority: number; // 1-10
}

/**
 * Helper to convert channel ID (UC...) to Uploads playlist ID (UU...)
 */
export function getUploadsPlaylistId(channelId: string): string {
  if (!channelId) return '';
  if (channelId.startsWith('UC')) {
    return 'UU' + channelId.slice(2);
  }
  return channelId;
}

export const CURATED_YOUTUBE_CHANNELS: YouTubeChannelConfig[] = [
  // --- Major Indian Music Labels (Hindi / Bollywood / Punjabi) ---
  {
    id: 'UCq-Fj5jknLsUf-MWSy4_brA',
    name: 'T-Series',
    uploadsPlaylistId: 'UUq-Fj5jknLsUf-MWSy4_brA',
    language: 'hindi',
    genre: 'Bollywood',
    priority: 10
  },
  {
    id: 'UC56gTxKC4xL8c9_1k1p1cCQ',
    name: 'Sony Music India',
    uploadsPlaylistId: 'UU56gTxKC4xL8c9_1k1p1cCQ',
    language: 'hindi',
    genre: 'Bollywood / Pop',
    priority: 10
  },
  {
    id: 'UCFFbwnve3yF62-tVXkTyHqg',
    name: 'Zee Music Company',
    uploadsPlaylistId: 'UUFFbwnve3yF62-tVXkTyHqg',
    language: 'hindi',
    genre: 'Bollywood',
    priority: 9
  },
  {
    id: 'UC-i2ELdcPqZ2I_Fj8u1f-wQ',
    name: 'Saregama Music',
    uploadsPlaylistId: 'UU-i2ELdcPqZ2I_Fj8u1f-wQ',
    language: 'hindi',
    genre: 'Retro / Ghazal / Hits',
    priority: 8
  },
  {
    id: 'UCbTLwN10NoCU4WDzLf1JMOA',
    name: 'YRF (Yash Raj Films)',
    uploadsPlaylistId: 'UUbTLwN10NoCU4WDzLf1JMOA',
    language: 'hindi',
    genre: 'Soundtracks',
    priority: 8
  },
  {
    id: 'UCn_L6h8Zhn9U0L28Yc44wkg',
    name: 'Tips Official',
    uploadsPlaylistId: 'UUn_L6h8Zhn9U0L28Yc44wkg',
    language: 'hindi',
    genre: 'Bollywood',
    priority: 7
  },
  {
    id: 'UCrCGm9N_6xvd75gqS4Yh9Lw',
    name: 'Speed Records',
    uploadsPlaylistId: 'UUrCGm9N_6xvd75gqS4Yh9Lw',
    language: 'punjabi',
    genre: 'Punjabi',
    priority: 8
  },
  {
    id: 'UCJ2r1413yLw9j3k_E5Q3r4w',
    name: 'Universal Music India',
    uploadsPlaylistId: 'UUJ2r1413yLw9j3k_E5Q3r4w',
    language: 'hindi',
    genre: 'Pop / Indie',
    priority: 7
  },
  {
    id: 'UCF_fDSgPpBQuh1MsUTg9mWQ',
    name: 'Warner Music India',
    uploadsPlaylistId: 'UUF_fDSgPpBQuh1MsUTg9mWQ',
    language: 'hindi',
    genre: 'Indie / Pop',
    priority: 7
  },

  // --- Major International / English Labels & VEVO Channels ---
  {
    id: 'UC0C-w0YjGpqDXGB8IHb662A',
    name: 'The Weeknd VEVO',
    uploadsPlaylistId: 'UU0C-w0YjGpqDXGB8IHb662A',
    language: 'english',
    genre: 'R&B / Pop',
    priority: 9
  },
  {
    id: 'UCpk33ud248y8E5dFfKjW-4w',
    name: 'Dua Lipa',
    uploadsPlaylistId: 'UUpk33ud248y8E5dFfKjW-4w',
    language: 'english',
    genre: 'Pop / Dance',
    priority: 9
  },
  {
    id: 'UC-9-kyTW8ZkZNDHQJ6FgpwQ',
    name: 'Music (YouTube Spotlight)',
    uploadsPlaylistId: 'UU-9-kyTW8ZkZNDHQJ6FgpwQ',
    language: 'english',
    genre: 'Global Hits',
    priority: 8
  },
  {
    id: 'UC2pmfLm7iq6Ov1UwYrWYkZA',
    name: 'Spinnin Records',
    uploadsPlaylistId: 'UU2pmfLm7iq6Ov1UwYrWYkZA',
    language: 'english',
    genre: 'Electronic / Dance',
    priority: 7
  },
  {
    id: 'UC0WP5P-ufpRfjbNrmOWwLBQ',
    name: 'Atlantic Records',
    uploadsPlaylistId: 'UU0WP5P-ufpRfjbNrmOWwLBQ',
    language: 'english',
    genre: 'Pop / Hip Hop',
    priority: 8
  }
];
