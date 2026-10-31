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
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page favorites-page';
    section.innerHTML = `
      <header class="page-header">
        <h1>Mes favoris</h1>
        <p class="page-subtitle">Vos animes enregistrés.</p>
      </header>
      <div id="fav-results" class="grid"></div>
      <div id="fav-empty" class="empty" style="display:none;text-align:center;padding:3rem;">
        <p>Aucun favori pour le moment.</p>
        <a href="#/" class="btn btn-primary">Découvrir le catalogue</a>
      </div>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    await this.load();
  }

  async load() {
    const container = this.element.querySelector('#fav-results');
    const empty = this.element.querySelector('#fav-empty');
    const ids = [...this.storage.getFavorites()];

    container.innerHTML = '';
    empty.style.display = 'none';

    if (ids.length === 0) {
      empty.style.display = 'block';
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
        console.warn('Favori chargé en erreur', id, e);
      }
    }

    container.innerHTML = '';
    if (loaded.length === 0) {
      empty.style.display = 'block';
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
      card.querySelector('.anime-fav')._onToggle = (fid) => {
        this.storage.toggleFavorite(fid);
        this.load();
        this.ui.toast('Retiré des favoris');
        return false;
      };
      container.appendChild(card);
    });
  }
}
