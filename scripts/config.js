/* Shared public configuration. Credentials belong in Worker secrets, never here. */
export const config = Object.freeze({
  siteName: 'Tsuki',
  siteTagline: 'Anime Library',

  anilist: Object.freeze({
    baseURL: 'https://graphql.anilist.co',
    perPage: 20,
    timeout: 12_000,
  }),

  // Same-origin Worker route; the upstream credential is injected server-side.
  animedoc: Object.freeze({
    baseURL: '/api/catalog',
    timeout: 15_000,
  }),

  debounceMs: 350,
  cacheTTL: 5 * 60 * 1000,

  storageKeys: Object.freeze({
    theme: 'tsuki_theme',
    favorites: 'tsuki_favorites',
    history: 'tsuki_history',
    lists: 'tsuki_lists',
    media: 'tsuki_media',
    catalogueLayout: 'tsuki_catalog_layout',
  }),

  routes: Object.freeze({
    home: '/',
    discover: '/decouvrir',
    search: '/recherche',
    detail: (id) => `/anime/${encodeURIComponent(id)}`,
    player: '/lecteur',
    favorites: '/favoris',
    lists: '/listes',
    history: '/historique',
    about: '/a-propos',
    privacy: '/confidentialite',
    terms: '/conditions',
    settings: '/parametres',
  }),
});
