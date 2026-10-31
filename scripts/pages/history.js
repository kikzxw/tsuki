export class HistoryPage {
  constructor({ router, ui, storage } = {}) { Object.assign(this, { router, ui, storage }); }
  async render() {
    const page = document.createElement('section'); page.className = 'page library-page';
    page.innerHTML = `<header class="page-header"><p class="eyebrow">REPRENDS OÙ TU EN ÉTAIS</p><h1>Récemment vus</h1><p class="page-subtitle">Tes découvertes restent à portée de main sur cet appareil.</p><button id="clear-history" class="btn btn-outline">Effacer l'historique</button></header><div id="history-content"></div>`;
    return page;
  }
  async onMount() {
    this.element = document.querySelector('.library-page');
    this.element.querySelector('#clear-history').onclick = () => {
      this.storage.clearHistory(); this.renderHistory(); this.ui.toast('Historique effacé.');
    };
    this.renderHistory();
  }
  renderHistory() {
    const content = this.element.querySelector('#history-content');
    const history = this.storage.getHistory(); content.replaceChildren();
    if (!history.length) {
      content.innerHTML = `<div class="empty-state"><span>◷</span><h2>Ton historique est encore vide</h2><p>Les animes que tu lances apparaîtront ici.</p><a class="btn btn-primary" href="#/decouvrir">Trouver un anime</a></div>`;
      return;
    }
    const grid = document.createElement('div'); grid.className = 'grid history-grid';
    history.forEach((media) => {
      const card = this.ui.renderCard(media, { isFavorite: this.storage.isFavorite(media.id) });
      card._onClick = (item) => this.router.navigate(`/anime/${item.id}`);
      card.querySelector('.anime-fav')._onToggle = (id) => this.storage.toggleFavorite(id);
      const time = document.createElement('p'); time.className = 'history-time'; time.textContent = `${media.episode ? `Épisode ${media.episode} · ` : ''}Vu ${new Date(media.watchedAt).toLocaleDateString('fr-FR')}`;
      const resume = document.createElement('button'); resume.className = 'list-remove'; resume.textContent = 'Reprendre →';
      resume.onclick = (event) => { event.stopPropagation(); this.router.navigate(`/lecteur?animeId=${encodeURIComponent(media.id)}&ep=${media.episode || 1}&title=${encodeURIComponent(media.title)}&cover=${encodeURIComponent(media.coverImage || '')}`); };
      card.append(time, resume); grid.append(card);
    });
    content.append(grid);
  }
}
