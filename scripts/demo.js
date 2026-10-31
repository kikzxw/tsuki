/* ==========================================================================
   Tsuki — Données de démo (fallback si AniList indisponible)
   ========================================================================== */

export const DEMO_ANIMES = [
  {
    id: '16498', title: "L'Attaque des Titans", titleRomaji: 'Shingeki no Kyojin',
    format: 'TV', status: 'FINISHED', year: 2013, episodes: 25, duration: 24,
    averageScore: 85, popularity: 9500,
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-buvcRTBx4NSm.jpg',
    description: 'L\'humanité retranchée derrière des murs face aux Titans.',
    genres: ['Action', 'Drame', 'Fantasy', 'Horreur'],
    studios: ['Wit Studio', 'MAPPA'],
    source: 'demo',
  },
  {
    id: '101922', title: 'Demon Slayer', titleRomaji: 'Kimetsu no Yaiba',
    format: 'TV', status: 'RELEASING', year: 2019, episodes: 26, duration: 24,
    averageScore: 82, popularity: 9200,
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx101922-WBsBl0ClmgYL.jpg',
    description: 'Tanjiro devient chasseur de démons pour sauver sa sœur.',
    genres: ['Action', 'Fantasy', 'Aventure'],
    studios: ['ufotable'],
    source: 'demo',
  },
  {
    id: '113415', title: 'Jujutsu Kaisen',
    format: 'TV', status: 'RELEASING', year: 2020, episodes: 24, duration: 24,
    averageScore: 84, popularity: 9000,
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx113415-LHBAeoZDIsnF.jpg',
    description: 'Yuji Itadori rejoint une école de sorciers de jiu-jitsu.',
    genres: ['Action', 'Surnaturel', 'École'],
    studios: ['MAPPA'],
    source: 'demo',
  },
  {
    id: '21', title: 'Cowboy Bebop',
    format: 'TV', status: 'FINISHED', year: 1998, episodes: 26, duration: 24,
    averageScore: 86, popularity: 8500,
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-l56x7meSch9s.jpg',
    description: 'Des chasseurs de primes parcourent l\'espace en 2071.',
    genres: ['Aventure', 'Comédie', 'Drame', 'Science-Fiction'],
    studios: ['Sunrise'],
    source: 'demo',
  },
  {
    id: '28877', title: 'Naruto Shippuden',
    format: 'TV', status: 'FINISHED', year: 2007, episodes: 500, duration: 24,
    averageScore: 81, popularity: 8800,
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx28877-1KDQF3fY37Jf.jpg',
    description: 'Naruto Uzumaki poursuit son quête pour devenir Hokage.',
    genres: ['Action', 'Aventure', 'Arts martiaux'],
    studios: ['Pierrot'],
    source: 'demo',
  },
  {
    id: '30462', title: 'One Piece',
    format: 'TV', status: 'RELEASING', year: 1999, episodes: 1000, duration: 24,
    averageScore: 83, popularity: 9100,
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx30462-3dgooS3QRAyE.jpg',
    description: 'Luffy et son équipage recherchent le légendaire One Piece.',
    genres: ['Action', 'Aventure', 'Comédie'],
    studios: ['Toei Animation'],
    source: 'demo',
  },
  {
    id: '9752', title: 'Fullmetal Alchemist: Brotherhood',
    format: 'TV', status: 'FINISHED', year: 2009, episodes: 64, duration: 24,
    averageScore: 91, popularity: 8700,
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx9752-5SdI1lz7y6DQ.jpg',
    description: 'Deux frères alchimistes cherchent la pierre philosophale.',
    genres: ['Action', 'Aventure', 'Drame', 'Fantasy'],
    studios: ['Bones'],
    source: 'demo',
  },
  {
    id: '9753', title: 'Steins;Gate',
    format: 'TV', status: 'FINISHED', year: 2011, episodes: 24, duration: 24,
    averageScore: 89, popularity: 8400,
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx9753-5SdI1lz7y6DQ.jpg',
    description: 'Un groupe d\'amis découvre comment envoyer des messages dans le passé.',
    genres: ['Science-Fiction', 'Thriller', 'Mystère'],
    studios: ['White Fox'],
    source: 'demo',
  },
];

export const DEMO_GENRES = ['Action', 'Aventure', 'Comédie', 'Drame', 'Fantasy', 'Science-Fiction', 'Romance', 'Mystère', 'Horreur', 'Thriller'];

export function getDemoAnime(id) {
  return DEMO_ANIMES.find((a) => a.id === String(id)) || null;
}

export function getDemoAnimes({ page = 1, perPage = 20, genre = null } = {}) {
  let list = [...DEMO_ANIMES];
  if (genre) list = list.filter((a) => a.genres.includes(genre));
  const total = list.length;
  const start = (page - 1) * perPage;
  const results = list.slice(start, start + perPage);
  return {
    pageInfo: { total, perPage, currentPage: page, lastPage: Math.ceil(total / perPage), hasNextPage: start + perPage < total },
    results,
  };
}
