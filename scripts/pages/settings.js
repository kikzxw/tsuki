/* ==========================================================================
   Tsuki — Page Paramètres (clé API AnimeDoc, thème, etc.)
   ========================================================================== */

export class SettingsPage {
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
    section.className = 'page settings-page';
    section.innerHTML = `
      <header class="page-header">
        <h1>Paramètres</h1>
        <p class="page-subtitle">Configurez votre clé API AnimeDoc et les préférences.</p>
      </header>

      <div class="settings-card">
        <h2>API AnimeDoc</h2>
        <p class="settings-desc">
          AnimeDoc fournit les métadonnées et les liens de lecture vidéo. Une clé API gratuite est requise
          (20 requêtes/jour, 10 par minute). Créez-la sur <a href="https://www.animedoc.cloud" target="_blank" rel="noopener">animedoc.cloud</a>.
        </p>

        <div class="form-group">
          <label for="animedoc-key">Clé API AnimeDoc</label>
          <input type="password" id="animedoc-key" placeholder="sk-…" autocomplete="off">
          <div class="key-actions">
            <button id="save-key" class="btn btn-primary">Enregistrer</button>
            <button id="show-key" class="btn btn-outline" type="button">👁️ Afficher</button>
          </div>
          <p id="key-status" class="settings-hint"></p>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label>Thème</label>
          <div class="theme-toggle-group">
            <button id="theme-dark" class="btn theme-btn" data-theme="dark">🌙 Sombre</button>
            <button id="theme-light" class="btn theme-btn" data-theme="light">☀️ Clair</button>
            <button id="theme-system" class="btn theme-btn" data-theme="system">📱 Système</button>
          </div>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <h3>Source de métadonnées</h3>
          <div class="source-options">
            <label class="source-option">
              <input type="radio" name="meta-source" value="animedoc" ${this.animedoc.hasKey() ? 'checked' : ''}>
              AnimeDoc (recommandé)
            </label>
            <label class="source-option">
              <input type="radio" name="meta-source" value="anilist">
              AniList (fallback, sans clé)
            </label>
          </div>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <button id="clear-favs" class="btn btn-outline" style="color:var(--error)">Effacer les favoris</button>
          <button id="clear-cache" class="btn btn-outline">Vider le cache API</button>
        </div>
      </div>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    const keyInput = this.element.querySelector('#animedoc-key');
    const saveBtn = this.element.querySelector('#save-key');
    const showBtn = this.element.querySelector('#show-key');
    const status = this.element.querySelector('#key-status');

    // Charger la clé existante
    const savedKey = this.storage.getItem('tsuki_animedoc_key') || '';
    if (savedKey) {
      keyInput.value = savedKey;
      this.animedoc.setApiKey(savedKey);
      status.textContent = 'Clé configurée.';
      status.style.color = 'var(--success)';
    }

    showBtn.onclick = () => {
      const isPassword = keyInput.type === 'password';
      keyInput.type = isPassword ? 'text' : 'password';
      showBtn.textContent = isPassword ? '🙈 Masquer' : '👁️ Afficher';
    };

    saveBtn.onclick = () => {
      const key = keyInput.value.trim();
      if (!key) {
        status.textContent = 'Veuillez saisir une clé.';
        status.style.color = 'var(--error)';
        return;
      }
      localStorage.setItem('tsuki_animedoc_key', key);
      this.animedoc.setApiKey(key);
      status.textContent = 'Clé enregistrée avec succès.';
      status.style.color = 'var(--success)';
      this.ui.toast('Clé API AnimeDoc enregistrée');
    };

    // Thème
    const setThemeBtn = (id, theme) => {
      const btn = this.element.querySelector(`#${id}`);
      btn.onclick = () => {
        if (theme === 'system') {
          const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          this.storage.setTheme(dark ? 'dark' : 'light');
        } else {
          this.storage.setTheme(theme);
        }
        this._updateThemeButtons();
      };
    };
    setThemeBtn('theme-dark', 'dark');
    setThemeBtn('theme-light', 'light');
    setThemeBtn('theme-system', 'system');
    this._updateThemeButtons();

    // Effacer favoris
    this.element.querySelector('#clear-favs').onclick = () => {
      if (confirm('Supprimer tous les favoris ?')) {
        this.storage.saveFavorites(new Set());
        this.ui.toast('Favoris effacés');
      }
    };

    // Vider cache / données locales
    this.element.querySelector('#clear-cache').onclick = () => {
      if (confirm('Effacer toutes les données locales (favoris, historique, clé API) ?')) {
        this.storage.clearLocalData();
        location.reload();
      }
    };
  }

  _updateThemeButtons() {
    const current = document.documentElement.dataset.theme || 'dark';
    ['theme-dark', 'theme-light', 'theme-system'].forEach((id) => {
      const btn = this.element.querySelector(`#${id}`);
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
      }
    });
    const active = this.element.querySelector(`#theme-${current === 'system' ? 'system' : current}`);
    if (active) {
      active.classList.remove('btn-outline');
      active.classList.add('btn-primary');
    }
  }
}
