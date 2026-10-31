/* ==========================================================================
   Tsuki — Application principale (initialisation globale)
   ========================================================================== */

export class App {
  constructor({ storage, cache, anilist, frembed, animedoc, ui, router, config, elements } = {}) {
    this.storage = storage;
    this.cache = cache;
    this.anilist = anilist;
    this.frembed = frembed;
    this.animedoc = animedoc;
    this.ui = ui;
    this.router = router;
    this.config = config;
    this.elements = elements;
  }

  async init() {
    const year = document.getElementById('footerYear');
    if (year) year.textContent = `© ${new Date().getFullYear()} Tsuki Library`;
    this._initTheme();
    this._initGlobalSearch();
    this._initFavButton();
    this._initUserMenu();
    this._renderFavCount();
    await this.router.start();
  }

  // --- Thème ---
  _initTheme() {
    const theme = this.storage.getTheme();
    this.storage.setTheme(theme);
    const btn = this.elements.themeToggle;
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre';
      btn.onclick = () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        this.storage.setTheme(next);
        btn.textContent = next === 'dark' ? '☀️' : '🌙';
        btn.title = next === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre';
        this.ui.toast(next === 'dark' ? 'Thème sombre' : 'Thème clair');
      };
    }
  }

  // --- Recherche globale dans le header ---
  _initGlobalSearch() {
    const form = this.elements.searchForm;
    const input = this.elements.searchInput;
    if (!form || !input) return;

    form.onsubmit = (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      this.router.navigate(`/recherche?q=${encodeURIComponent(q)}`);
    };
  }

  // --- Bouton favoris header ---
  _initFavButton() {
    const btn = this.elements.favBtn;
    const count = this.elements.favCount;
    if (!btn) return;
    btn.onclick = (e) => {
      e.preventDefault();
      this.router.navigate('/favoris');
    };
    this._renderFavCount();
    window.addEventListener('storage', () => this._renderFavCount());
    window.addEventListener('tsuki:favorites-changed', () => this._renderFavCount());
  }

  _renderFavCount() {
    const count = this.elements.favCount;
    const n = this.storage.getFavorites().size;
    if (count) count.textContent = `${n} favoris`;
    const navCount = document.getElementById('navFavCount');
    if (navCount) navCount.textContent = n;
    if (this.elements.favBtn) {
      this.elements.favBtn.setAttribute('aria-label', `Mes favoris (${n})`);
      this.elements.favBtn.classList.toggle('has-fav', n > 0);
    }
  }

  // --- Menu utilisateur ---
  _initUserMenu() {
    const btn = this.elements.userBtn;
    if (!btn) return;
    btn.onclick = () => {
      this.ui.toast('Espace utilisateur à venir (connexion optionnelle).', 'info');
    };
  }
}
