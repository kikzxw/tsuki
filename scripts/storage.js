/* ==========================================================================
   Tsuki — Stockage local (favoris, thème, historique, cache persistant)
   ========================================================================== */

export class Storage {
  constructor() {
    this.ready = Promise.resolve();
  }

  // --- Thème ---
  getTheme() {
    const saved = localStorage.getItem('tsuki_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  setTheme(theme) {
    localStorage.setItem('tsuki_theme', theme);
    document.documentElement.dataset.theme = theme;
  }

  // --- Favoris ---
  getFavorites() {
    try {
      return new Set(JSON.parse(localStorage.getItem('tsuki_favorites') || '[]'));
    } catch (e) {
      return new Set();
    }
  }
  saveFavorites(set) {
    localStorage.setItem('tsuki_favorites', JSON.stringify([...set]));
  }
  isFavorite(id) {
    return this.getFavorites().has(String(id));
  }
  toggleFavorite(id) {
    const set = this.getFavorites();
    const key = String(id);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    this.saveFavorites(set);
    return set.has(key);
  }

  // --- Historique de visionnage ---
  getHistory() {
    try { return JSON.parse(localStorage.getItem('tsuki_history') || '[]'); } catch (e) { return []; }
  }
  addHistory(item) {
    const list = this.getHistory();
    const idx = list.findIndex((h) => h.id === item.id);
    if (idx !== -1) list.splice(idx, 1);
    list.unshift({ ...item, watchedAt: Date.now() });
    localStorage.setItem('tsuki_history', JSON.stringify(list.slice(0, 50)));
  }

  // --- Configuration API ---
  getApiBase() {
    return localStorage.getItem('tsuki_api_base') || 'https://frembed.uno';
  }
  setApiBase(url) {
    localStorage.setItem('tsuki_api_base', url);
  }

  // --- Accès générique ---
  getItem(key) {
    return localStorage.getItem(key) || '';
  }
  setItem(key, value) {
    localStorage.setItem(key, value);
  }

  // --- Nettoyage des données locales ---
  clearLocalData() {
    localStorage.removeItem('tsuki_favorites');
    localStorage.removeItem('tsuki_history');
    localStorage.removeItem('tsuki_animedoc_key');
  }
}
