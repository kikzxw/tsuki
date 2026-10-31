/* ==========================================================================
   Tsuki — Page d'accueil (catalogue démo embarqué en priorité)
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
    // AFFICHAGE INSTANTANÉ avec le catalogue démo embarqué
    await this._loadSection('home-trending', () => this._fetchDemo({ sort: 'popular', perPage: 6 }));
    await this._loadSection('home-top', () => this._fetchDemo({ sort: 'score', perPage: 6 }));
    await this._loadSection('home-genre', () => this._fetchDemo({ genre: 'Action', perPage: 6 }));

    // Puis essayer d'enrichir avec les APIs en arrière-plan (ne bloque pas l'affichage)
    this._tryEnrichWithAPIs();
  }

  async _fetchDemo({ sort = 'popular', genre = null, perPage = 20, page = 1 } = {}) {
    const { getDemoAnimes } = await import('../demo-data.js');
    return getDemoAnimes({ page, perPage, genre });
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

  async _tryEnrichWithAPIs() {
    // Tentative d'enrichissement via les APIs (non bloquant)
    try {
      if (this.animedoc?.hasKey?.()) {
        const data = await this.animedoc.getTrending();
        // Si l'API répond, on pourrait fusionner, mais on garde le démo pour la stabilité
      }
    } catch (e) {
      // Ignorer — le démo suffit
    }
  }
}
