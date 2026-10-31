export class SettingsPage {
  constructor({ storage, ui } = {}) { Object.assign(this, { storage, ui }); }
  async render() {
    const page = document.createElement('section'); page.className = 'page library-page';
    page.innerHTML = `<header class="page-header"><p class="eyebrow">TON ESPACE</p><h1>Préférences</h1><p class="page-subtitle">Garde ta bibliothèque comme tu l'aimes.</p></header>
      <div class="settings-card"><h2>Apparence</h2><p class="settings-desc">Sakura est pensée pour la nuit, avec ses accents rose cerisier.</p><button id="toggle-theme" class="btn btn-outline">Basculer le contraste</button><div class="divider"></div><h2>Réinitialiser la bibliothèque</h2><p class="settings-desc">Effacer les favoris, les listes et l'historique enregistrés sur cet appareil.</p><button id="clear-library" class="btn btn-outline danger-button">Tout effacer</button></div>`;
    return page;
  }
  async onMount() {
    document.querySelector('.library-page #toggle-theme').onclick = () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      this.storage.setTheme(next); this.ui.toast(next === 'dark' ? 'Mode sakura activé.' : 'Contraste doux activé.');
    };
    document.querySelector('.library-page #clear-library').onclick = () => {
      if (confirm('Effacer tes favoris, listes et ton historique ?')) {
        this.storage.clearLocalData(); this.ui.toast('Bibliothèque réinitialisée.');
      }
    };
  }
}
