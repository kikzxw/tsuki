/* ==========================================================================
   Tsuki — Page Découvrir (catalogue démo embarqué en priorité)
   ========================================================================== */

export class DiscoverPage {
  constructor({ router, anilist, animedoc, ui, storage, config } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.ui = ui;
    this.storage = storage;
    this.config = config;
    this.element = null;
    this.requestId = 0;
    this.filters = { sort: 'popular', genre: null, format: null, status: null, page: 1 };
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
            <option value="popular">Popularité</option>
            <option value="score">Mieux notés</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Genre</label>
          <select id="disc-genre">
            <option value="">Tous</option>
            <option value="Action">Action</option>
            <option value="Adventure">Aventure</option>
            <option value="Comedy">Comédie</option>
            <option value="Drama">Drame</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Sci-Fi">Science-fiction</option>
            <option value="Romance">Romance</option>
            <option value="Mystery">Mystère</option>
            <option value="Horror">Horreur</option>
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
        <button id="disc-view" class="btn btn-outline" type="button" aria-pressed="false">Vue compacte</button>
      </div>

      <div id="disc-info" class="disc-info" aria-live="polite"></div>
      <div id="disc-results" class="grid"></div>
      <div id="disc-pagination" class="pagination"></div>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    const query = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (query.get('sort') === 'score') this.filters.sort = 'score';
    if (query.has('genre')) this.filters.genre = query.get('genre');
    if (query.has('format')) this.filters.format = query.get('format');
    this._bindFilters();
    const results = this.element.querySelector('#disc-results');
    const viewButton = this.element.querySelector('#disc-view');
    const compact = this.storage.getItem(this.config.storageKeys.catalogueLayout) === 'list';
    results.classList.toggle('list-layout', compact);
    viewButton.setAttribute('aria-pressed', String(compact));
    viewButton.textContent = compact ? 'Vue affiches' : 'Vue compacte';
    viewButton.onclick = () => {
      const list = results.classList.toggle('list-layout');
      this.storage.setItem(this.config.storageKeys.catalogueLayout, list ? 'list' : 'grid');
      viewButton.setAttribute('aria-pressed', String(list));
      viewButton.textContent = list ? 'Vue affiches' : 'Vue compacte';
    };
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
    const requestId = ++this.requestId;
    const container = this.element.querySelector('#disc-results');
    const info = this.element.querySelector('#disc-info');
    const pagination = this.element.querySelector('#disc-pagination');

    container.innerHTML = '';
    container.appendChild(this.ui.renderSkeleton(8));
    pagination.innerHTML = '';

    try {
      const data = await this._fetchAnimes();
      if (requestId !== this.requestId) return;
      container.innerHTML = '';
      const results = data.results || [];
      if (results.length === 0) {
        container.appendChild(this.ui.renderEmpty('Aucun anime trouvé avec ces filtres.'));
        info.textContent = '';
        return;
      }
      info.textContent = `${results.length} résultat(s) sur ${data.pageInfo.total || 0}`;

      results.forEach((m) => {
        this.storage.saveMedia(m);
        const card = this.ui.renderCard(m, {
          clickable: true,
          showFav: true,
          isFavorite: this.storage.isFavorite(m.id),
        });
        card._onClick = (media) => this.router.navigate(this.config.routes.detail(media.id));
        const favBtn = card.querySelector('.anime-fav');
        if (favBtn) {
          favBtn._onToggle = (id) => {
            const added = this.storage.toggleFavorite(id);
            this.ui.toast(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
            return added;
          };
        }
        container.appendChild(card);
      });
      this._renderPagination(pagination, data.pageInfo);
    } catch (e) {
      if (requestId !== this.requestId) return;
      console.error(e);
      container.innerHTML = '';
      container.appendChild(this.ui.renderEmpty('Erreur de chargement.', 'error'));
      this.ui.toast('Erreur de chargement', 'error');
    }
  }

  async _fetchAnimes() {
    try {
      return await this.anilist.searchMedia({
        page: this.filters.page,
        perPage: 20,
        genre: this.filters.genre,
        format: this.filters.format,
        sort: this.filters.sort === 'score' ? 'SCORE_DESC' : 'POPULARITY_DESC',
      });
    } catch (error) {
      const { getDemoAnimes } = await import('../demo-data.js');
      const localGenres = {
        Adventure: 'Aventure', Comedy: 'Comédie', Drama: 'Drame',
        'Sci-Fi': 'Science-Fiction', Mystery: 'Mystère', Horror: 'Horreur',
      };
      return getDemoAnimes({
        ...this.filters,
        genre: localGenres[this.filters.genre] || this.filters.genre,
        perPage: 20,
      });
    }
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
