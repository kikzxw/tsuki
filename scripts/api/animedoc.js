/* ==========================================================================
   Tsuki — Client API AnimeDoc (https://www.animedoc.cloud/docs/)
   Requiert une clé API dans le header X-API-Key.
   Plan gratuit : 20 requêtes/jour, 10 requêtes/minute, pas de stream proxy.
   ========================================================================== */

export class AnimeDocAPI {
  constructor({ baseURL = 'https://api.animedoc.cloud', apiKey = '', cache, timeout = 15000 } = {}) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.cache = cache;
    this.timeout = timeout;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  hasKey() {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async _fetch(path, options = {}) {
    if (!this.hasKey()) {
      throw new Error('Clé API AnimeDoc manquante. Configurez-la dans les paramètres.');
    }

    const url = `${this.baseURL}${path}`;
    const cacheKey = `animedoc:${path}:${JSON.stringify(options.body || options.params || {})}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (res.status === 401) throw new Error('Clé API AnimeDoc invalide.');
      if (res.status === 429) throw new Error('Limite de requêtes atteinte (429). Réessayez plus tard.');
      if (!res.ok) throw new Error(`AnimeDoc HTTP ${res.status}`);

      const json = await res.json();
      this.cache.set(cacheKey, json);
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Home feed : banners + catalog rows ---
  async getHome() {
    return this._fetch('/api/v2/home');
  }

  // --- Trending ---
  async getTrending() {
    return this._fetch('/api/v2/trending');
  }

  // --- Browse : animation, movies, series ---
  async getBrowse(channel = 'animation', { sort = 'latest', genre = null, country = null, page = 1 } = {}) {
    const qs = new URLSearchParams({ sort, page });
    if (genre) qs.set('genre', genre);
    if (country) qs.set('country', country);
    return this._fetch(`/api/v2/browse/${channel}?${qs}`);
  }

  // --- Section : anime, movies, series, asian, bollywood, nollywood ---
  async getSection(section = 'anime', { page = 1 } = {}) {
    return this._fetch(`/api/v2/section/${section}?page=${page}`);
  }

  // --- Search suggestions (autocomplete) ---
  async getSuggestions(keyword) {
    return this._fetch('/api/v2/anime/search/suggestions', {
      method: 'POST',
      body: { keyword },
    });
  }

  // --- Full-text search ---
  async search(keyword, { page = 1, perPage = 20 } = {}) {
    return this._fetch('/api/v2/anime/search/', {
      method: 'POST',
      body: { keyword, page, perPage },
    });
  }

  // --- Details : full metadata + seasons + episode counts ---
  async getDetails(id) {
    return this._fetch(`/api/v2/anime/${id}/details`);
  }

  // --- Media sources : playable video URLs + subtitles ---
  async getMediaSources(id) {
    return this._fetch(`/api/v2/anime/${id}/media-sources`);
  }
}
