export interface CategoryCard {
  id: string;
  title: string;
  color: string;
  gradient: string;
  image: string;
  genreTag: string;
}

export const BROWSE_CATEGORIES: CategoryCard[] = [
  {
    id: 'cat-1',
    title: 'Apple Music Radio',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ff0055 0%, #790029 100%)',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Radio'
  },
  {
    id: 'cat-2',
    title: 'Concerts',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #1e1b4b 100%)',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Live'
  },
  {
    id: 'cat-3',
    title: 'Apple Music Live',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0f172a 100%)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Live'
  },
  {
    id: 'cat-4',
    title: 'Bollywood',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #4c1d95 100%)',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-5',
    title: 'Pop',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #881337 100%)',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-6',
    title: 'Charts',
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #65a30d 0%, #14532d 100%)',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-7',
    title: 'Sing',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #fb7185 0%, #be123c 100%)',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-8',
    title: 'Punjabi',
    color: '#c084fc',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #581c87 100%)',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-9',
    title: 'Hip-Hop/Rap',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Hip-Hop/Rap'
  },
  {
    id: 'cat-10',
    title: 'Live Music',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Soundtrack'
  },
  {
    id: 'cat-11',
    title: 'Tamil',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-12',
    title: 'Kids',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-13',
    title: 'Family',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-14',
    title: 'Up Next',
    color: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-15',
    title: 'Telugu',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #3b0764 100%)',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-16',
    title: 'Hey Siri, Play...',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #164e63 100%)',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-17',
    title: 'Rock',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Rock'
  },
  {
    id: 'cat-18',
    title: 'Indian Independent',
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-19',
    title: 'DJ Mixes',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-20',
    title: 'Dance',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #083344 100%)',
    image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-21',
    title: 'K-Pop',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #881337 100%)',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-22',
    title: 'Love',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #db2777 0%, #831843 100%)',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    genreTag: 'R&B/Soul'
  },
  {
    id: 'cat-23',
    title: 'Heartbreak',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #2e1065 100%)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    genreTag: 'R&B/Soul'
  },
  {
    id: 'cat-24',
    title: 'Kannada',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #581c87 100%)',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  },
  {
    id: 'cat-25',
    title: 'Alternative',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #ca8a04 0%, #713f12 100%)',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    genreTag: 'Pop'
  }
];
