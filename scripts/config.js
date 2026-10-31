/* ==========================================================================
   Tsuki — Configuration centrale
   ========================================================================== */

export const config = {
  // Nom du site
  siteName: 'Tsuki',
  siteTagline: 'Streaming d'animes complet',

  // --- API METADONNÉES ---
  // AniList (GraphQL, gratuit, sans clé, CORS ouvert) — moteur principal anime
  anilist: {
    baseURL: 'https://graphql.anilist.co',
    perPage: 20,
  },

  // TMDB (optionnel — nécessite une clé API, saisir ci-dessous si vous en avez une)
  tmdb: {
    baseURL: 'https://api.themoviedb.org/3',
    imageBase: 'https://image.tmdb.org/t/p/',
    apiKey: '', // laisser vide pour utiliser uniquement AniList
    language: 'fr-FR',
  },

  // --- API PRINCIPALE : AnimeDoc ---
  // Clé API configurée pour le déploiement sur tsuki.kikzxw.workers.dev
  // Peut être surchargée via localStorage (clé 'tsuki_animedoc_key') ou dans Paramètres.
  animedoc: {
    baseURL: 'https://api.animedoc.cloud',
    apiKey: 'ad_live_5XusuAeCaqy6tJPjbsSOuzj_a8uo4ru85nxCAancKwE',
    timeout: 15000,
  },

  // --- API LECTURE (fallback) ---
  // Frembed (gratuit, sans clé, CORS ouvert) — lecteurs et disponibilité
  frembed: {
    baseURL: 'https://frembed.uno',
    checkMovie: (id) => `/api/public/v1/movies/check?id=${id}`,
    getMovie: (id) => `/api/public/v1/movies/${id}`,
    checkTV: (id, season, episode) => `/api/public/v1/tv/check?id=${id}&sa=${season}&epi=${episode}`,
    getTV: (id, season, episode) => `/api/public/v1/tv/${id}?sa=${season}&epi=${episode}`,
    getAnime: (id) => `/api/public/v1/anime/${id}`,
    getDomain: '/api/domain',
    embedMovie: (id) => `https://frembed.uno/embed/movie/${id}`,
    embedSerie: (id, season, episode) => `https://frembed.uno/embed/serie/${id}?sa=${season}&epi=${episode}`,
  },

  // --- UI ---
  debounceMs: 300,
  fetchTimeoutMs: 12000,
  cacheTTL: 5 * 60 * 1000, // 5 minutes

  // Clés localStorage
  storageKeys: {
    theme: 'tsuki_theme',
    favorites: 'tsuki_favorites',
    history: 'tsuki_history',
    apiBase: 'tsuki_api_base',
    animedocKey: 'tsuki_animedoc_key',
  },

  // Routes
  routes: {
    home: '/',
    discover: '/decouvrir',
    search: '/recherche',
    detail: (id) => `/anime/${id}`,
    player: '/lecteur',
    favorites: '/favoris',
    about: '/a-propos',
    privacy: '/confidentialite',
    terms: '/conditions',
    settings: '/parametres',
  },
};
