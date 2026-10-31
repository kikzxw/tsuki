/* ==========================================================================
   Tsuki — Page Recherche
   Recherche en direct, suggestions rapides & navigation fluide
   ========================================================================== */

export class SearchPage {
  constructor({ router, anilist, animedoc, ui, storage, config } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.ui = ui;
    this.storage = storage;
    this.config = config;
    this.element = null;
    this.timer = null;
    this.query = '';
    this.page = 1;
    this.requestId = 0;
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page search-page';
    section.innerHTML = `
      <header class="page-header">
        <p class="eyebrow">EXPLORATION INSTANTANÉE</p>
        <h1>Recherche</h1>
        <p class="page-subtitle">Trouvez un anime, film ou franchise en un instant.</p>
      </header>

      <div class="search-toolbar">
        <input type="search" id="search-input" placeholder="Ex: Attack on Titan, Demon Slayer, Solo Leveling…" autocomplete="off" results="0" spellcheck="false">
        <button id="search-btn" class="btn btn-primary">Chercher</button>
      </div>

      <!-- Suggestions populaires -->
      <div class="search-suggestions" id="search-suggestions">
        <span class="suggestions-label">Suggestions :</span>
        <button class="chip-suggestion" data-query="Attack on Titan">Attack on Titan</button>
        <button class="chip-suggestion" data-query="Demon Slayer">Demon Slayer</button>
        <button class="chip-suggestion" data-query="Jujutsu Kaisen">Jujutsu Kaisen</button>
        <button class="chip-suggestion" data-query="One Piece">One Piece</button>
        <button class="chip-suggestion" data-query="Solo Leveling">Solo Leveling</button>
        <button class="chip-suggestion" data-query="Frieren">Frieren</button>
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
    const query = new URLSearchParams(hash.split('?')[1] || '');
    if (query.has('q')) {
      input.value = query.get('q');
      this.query = query.get('q');
      this.page = 1;
      await this.load();
    }

    btn.onclick = () => this._doSearch(input.value, true);
    input.addEventListener('input', (e) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this._doSearch(e.target.value), this.config.debounceMs || 300);
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._doSearch(input.value, true);
      }
    });

    // Clic sur les suggestions
    this.element.querySelectorAll('.chip-suggestion').forEach((chip) => {
      chip.onclick = () => {
        const q = chip.dataset.query;
        input.value = q;
        this._doSearch(q, true);
      };
    });
  }

  _doSearch(q, navigate = false) {
    this.query = (q || '').trim();
    this.page = 1;
    if (navigate) {
      this.router.navigate(`/recherche?q=${encodeURIComponent(this.query)}`);
      return;
    }
    this.load();
  }

  async load() {
    const requestId = ++this.requestId;
    const container = this.element.querySelector('#search-results');
    const info = this.element.querySelector('#search-info');
    const pagination = this.element.querySelector('#search-pagination');

    container.innerHTML = '';
    if (this.query) container.appendChild(this.ui.renderSkeleton(8));
    pagination.innerHTML = '';

    if (!this.query) {
      container.innerHTML = '';
      info.textContent = 'Tapez un titre ou cliquez sur une suggestion ci-dessus pour lancer la recherche.';
      return;
    }

    try {
      const data = await this._fetchSearch();
      if (requestId !== this.requestId) return;
      container.innerHTML = '';
      info.textContent = `Résultats pour "${this.query}"`;
      const results = data.results || [];
      if (results.length === 0) {
        container.appendChild(this.ui.renderEmpty(`Aucun anime trouvé pour "${this.query}".`));
        return;
      }
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
      container.appendChild(this.ui.renderEmpty('Erreur de recherche.', 'error'));
      this.ui.toast('Erreur de recherche', 'error');
    }
  }

  async _fetchSearch() {
    try {
      return await this.anilist.searchMedia({
        search: this.query,
        page: this.page,
        perPage: 20,
        sort: 'SEARCH_MATCH',
      });
    } catch (error) {
      const { searchDemoAnimes } = await import('../demo-data.js');
      return searchDemoAnimes(this.query, { page: this.page, perPage: 20 });
    }
  }

  _renderPagination(container, pageInfo) {
    const { currentPage = 1, lastPage = 1, hasNextPage = false } = pageInfo;
    container.innerHTML = '';
    if (lastPage <= 1) return;

    const prev = document.createElement('button');
    prev.className = 'btn pag-btn';
    prev.textContent = '← Précédent';
    prev.disabled = currentPage <= 1;
    prev.onclick = () => {
      if (currentPage > 1) {
        this.page--;
        this.load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const next = document.createElement('button');
    next.className = 'btn pag-btn';
    next.textContent = 'Suivant →';
    next.disabled = !hasNextPage;
    next.onclick = () => {
      if (hasNextPage) {
        this.page++;
        this.load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const info = document.createElement('span');
    info.className = 'page-info';
    info.textContent = `Page ${currentPage} / ${lastPage}`;

    container.appendChild(prev);
    container.appendChild(info);
    container.appendChild(next);
  }
}
