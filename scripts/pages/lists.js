export class ListsPage {
  constructor({ router, ui, storage } = {}) { Object.assign(this, { router, ui, storage }); }

  async render() {
    const page = document.createElement('section');
    page.className = 'page library-page';
    page.innerHTML = `<header class="page-header"><p class="eyebrow">TA COLLECTION</p><h1>Mes listes</h1><p class="page-subtitle">Organise ton prochain marathon comme tu l'aimes.</p></header>
      <form id="new-list-form" class="new-list-form"><input id="new-list-name" maxlength="32" placeholder="Nom d'une nouvelle liste" aria-label="Nom de la nouvelle liste"><button class="btn btn-primary">＋ Créer une liste</button></form>
      <div id="list-tabs" class="list-tabs"></div><div id="list-content"></div>`;
    return page;
  }

  async onMount() {
    this.activeList = Object.keys(this.storage.getLists())[0] || 'À voir';
    this.element = document.querySelector('.library-page');
    this.element.querySelector('#new-list-form').onsubmit = (event) => {
      event.preventDefault();
      const input = this.element.querySelector('#new-list-name');
      const name = input.value.trim();
      if (!name) return;
      const lists = this.storage.getLists();
      if (lists[name]) { this.ui.toast('Cette liste existe déjà.', 'warning'); return; }
      lists[name] = [];
      this.storage.saveLists(lists);
      this.activeList = name;
      input.value = '';
      this.renderLists();
    };
    this.renderLists();
  }

  renderLists() {
    const lists = this.storage.getLists();
    if (!lists[this.activeList]) this.activeList = Object.keys(lists)[0] || 'À voir';
    const tabs = this.element.querySelector('#list-tabs');
    tabs.replaceChildren();
    Object.entries(lists).forEach(([name, items]) => {
      const wrap = document.createElement('div'); wrap.className = 'list-tab-wrap';
      const button = document.createElement('button');
      button.className = `list-tab${name === this.activeList ? ' active' : ''}`;
      button.textContent = `${name}  ${items.length}`;
      button.onclick = () => { this.activeList = name; this.renderLists(); };
      wrap.append(button);
      if (!['À voir', 'En cours', 'Terminés'].includes(name)) {
        const removeList = document.createElement('button'); removeList.className = 'list-tab-delete'; removeList.type = 'button'; removeList.textContent = '×'; removeList.setAttribute('aria-label', `Supprimer la liste ${name}`);
        removeList.onclick = () => {
          if (!confirm(`Supprimer la liste « ${name} » ?`)) return;
          this.storage.removeList(name);
          if (this.activeList === name) this.activeList = 'À voir';
          this.renderLists();
        };
        wrap.append(removeList);
      }
      tabs.append(wrap);
    });
    const content = this.element.querySelector('#list-content');
    content.replaceChildren();
    const items = lists[this.activeList] || [];
    if (!items.length) {
      content.innerHTML = `<div class="empty-state"><span>✳</span><h2>Cette liste attend son premier anime</h2><p>Ajoute un titre depuis sa fiche pour le retrouver ici.</p><a class="btn btn-primary" href="#/decouvrir">Explorer le catalogue</a></div>`;
      return;
    }
    const grid = document.createElement('div'); grid.className = 'grid';
    items.forEach((media) => {
      const card = this.ui.renderCard(media, { isFavorite: this.storage.isFavorite(media.id) });
      card._onClick = (item) => this.router.navigate(`/anime/${item.id}`);
      card.querySelector('.anime-fav')._onToggle = (id) => this.storage.toggleFavorite(id);
      const remove = document.createElement('button'); remove.className = 'list-remove'; remove.textContent = 'Retirer de la liste';
      remove.onclick = (event) => { event.stopPropagation(); this.storage.removeFromList(this.activeList, media.id); this.renderLists(); };
      card.append(remove); grid.append(card);
    });
    content.append(grid);
  }
}
