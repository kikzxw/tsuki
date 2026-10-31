/* ==========================================================================
   Tsuki — Client API Frembed
   Gratuit, sans clé, CORS ouvert. Fournit les lecteurs (iframe) et la
   disponibilité des titres (films, séries, animés) via ID TMDB/IMDb.
   ========================================================================== */

export class FrembedAPI {
  constructor({ baseURL = 'https://frembed.uno', cache, timeout = 12000 } = {}) {
    this.baseURL = baseURL;
    this.cache = cache;
    this.timeout = timeout;
  }

  async _fetch(path) {
    const url = `${this.baseURL}${path}`;
    const cached = this.cache.get('frembed', url);
    if (cached) return cached;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Frembed HTTP ${res.status}`);
      const json = await res.json();
      this.cache.set('frembed', json, url);
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  // Récupère le domaine actuel de Frembed (utile si le domaine change)
  async getDomain() {
    try {
      const data = await this._fetch('/api/domain');
      return data?.domain || this.baseURL.replace('https://', '');
    } catch (e) {
      console.warn('Impossible de récupérer le domaine Frembed', e);
      return this.baseURL.replace('https://', '');
    }
  }

  // Vérifier disponibilité d'un film
  async checkMovie(tmdbId) {
    return this._fetch(`/api/public/v1/movies/check?id=${tmdbId}`);
  }

  // Détail d'un film
  async getMovie(tmdbId) {
    return this._fetch(`/api/public/v1/movies/${tmdbId}`);
  }

  // Vérifier disponibilité d'un épisode (série/animé)
  async checkTV(tmdbId, season = 1, episode = 1) {
    return this._fetch(`/api/public/v1/tv/check?id=${tmdbId}&sa=${season}&epi=${episode}`);
  }

  // Détail d'une série/animé avec épisodes
  async getTV(tmdbId, season = 1, episode = 1) {
    return this._fetch(`/api/public/v1/tv/${tmdbId}?sa=${season}&epi=${episode}`);
  }

  // Générer l'URL d'embed (iframe) pour un film
  embedMovieUrl(tmdbId) {
    return `https://frembed.uno/embed/movie/${tmdbId}`;
  }

  // Générer l'URL d'embed (iframe) pour un épisode
  embedSerieUrl(tmdbId, season, episode) {
    return `https://frembed.uno/embed/serie/${tmdbId}?sa=${season}&epi=${episode}`;
  }

  // Déterminer si un anime (AniList) a un lien Frembed via son ID TMDB (externalLinks)
  // Retourne l'URL d'embed si disponible, null sinon
  async resolveEmbed(media) {
    // Cherche un ID TMDB dans les liens externes AniList
    const tmdbLink = (media.externalLinks || []).find((l) => l.site === 'TMDB');
    const tmdbId = tmdbLink ? tmdbLink.url.replace(/\D/g, '') : null;

    if (!tmdbId) return null;

    try {
      const isMovie = media.format === 'MOVIE';
      if (isMovie) {
        const check = await this.checkMovie(tmdbId);
        if (check?.total) return this.embedMovieUrl(tmdbId);
      } else {
        // Série / animé :'épisode 1 de la saison 1
        const check = await this.checkTV(tmdbId, 1, 1);
        if (check?.totalItems) return this.embedSerieUrl(tmdbId, 1, 1);
      }
    } catch (e) {
      console.warn('Frembed embed resolution failed', e);
    }
    return null;
  }
}
