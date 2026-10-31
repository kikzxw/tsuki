/* ==========================================================================
   Tsuki — Configuration centrale
   ========================================================================== */

export const config = {
  // Nom du site
  siteName: 'Sakura',
  siteTagline: 'Anime Library',

  // --- API METADONNEES ---
  // AniList (GraphQL, gratuit, sans cle, CORS ouvert) — moteur principal anime
  anilist: {
    baseURL: 'https://graphql.anilist.co',
    perPage: 20,
  },

  // TMDB (optionnel — necessite une cle API, saisir ci-dessous si vous en avez une)
  tmdb: {
    baseURL: 'https://api.themoviedb.org/3',
    imageBase: 'https://image.tmdb.org/t/p/',
    apiKey: '', // laisser vide pour utiliser uniquement AniList
    language: 'fr-FR',
  },

  // --- API PRINCIPALE : AnimeDoc ---
  // La clé est saisie par l'utilisateur dans Paramètres et reste dans son navigateur.
  animedoc: {
    baseURL: 'https://api.animedoc.cloud',
    apiKey: '',
    timeout: 15000,
  },

  // --- API LECTURE (fallback) ---
  // Frembed (gratuit, sans cle, CORS ouvert) — lecteurs et disponibilite
  frembed: {
    baseURL: 'https://frembed.uno',
    checkMovie: function(id) { return '/api/public/v1/movies/check?id=' + id; },
    getMovie: function(id) { return '/api/public/v1/movies/' + id; },
    checkTV: function(id, season, episode) { return '/api/public/v1/tv/check?id=' + id + '&sa=' + season + '&epi=' + episode; },
    getTV: function(id, season, episode) { return '/api/public/v1/tv/' + id + '?sa=' + season + '&epi=' + episode; },
    getAnime: function(id) { return '/api/public/v1/anime/' + id; },
    getDomain: '/api/domain',
    embedMovie: function(id) { return 'https://frembed.uno/embed/movie/' + id; },
    embedSerie: function(id, season, episode) { return 'https://frembed.uno/embed/serie/' + id + '?sa=' + season + '&epi=' + episode; },
  },

  // --- UI ---
  debounceMs: 300,
  fetchTimeoutMs: 12000,
  cacheTTL: 5 * 60 * 1000, // 5 minutes

  // Cles localStorage
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
    detail: function(id) { return '/anime/' + id; },
    player: '/lecteur',
    favorites: '/favoris',
    about: '/a-propos',
    privacy: '/confidentialite',
    terms: '/conditions',
    settings: '/parametres',
  },
};
