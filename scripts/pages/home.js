/* ==========================================================================
   Tsuki — Page d'accueil (AnimeDoc prioritaire, fallback AniList/Démo)
   ========================================================================== */

export class HomePage {
  constructor({ router, anilist, animedoc, ui, storage } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.ui = ui;
    this.storage = storage;
    this.element = null;
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page home-page';
    section.innerHTML = `
      <header class="page-header">
        <h1>À la une</h1>
        <p class="page-subtitle">Découvrez les animes les plus populaires du moment.</p>
      </header>

      <section class="home-section">
        <div class="section-row">
          <h2 class="section-title">Tendances</h2>
          <a href="#/decouvrir" class="see-all">Voir tout →</a>
        </div>
        <div id="home-trending" class="grid"></div>
      </section>

      <section class="home-section">
        <div class="section-row">
          <h2 class="section-title">Les mieux notés</h2>
          <a href="#/decouvrir?sort=score" class="see-all">Voir tout →</a>
        </div>
        <div id="home-top" class="grid"></div>
      </section>

      <section class="home-section">
        <div class="section-row">
          <h2 class="section-title">Par genre : Action</h2>
          <a href="#/decouvrir?genre=Action" class="see-all">Voir tout →</a>
        </div>
        <div id="home-genre" class="grid"></div>
      </section>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    await this._loadSection('home-trending', () => this._fetchTrending());
    await this._loadSection('home-top', () => this._fetchTopRated());
    await this._loadSection('home-genre', () => this._fetchGenre('Action'));
  }

  _useAnimedoc() {
    return this.animedoc?.hasKey?.() === true;
  }

  async _fetchTrending() {
    if (this._useAnimedoc()) {
      try {
        const data = await this.animedoc.getTrending();
        return this._normalizeAnimedocHome(data);
      } catch (e) {
        console.warn('AnimeDoc indisponible, fallback', e);
      }
    }
    try {
      return await this.anilist.getTrending(1);
    } catch (e) {
      const { getDemoAnimes } = await import('../demo.js');
      return getDemoAnimes({ page: 1, perPage: 20 });
    }
  }

  async _fetchTopRated() {
    if (this._useAnimedoc()) {
      try {
        const data = await this.animedoc.getHome();
        return this._normalizeAnimedocHome(data);
      } catch (e) {
        console.warn('AnimeDoc indisponible, fallback', e);
      }
    }
    try {
      return await this.anilist.getTopRated(1);
    } catch (e) {
      const { getDemoAnimes } = await import('../demo.js');
      return getDemoAnimes({ page: 1, perPage: 20 });
    }
  }

  async _fetchGenre(genre) {
    if (this._useAnimedoc()) {
      try {
        const data = await this.animedoc.getBrowse('animation', { genre });
        return this._normalizeAnimedocHome(data);
      } catch (e) {
        console.warn('AnimeDoc indisponible, fallback', e);
      }
    }
    try {
      return await this.anilist.getByGenre(genre, 1);
    } catch (e) {
      const { getDemoAnimes } = await import('../demo.js');
      return getDemoAnimes({ page: 1, perPage: 20, genre });
    }
  }

  // Normalise une réponse AnimeDoc vers le format interne { pageInfo, results[] }
  _normalizeAnimedocHome(data) {
    const results = [];
    const rows = data?.rows || data?.sections || [];
    rows.forEach((row) => {
      (row.items || row.animes || row.movies || []).forEach((item) => {
        results.push({
          id: String(item.id || item.slug || item.title),
          title: item.title || item.name || 'Sans titre',
          coverImage: item.coverImage || item.poster || item.image,
          averageScore: item.score || item.rating || null,
          format: item.type || 'TV',
          year: item.year || null,
          genres: item.genres || [],
          source: 'animedoc',
          ...item,
        });
      });
    });
    // Si pas de rows, essayer data directement
    if (results.length === 0 && Array.isArray(data)) {
      data.forEach((item) => {
        results.push({
          id: String(item.id),
          title: item.title,
          coverImage: item.coverImage,
          averageScore: item.score,
          format: item.type,
          year: item.year,
          genres: item.genres || [],
          source: 'animedoc',
        });
      });
    }
    return {
      pageInfo: { total: results.length, perPage: 20, currentPage: 1, lastPage: 1, hasNextPage: false },
      results,
    };
  }

  async _loadSection(containerId, loader) {
    const container = this.element.querySelector(`#${containerId}`);
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(this.ui.renderSkeleton(5));

    try {
      const data = await loader();
      container.innerHTML = '';
      const results = data.results || [];
      if (results.length === 0) {
        container.appendChild(this.ui.renderEmpty('Aucun résultat.'));
        return;
      }
      results.forEach((m) => {
        const card = this.ui.renderCard(m, {
          clickable: true,
          showFav: true,
          isFavorite: this.storage?.isFavorite(m.id) || false,
        });
        card._onClick = (media) => this.router.navigate(this.router.routes.detail(media.id));
        card.querySelector('.anime-fav')._onToggle = (id) => {
          const added = this.storage.toggleFavorite(id);
          const btn = card.querySelector('.anime-fav');
          btn.textContent = added ? '★' : '☆';
          btn.setAttribute('aria-label', added ? 'Retirer des favoris' : 'Ajouter aux favoris');
          this.ui.toast(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
        };
        container.appendChild(card);
      });
    } catch (e) {
      console.error(e);
      container.innerHTML = '';
      container.appendChild(this.ui.renderEmpty('Erreur de chargement.', 'error'));
      this.ui.toast('Erreur de chargement', 'error');
    }
  }
}
