/* ==========================================================================
   Tsuki — Page Recherche (AnimeDoc + débounce + fallback)
   ========================================================================== */

export class SearchPage {
  constructor({ router, anilist, animedoc, ui, storage } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.ui = ui;
    this.storage = storage;
    this.element = null;
    this.timer = null;
    this.query = '';
    this.page = 1;
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page search-page';
    section.innerHTML = `
      <header class="page-header">
        <h1>Recherche</h1>
        <p class="page-subtitle">Trouvez un anime par titre.</p>
      </header>

      <div class="search-toolbar">
        <input type="search" id="search-input" placeholder="Ex: Naruto, Attack on Titan…" autocomplete="off" results="0" spellcheck="false">
        <button id="search-btn" class="btn btn-primary">Chercher</button>
      </div>

      <div id="search-info" class="search-info" aria-live="polite"></div>
      <div id="search-results" class="grid"></div>
      <div id="search-pagination" class="pagination"></div>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    const input = this.element.querySelector('#search-input');
    const btn = this.element.querySelector('#search-btn');

    const hash = window.location.hash;
    const hashMatch = hash.match(/[?&]q=([^&]+)/);
    if (hashMatch) {
      input.value = decodeURIComponent(hashMatch[1]);
      this.query = decodeURIComponent(hashMatch[1]);
      this.page = 1;
      await this.load();
    }

    btn.onclick = () => this._doSearch(input.value);
    input.addEventListener('input', (e) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this._doSearch(e.target.value), 300);
    });
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this._doSearch(input.value); });
  }

  _doSearch(q) {
    this.query = (q || '').trim();
    this.page = 1;
    this.load();
    this.router.navigate(`/recherche?q=${encodeURIComponent(this.query)}`);
  }

  async load() {
    const container = this.element.querySelector('#search-results');
    const info = this.element.querySelector('#search-info');
    const pagination = this.element.querySelector('#search-pagination');

    container.innerHTML = '';
    if (this.query) container.appendChild(this.ui.renderSkeleton(8));
    pagination.innerHTML = '';

    if (!this.query) {
      container.innerHTML = '';
      info.textContent = 'Tapez un titre pour commencer la recherche.';
      return;
    }

    try {
      const data = await this._fetchSearch();
      container.innerHTML = '';
      info.textContent = `Résultats pour "${this.ui.escapeHtml(this.query)}"`;
      const results = data.results || [];
      if (results.length === 0) {
        container.appendChild(this.ui.renderEmpty(`Aucun anime trouvé pour "${this.query}".`));
        return;
      }
      results.forEach((m) => {
        const card = this.ui.renderCard(m, {
          clickable: true, showFav: true, isFavorite: this.storage.isFavorite(m.id),
        });
        card._onClick = (media) => this.router.navigate(this.router.routes.detail(media.id));
        card.querySelector('.anime-fav')._onToggle = (id) => {
          const added = this.storage.toggleFavorite(id);
          const btn = card.querySelector('.anime-fav');
          btn.textContent = added ? '★' : '☆';
          this.ui.toast(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
        };
        container.appendChild(card);
      });
      this._renderPagination(pagination, data.pageInfo);
    } catch (e) {
      console.error(e);
      container.innerHTML = '';
      container.appendChild(this.ui.renderEmpty('Erreur de recherche.', 'error'));
      this.ui.toast('Erreur de recherche', 'error');
    }
  }

  async _fetchSearch() {
    if (this.animedoc?.hasKey?.()) {
      try {
        const data = await this.animedoc.search(this.query, { page: this.page, perPage: 20 });
        return this._normalizeAnimedoc(data);
      } catch (e) {
        console.warn('AnimeDoc indisponible, fallback AniList', e);
      }
    }
    try {
      return await this.anilist.searchMedia({ search: this.query, page: this.page, perPage: 20 });
    } catch (e) {
      const { getDemoAnimes } = await import('../demo.js');
      return getDemoAnimes({ page: this.page, perPage: 20 });
    }
  }

  _normalizeAnimedoc(data) {
    const results = [];
    const rows = data?.rows || data?.sections || data?.items || data?.results || [];
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
    if (results.length === 0 && Array.isArray(data)) {
      data.forEach((item) => {
        results.push({
          id: String(item.id), title: item.title, coverImage: item.coverImage,
          averageScore: item.score, format: item.type, year: item.year,
          genres: item.genres || [], source: 'animedoc',
        });
      });
    }
    return {
      pageInfo: { total: results.length, perPage: 20, currentPage: 1, lastPage: 1, hasNextPage: false },
      results,
    };
  }

  _renderPagination(container, pageInfo) {
    const { currentPage = 1, lastPage = 1, hasNextPage = false } = pageInfo;
    container.innerHTML = '';
    if (lastPage <= 1) return;
    const prev = document.createElement('button');
    prev.className = 'btn pag-btn'; prev.textContent = 'Précédent';
    prev.disabled = currentPage <= 1;
    prev.onclick = () => { if (currentPage > 1) { this.page--; this.load(); } };
    const next = document.createElement('button');
    next.className = 'btn pag-btn'; next.textContent = 'Suivant';
    next.disabled = !hasNextPage;
    next.onclick = () => { if (hasNextPage) { this.page++; this.load(); } };
    const info = document.createElement('span');
    info.className = 'page-info'; info.textContent = `Page ${currentPage} / ${lastPage}`;
    container.appendChild(prev); container.appendChild(info); container.appendChild(next);
  }
}
