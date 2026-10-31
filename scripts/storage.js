/* ==========================================================================
   Tsuki — Stockage local (favoris, thème, historique, cache persistant)
   ========================================================================== */

const volatileStorage = new Map();

export class Storage {
  constructor() {
    this.ready = Promise.resolve();
  }

  _read(key) {
    if (volatileStorage.has(key)) return volatileStorage.get(key);
    try { return window.localStorage.getItem(key); }
    catch (error) { return volatileStorage.get(key) ?? null; }
  }
  _write(key, value) {
    volatileStorage.set(key, String(value));
    try { window.localStorage.setItem(key, value); }
    catch (error) { /* Keep an in-memory copy for restricted storage contexts. */ }
  }
  _remove(key) {
    volatileStorage.delete(key);
    try { window.localStorage.removeItem(key); }
    catch (error) { /* The in-memory copy is already cleared. */ }
  }

  // --- Thème ---
  getTheme() {
    const saved = this._read('tsuki_theme');
    if (saved) return saved;
    return 'dark';
  }
  setTheme(theme) {
    this._write('tsuki_theme', theme);
    document.documentElement.dataset.theme = theme;
  }

  // --- Favoris ---
  getFavorites() {
    try {
      return new Set(JSON.parse(this._read('tsuki_favorites') || '[]'));
    } catch (e) {
      return new Set();
    }
  }
  saveFavorites(set) {
    this._write('tsuki_favorites', JSON.stringify([...set]));
    window.dispatchEvent(new CustomEvent('tsuki:favorites-changed'));
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

  saveMedia(media) {
    try {
      const items = JSON.parse(this._read('tsuki_media') || '{}');
      items[String(media.id)] = media;
      this._write('tsuki_media', JSON.stringify(items));
    } catch (error) {
      console.warn('Impossible de sauvegarder la fiche anime', error);
    }
  }
  getMedia(id) {
    try { return JSON.parse(this._read('tsuki_media') || '{}')[String(id)] || null; }
    catch (error) { return null; }
  }

  getLists() {
    try { return JSON.parse(this._read('tsuki_lists') || '{"À voir":[],"En cours":[],"Terminés":[]}'); }
    catch (error) { return { 'À voir': [], 'En cours': [], 'Terminés': [] }; }
  }
  saveLists(lists) { this._write('tsuki_lists', JSON.stringify(lists)); }
  addToList(name, media) {
    const lists = this.getLists();
    lists[name] ||= [];
    if (!lists[name].some((item) => String(item.id) === String(media.id))) lists[name].unshift(media);
    this.saveMedia(media);
    this.saveLists(lists);
  }
  removeFromList(name, id) {
    const lists = this.getLists();
    lists[name] = (lists[name] || []).filter((item) => String(item.id) !== String(id));
    this.saveLists(lists);
  }
  removeList(name) {
    if (['À voir', 'En cours', 'Terminés'].includes(name)) return;
    const lists = this.getLists();
    delete lists[name];
    this.saveLists(lists);
  }

  // --- Historique de visionnage ---
  getHistory() {
    try { return JSON.parse(this._read('tsuki_history') || '[]'); } catch (e) { return []; }
  }
  addHistory(item) {
    const list = this.getHistory();
    const idx = list.findIndex((h) => String(h.id) === String(item.id));
    if (idx !== -1) list.splice(idx, 1);
    list.unshift({ ...item, watchedAt: Date.now() });
    this._write('tsuki_history', JSON.stringify(list.slice(0, 50)));
    this.saveMedia(item);
  }
  clearHistory() { this._remove('tsuki_history'); }

  // --- Configuration API ---
  getApiBase() {
    return this._read('tsuki_api_base') || 'https://frembed.uno';
  }
  setApiBase(url) {
    this._write('tsuki_api_base', url);
  }

  // --- Accès générique ---
  getItem(key) {
    return this._read(key) || '';
  }
  setItem(key, value) {
    this._write(key, value);
  }

  // --- Nettoyage des données locales ---
  clearLocalData() {
    ['tsuki_favorites', 'tsuki_history', 'tsuki_animedoc_key', 'tsuki_lists', 'tsuki_media'].forEach((key) => this._remove(key));
    window.dispatchEvent(new CustomEvent('tsuki:favorites-changed'));
  }
}
