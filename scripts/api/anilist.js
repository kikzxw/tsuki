/* ==========================================================================
   Tsuki — Client API AniList (GraphQL)
   Gratuit, sans clé, CORS ouvert. Métadonnées complètes : titres, synopsis,
   notes, genres, studios, personnages, staff, épisodes, trailers, etc.
   ========================================================================== */

export class AniListAPI {
  constructor({ baseURL = 'https://graphql.anilist.co', perPage = 20, cache, timeout = 12000 } = {}) {
    this.baseURL = baseURL;
    this.perPage = perPage;
    this.cache = cache;
    this.timeout = timeout;
  }

  // --- Requête GraphQL générique ---
  async _query(query, variables = {}) {
    const cacheKey = JSON.stringify({ query, variables });
    const cached = this.cache.get('anilist', cacheKey);
    if (cached) return cached;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
      const json = await res.json();

      if (json.errors) {
        console.warn('AniList GraphQL errors:', json.errors);
      }

      const data = json.data || null;
      this.cache.set('anilist', data, cacheKey);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Normalisation d'un média AniList vers le format interne Tsuki ---
  _normalizeMedia(m) {
    if (!m) return null;
    const plainText = (value) => String(value || '')
      .replace(/<br\s*\/?\s*>/gi, '\n\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+\n/g, '\n')
      .trim();
    const characterRows = m.characters?.edges || m.characters?.nodes || [];
    const staffRows = m.staff?.edges || m.staff?.nodes || [];
    return {
      id: String(m.id),
      idMal: m.idMal || null,
      title: m.title?.userPreferred || m.title?.romaji || m.title?.english || 'Sans titre',
      titleRomaji: m.title?.romaji || null,
      titleEnglish: m.title?.english || null,
      titleNative: m.title?.native || null,
      description: plainText(m.description) || null,
      format: m.format || null, // TV, MOVIE, OVA, ONA, SPECIAL, MUSIC
      status: m.status || null, // FINISHED, RELEASING, NOT_YET_RELEASED, CANCELLED, HIATUS
      episodes: m.episodes || null,
      duration: m.duration || null, // minutes
      averageScore: m.averageScore || null,
      popularity: m.popularity || 0,
      coverImage: m.coverImage?.large || null,
      coverImageMedium: m.coverImage?.medium || null,
      bannerImage: m.bannerImage || null,
      trailer: m.trailer ? { id: m.trailer.id, site: m.trailer.site } : null,
      genres: m.genres || [],
      studios: (m.studios?.nodes || []).map((s) => s.name),
      characters: characterRows.map((edge) => {
        const c = edge.node || edge;
        return {
        id: String(c.id),
        name: c.name?.full || c.name?.first || 'Personnage',
        image: c.image?.large || null,
        role: edge.role || c.role || null,
      }; }),
      staff: staffRows.map((edge) => {
        const s = edge.node || edge;
        return {
        id: String(s.id),
        name: s.name?.full || 'Staff',
        role: edge.role || s.role || null,
        image: s.image?.large || null,
      }; }),
      startDate: m.startDate ? `${m.startDate.year || ''}-${String(m.startDate.month || 1).padStart(2,'0')}-${String(m.startDate.day || 1).padStart(2,'0')}` : null,
      endDate: m.endDate ? `${m.endDate.year || ''}-${String(m.endDate.month || 1).padStart(2,'0')}-${String(m.endDate.day || 1).padStart(2,'0')}` : null,
      season: m.season || null,
      seasonYear: m.seasonYear || null,
      synonyms: m.synonyms || [],
      isAdult: m.isAdult || false,
      externalLinks: m.externalLinks || [],
      source: 'anilist',
    };
  }

  // --- Recherche / liste de médias ---
  async searchMedia({
    search = '',
    page = 1,
    perPage = this.perPage,
    sort = 'POPULARITY_DESC',
    genre = null,
    format = null,
    status = null,
    season = null,
    seasonYear = null,
  } = {}) {
    const query = `
      query ($search: String, $page: Int, $perPage: Int, $sort: [MediaSort], $genre: String, $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $seasonYear: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total perPage currentPage lastPage hasNextPage }
          media(
            search: $search
            type: ANIME
            sort: $sort
            genre: $genre
            format: $format
            status: $status
            season: $season
            seasonYear: $seasonYear
          ) {
            id idMal title { romaji english native userPreferred }
            description(asHtml: false)
            format status episodes duration averageScore popularity
            coverImage { large medium }
            bannerImage
            trailer { id site }
            genres studios { nodes { name } }
            startDate { year month day } endDate { year month day }
            season seasonYear synonyms isAdult
          }
        }
      }
    `;
    const data = await this._query(query, {
      search: search || undefined,
      page, perPage, sort,
      genre: genre || undefined,
      format: format || undefined,
      status: status || undefined,
      season: season || undefined,
      seasonYear: seasonYear || undefined,
    });

    const pageData = data?.Page || { pageInfo: {}, media: [] };
    return {
      pageInfo: pageData.pageInfo || {},
      results: (pageData.media || []).map((m) => this._normalizeMedia(m)),
    };
  }

  // --- Détail complet d'un anime par ID ---
  async getMedia(id) {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id idMal title { romaji english native userPreferred }
          description(asHtml: false) format status episodes duration
          averageScore popularity
          coverImage { large medium extraLarge }
          bannerImage
          trailer { id site }
          genres studios { nodes { name } }
          characters { edges { role node { id name { full } image { large } } } }
          staff { edges { role node { id name { full } image { large } primaryOccupations } } }
          startDate { year month day } endDate { year month day }
          season seasonYear synonyms isAdult
          relations { edges { node { id title { romaji english } type } relationType } }
          externalLinks { site url }
        }
      }
    `;
    const data = await this._query(query, { id: parseInt(id, 10) });
    return data?.Media ? this._normalizeMedia(data.Media) : null;
  }

  // --- Raccourcis ---
  async getTrending(page = 1) {
    return this.searchMedia({ page, perPage: this.perPage, sort: 'POPULARITY_DESC' });
  }
  async getTopRated(page = 1) {
    return this.searchMedia({ page, perPage: this.perPage, sort: 'SCORE_DESC' });
  }
  async getByGenre(genre, page = 1) {
    return this.searchMedia({ page, perPage: this.perPage, genre, sort: 'POPULARITY_DESC' });
  }
  async getBySeason(season, seasonYear, page = 1) {
    return this.searchMedia({ page, perPage: this.perPage, season, seasonYear, sort: 'POPULARITY_DESC' });
  }
}
