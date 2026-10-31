export class HistoryPage {
  constructor({ router, ui, storage } = {}) {
    Object.assign(this, { router, ui, storage });
    this.layout = 'grid';
  }

  async render() {
    const page = document.createElement('section');
    page.className = 'page library-page history-page';
    page.innerHTML = `
      <header class="page-header">
        <p class="eyebrow">REPRENDS OÙ TU EN ÉTAIS</p>
        <h1>Récemment vus</h1>
        <p class="page-subtitle">Tes découvertes et ta progression restent enregistrées sur cet appareil.</p>
        <div class="library-header-actions">
          <button id="clear-history" class="btn btn-outline danger-button">Effacer l'historique</button>
          <button id="toggle-history-layout" class="btn btn-outline">Vue compacte</button>
        </div>
      </header>
      <div id="history-content"></div>
    `;
    return page;
  }

  async onMount() {
    this.element = document.querySelector('.history-page');
    this.element.querySelector('#clear-history').onclick = () => {
      if (confirm('Effacer l\'ensemble de ton historique de lecture ?')) {
        this.storage.clearHistory();
        this.renderHistory();
        this.ui.toast('Historique effacé.');
      }
    };

    const layoutBtn = this.element.querySelector('#toggle-history-layout');
    layoutBtn.onclick = () => {
      this.layout = this.layout === 'grid' ? 'list' : 'grid';
      layoutBtn.textContent = this.layout === 'grid' ? 'Vue compacte' : 'Vue grille';
      this.renderHistory();
    };

    this.renderHistory();
  }

  renderHistory() {
    const content = this.element.querySelector('#history-content');
    const history = this.storage.getHistory();
    content.replaceChildren();

    if (!history.length) {
      content.innerHTML = `
        <div class="empty-state">
          <span>◷</span>
          <h2>Ton historique est encore vide</h2>
          <p>Les animes que tu regardes apparaîtront ici avec le dernier épisode visionné.</p>
          <a class="btn btn-primary" href="#/decouvrir">Explorer le catalogue</a>
        </div>
      `;
      return;
    }

    const grid = document.createElement('div');
    grid.className = `grid history-grid ${this.layout === 'list' ? 'list-layout' : ''}`;

    history.forEach((media) => {
      const card = this.ui.renderCard(media, { isFavorite: this.storage.isFavorite(media.id) });
      card._onClick = (item) => this.router.navigate(`/anime/${item.id}`);

      const favBtn = card.querySelector('.anime-fav');
      if (favBtn) {
        favBtn._onToggle = (id) => this.storage.toggleFavorite(id);
      }

      const epText = media.episode ? `Épisode ${media.episode}` : 'Film';
      const timeStr = media.watchedAt ? new Date(media.watchedAt).toLocaleDateString('fr-FR') : '';

      const infoBar = document.createElement('div');
      infoBar.className = 'history-card-footer';
      infoBar.innerHTML = `
        <span class="history-time">${epText} · ${timeStr}</span>
        <button class="btn btn-primary btn-sm resume-btn">Reprendre ▶</button>
      `;

      infoBar.querySelector('.resume-btn').onclick = (e) => {
        e.stopPropagation();
        this.router.navigate(
          `/lecteur?animeId=${encodeURIComponent(media.id)}&ep=${media.episode || 1}&title=${encodeURIComponent(media.title)}&cover=${encodeURIComponent(media.coverImage || '')}`
        );
      };

      card.append(infoBar);
      grid.append(card);
    });

    content.append(grid);
  }
}
