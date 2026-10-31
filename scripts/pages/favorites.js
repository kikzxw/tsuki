/* ==========================================================================
   Tsuki — Page Favoris
   ========================================================================== */

export class FavoritesPage {
  constructor({ router, anilist, ui, storage, config } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.ui = ui;
    this.storage = storage;
    this.config = config;
    this.element = null;
    this.layout = 'grid';
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page favorites-page';
    section.innerHTML = `
      <header class="page-header">
        <p class="eyebrow">COUPS DE CŒUR</p>
        <h1>Mes favoris</h1>
        <p class="page-subtitle">Vos animes et films enregistrés sur cet appareil.</p>
        <div class="library-header-actions">
          <button id="toggle-fav-layout" class="btn btn-outline">Vue compacte</button>
        </div>
      </header>
      <div id="fav-results" class="grid"></div>
      <div id="fav-empty" class="empty-state" style="display:none;">
        <span>♡</span>
        <h2>Aucun favori pour le moment</h2>
        <p>Clique sur l'étoile ou le cœur d'un anime pour l'ajouter à tes favoris.</p>
        <a href="#/decouvrir" class="btn btn-primary">Découvrir le catalogue</a>
      </div>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    const toggleBtn = this.element.querySelector('#toggle-fav-layout');
    toggleBtn.onclick = () => {
      this.layout = this.layout === 'grid' ? 'list' : 'grid';
      toggleBtn.textContent = this.layout === 'grid' ? 'Vue compacte' : 'Vue grille';
      this.load();
    };
    await this.load();
  }

  async load() {
    const container = this.element.querySelector('#fav-results');
    const empty = this.element.querySelector('#fav-empty');
    const ids = [...this.storage.getFavorites()];

    container.innerHTML = '';
    empty.style.display = 'none';

    if (ids.length === 0) {
      empty.style.display = 'grid';
      return;
    }

    container.appendChild(this.ui.renderSkeleton(ids.length));

    const loaded = [];
    const { getDemoAnime } = await import('../demo-data.js');
    for (const id of ids) {
      try {
        const media = this.storage.getMedia(id) || getDemoAnime(id) || await this.anilist.getMedia(id);
        if (!media) continue;
        loaded.push(media);
      } catch (e) {
        console.warn('Favori non chargé', id, e);
      }
    }

    container.innerHTML = '';
    container.className = `grid ${this.layout === 'list' ? 'list-layout' : ''}`;

    if (loaded.length === 0) {
      empty.style.display = 'grid';
      return;
    }

    loaded.forEach((media) => {
      this.storage.saveMedia(media);
      const card = this.ui.renderCard(media, {
        clickable: true,
        showFav: true,
        isFavorite: true,
      });
      card._onClick = (m) => this.router.navigate(this.config.routes.detail(m.id));
      const favBtn = card.querySelector('.anime-fav');
      if (favBtn) {
        favBtn._onToggle = (fid) => {
          this.storage.toggleFavorite(fid);
          this.load();
          this.ui.toast('Retiré des favoris');
          return false;
        };
      }
      container.appendChild(card);
    });
  }
}
