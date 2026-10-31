/* ==========================================================================
   Tsuki — Page Découvrir (AnimeDoc + filtres + fallback)
   ========================================================================== */

export class DiscoverPage {
  constructor({ router, anilist, animedoc, ui, storage } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.ui = ui;
    this.storage = storage;
    this.element = null;
    this.filters = { sort: 'POPULARITY_DESC', genre: null, format: null, status: null, page: 1 };
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page discover-page';
    section.innerHTML = `
      <header class="page-header">
        <h1>Découvrir</h1>
        <p class="page-subtitle">Explorez le catalogue par genre, format et popularité.</p>
      </header>

      <div class="discover-toolbar">
        <div class="filter-group">
          <label class="filter-label">Trier par</label>
          <select id="disc-sort">
            <option value="POPULARITY_DESC">Popularité</option>
            <option value="SCORE_DESC">Mieux notés</option>
            <option value="TRENDING_DESC">Tendances</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Genre</label>
          <select id="disc-genre">
            <option value="">Tous</option>
            <option value="Action">Action</option>
            <option value="Aventure">Aventure</option>
            <option value="Comédie">Comédie</option>
            <option value="Drame">Drame</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Science-Fiction">Science-Fiction</option>
            <option value="Romance">Romance</option>
            <option value="Mystère">Mystère</option>
            <option value="Horreur">Horreur</option>
            <option value="Thriller">Thriller</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Format</label>
          <select id="disc-format">
            <option value="">Tous</option>
            <option value="TV">Série TV</option>
            <option value="MOVIE">Film</option>
            <option value="OVA">OVA</option>
            <option value="ONA">ONA</option>
          </select>
        </div>
        <button id="disc-refresh" class="btn btn-primary">Actualiser</button>
      </div>

      <div id="disc-info" class="disc-info" aria-live="polite"></div>
      <div id="disc-results" class="grid"></div>
      <div id="disc-pagination" class="pagination"></div>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    this._bindFilters();
    await this.load();
  }

  _bindFilters() {
    const el = (id) => this.element.querySelector(`#${id}`);
    el('disc-sort').value = this.filters.sort;
    el('disc-genre').value = this.filters.genre || '';
    el('disc-format').value = this.filters.format || '';

    el('disc-sort').onchange = () => { this.filters.sort = el('disc-sort').value; this.filters.page = 1; this.load(); };
    el('disc-genre').onchange = () => { this.filters.genre = el('disc-genre').value || null; this.filters.page = 1; this.load(); };
    el('disc-format').onchange = () => { this.filters.format = el('disc-format').value || null; this.filters.page = 1; this.load(); };
    el('disc-refresh').onclick = () => this.load();
  }

  async load() {
    const container = this.element.querySelector('#disc-results');
    const info = this.element.querySelector('#disc-info');
    const pagination = this.element.querySelector('#disc-pagination');

    container.innerHTML = '';
    container.appendChild(this.ui.renderSkeleton(8));
    pagination.innerHTML = '';

    try {
      const data = await this._fetchAnimes();
      container.innerHTML = '';
      const results = data.results || [];
      if (results.length === 0) {
        container.appendChild(this.ui.renderEmpty('Aucun anime trouvé avec ces filtres.'));
        info.textContent = '';
        return;
      }
      info.textContent = `${results.length} résultat(s) sur ${data.pageInfo.total || 0}`;

      results.forEach((m) => {
        const card = this.ui.renderCard(m, {
          clickable: true,
          showFav: true,
          isFavorite: this.storage.isFavorite(m.id),
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
      container.appendChild(this.ui.renderEmpty('Erreur de chargement.', 'error'));
      this.ui.toast('Erreur de chargement', 'error');
    }
  }

  async _fetchAnimes() {
    if (this.animedoc?.hasKey?.()) {
      try {
        const data = await this.animedoc.getBrowse('animation', {
          sort: this.filters.sort === 'POPULARITY_DESC' ? 'latest' : this.filters.sort === 'SCORE_DESC' ? 'top' : 'latest',
          genre: this.filters.genre,
          page: this.filters.page,
        });
        return this._normalizeAnimedoc(data);
      } catch (e) {
        console.warn('AnimeDoc indisponible, fallback AniList', e);
      }
    }
    try {
      return await this.anilist.searchMedia({
        search: null, page: this.filters.page, perPage: 20,
        sort: this.filters.sort, genre: this.filters.genre, format: this.filters.format,
      });
    } catch (e) {
      const { getDemoAnimes } = await import('../demo.js');
      return getDemoAnimes({ page: this.filters.page, perPage: 20, genre: this.filters.genre });
    }
  }

  _normalizeAnimedoc(data) {
    const results = [];
    const rows = data?.rows || data?.sections || data?.items || [];
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
    prev.onclick = () => { if (currentPage > 1) { this.filters.page--; this.load(); } };
    const next = document.createElement('button');
    next.className = 'btn pag-btn'; next.textContent = 'Suivant';
    next.disabled = !hasNextPage;
    next.onclick = () => { if (hasNextPage) { this.filters.page++; this.load(); } };
    const info = document.createElement('span');
    info.className = 'page-info'; info.textContent = `Page ${currentPage} / ${lastPage}`;
    container.appendChild(prev); container.appendChild(info); container.appendChild(next);
  }
}
