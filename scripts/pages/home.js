/* ==========================================================================
   Tsuki — Page d'accueil (catalogue démo embarqué en priorité)
   ========================================================================== */

export class HomePage {
  constructor({ router, anilist, animedoc, ui, storage, config } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.ui = ui;
    this.storage = storage;
    this.config = config;
    this.element = null;
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page home-page';
    section.innerHTML = `
      <header class="page-header">
        <p class="eyebrow">TON PROCHAIN MONDE COMMENCE ICI</p>
        <h1>Une histoire à la fois.</h1>
        <p class="page-subtitle">Des nouvelles obsessions aux classiques qui restent avec toi.</p>
      </header>

      <section id="home-hero" class="feature-hero" aria-label="Anime à découvrir"></section>

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
      <section class="home-section">
        <div class="section-row"><h2 class="section-title">Longs métrages pour ce soir</h2><a href="#/decouvrir?format=MOVIE" class="see-all">Explorer les films ↗</a></div>
        <div id="home-movies" class="grid"></div>
      </section>
      <section class="home-section">
        <div class="section-row"><h2 class="section-title">Reprendre le fil</h2><a href="#/historique" class="see-all">Tout l'historique ↗</a></div>
        <div id="home-history" class="grid"></div>
      </section>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    const [trending, top, action, movies] = await Promise.all([
      this._loadSection('home-trending', () => this.anilist.searchMedia({ perPage: 6, sort: 'POPULARITY_DESC' })),
      this._loadSection('home-top', () => this.anilist.searchMedia({ perPage: 6, sort: 'SCORE_DESC' })),
      this._loadSection('home-genre', () => this.anilist.searchMedia({ perPage: 6, genre: 'Action', sort: 'POPULARITY_DESC' })),
      this._loadSection('home-movies', () => this.anilist.searchMedia({ perPage: 6, format: 'MOVIE', sort: 'POPULARITY_DESC' })),
    ]);
    const first = trending?.results?.[0];
    if (first) this._renderHero(first);
    this._renderHistory();
  }

  _renderHero(media) {
    const hero = this.element.querySelector('#home-hero');
    const image = media.bannerImage || media.coverImage;
    hero.style.setProperty('--hero-image', `url("${image}")`);
    hero.innerHTML = `
      <div class="hero-copy">
        <span class="hero-kicker">À DÉCOUVRIR EN CE MOMENT</span>
        <h2>${this.ui.escapeHtml(media.title)}</h2>
        <p>${this.ui.escapeHtml((media.description || '').slice(0, 230))}${media.description?.length > 230 ? '…' : ''}</p>
        <div class="hero-meta">
          <span>★ ${((media.averageScore || 0) / 10).toFixed(1)} / 10</span>
          <span>${this.ui.escapeHtml(media.format || 'ANIME')}</span>
          <span>${media.episodes ? `${media.episodes} épisodes` : 'En cours'}</span>
        </div>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/lecteur?animeId=${encodeURIComponent(media.id)}&ep=1&title=${encodeURIComponent(media.title)}&cover=${encodeURIComponent(media.coverImage || '')}">
            🎬 Regarder l'épisode 1
          </a>
          <a class="btn btn-outline" href="#/anime/${encodeURIComponent(media.id)}">
            Voir la fiche <span>↗</span>
          </a>
        </div>
      </div>
      <div class="hero-art">
        <img src="${this.ui.escapeHtml(media.coverImage || '')}" alt="Affiche de ${this.ui.escapeHtml(media.title)}">
      </div>
    `;
    const cover = hero.querySelector('.hero-art img');
    cover.onerror = () => { cover.onerror = null; cover.src = this.ui.posterFallback(media.title); };
  }

  async _loadSection(containerId, loader) {
    const container = this.element.querySelector(`#${containerId}`);
    if (!container) return;
    container.innerHTML = '';

    try {
      const data = await loader();
      container.innerHTML = '';
      const results = data.results || [];
      if (results.length === 0) {
        const { getDemoAnimes } = await import('../demo-data.js');
        results.push(...getDemoAnimes({ perPage: 6, genre: containerId === 'home-genre' ? 'Action' : null, format: containerId === 'home-movies' ? 'MOVIE' : null }).results);
        if (!results.length) { container.appendChild(this.ui.renderEmpty('Aucun résultat.')); return; }
      }
      results.forEach((m) => {
        this.storage.saveMedia(m);
        const card = this.ui.renderCard(m, {
          clickable: true,
          showFav: true,
          isFavorite: this.storage?.isFavorite(m.id) || false,
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
      return data;
    } catch (e) {
      console.error(e);
      container.innerHTML = '';
      const { getDemoAnimes } = await import('../demo-data.js');
      const fallback = getDemoAnimes({ perPage: 6, genre: containerId === 'home-genre' ? 'Action' : null, format: containerId === 'home-movies' ? 'MOVIE' : null });
      fallback.results.forEach((media) => {
        this.storage.saveMedia(media);
        const card = this.ui.renderCard(media, { isFavorite: this.storage.isFavorite(media.id) });
        card._onClick = (item) => this.router.navigate(`/anime/${item.id}`);
        const favBtn = card.querySelector('.anime-fav');
        if (favBtn) favBtn._onToggle = (id) => this.storage.toggleFavorite(id);
        container.append(card);
      });
      return fallback;
    }
  }

  _renderHistory() {
    const container = this.element.querySelector('#home-history');
    const items = this.storage.getHistory().slice(0, 6);
    if (!items.length) { container.innerHTML = `<p class="empty-state compact-empty">Tes prochains épisodes apparaîtront ici.</p>`; return; }
    items.forEach((media) => {
      const card = this.ui.renderCard(media, { isFavorite: this.storage.isFavorite(media.id) });
      card._onClick = (item) => this.router.navigate(`/anime/${item.id}`);
      const favBtn = card.querySelector('.anime-fav');
      if (favBtn) favBtn._onToggle = (id) => this.storage.toggleFavorite(id);
      container.append(card);
    });
  }
}
