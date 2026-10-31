/* ==========================================================================
   Tsuki — Page Préférences & Gestion des Données
   ========================================================================== */

export class SettingsPage {
  constructor({ storage, ui } = {}) {
    Object.assign(this, { storage, ui });
    this.element = null;
  }

  async render() {
    const page = document.createElement('section');
    page.className = 'page library-page settings-page';

    const favCount = this.storage.getFavorites().size;
    const historyCount = this.storage.getHistory().length;
    const listsCount = Object.keys(this.storage.getLists()).length;

    page.innerHTML = `
      <header class="page-header">
        <p class="eyebrow">TON ESPACE PERSONNEL</p>
        <h1>Préférences</h1>
        <p class="page-subtitle">Personnalise ton expérience Tsuki et gère tes données locales.</p>
      </header>

      <div class="settings-card">
        <h2>Apparence & Ambiance</h2>
        <p class="settings-desc">Bascule entre le mode Sakura Nuit (recommandé) et le Contraste Doux.</p>
        <button id="toggle-theme" class="btn btn-outline">Basculer le thème (Clair / Sombre)</button>

        <div class="divider"></div>

        <h2>Statistiques de ta Bibliothèque</h2>
        <p class="settings-desc">Toutes ces données sont stockées exclusivement sur ton navigateur :</p>
        <div class="settings-stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:0.75rem;margin:1rem 0;">
          <div class="stat-box" style="background:var(--surface);padding:0.85rem;border-radius:var(--radius-sm);border:1px solid var(--border);text-align:center;">
            <strong style="font-size:1.4rem;color:var(--accent);">${favCount}</strong>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem;">Favoris</div>
          </div>
          <div class="stat-box" style="background:var(--surface);padding:0.85rem;border-radius:var(--radius-sm);border:1px solid var(--border);text-align:center;">
            <strong style="font-size:1.4rem;color:var(--accent);">${historyCount}</strong>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem;">Récemment vus</div>
          </div>
          <div class="stat-box" style="background:var(--surface);padding:0.85rem;border-radius:var(--radius-sm);border:1px solid var(--border);text-align:center;">
            <strong style="font-size:1.4rem;color:var(--accent);">${listsCount}</strong>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem;">Listes actives</div>
          </div>
        </div>

        <div class="divider"></div>

        <h2>Serveurs de Lecture Intégrés</h2>
        <p class="settings-desc">
          Tsuki utilise un système multi-serveurs intelligent :<br>
          • <strong>Serveur 1 (Frembed)</strong> : Spécialisé VF et VOSTFR avec sélection audio intégrée.<br>
          • <strong>Serveur 2 & 3 (VidSrc)</strong> : Serveurs haute vitesse mondiaux (multi-langues).<br>
          • <strong>Flux Direct HLS</strong> : Pour la lecture native plein écran sans publicités.<br>
          • <strong>Bande-annonce HD</strong> : Bande-annonce officielle AniList / YouTube.
        </p>

        <div class="divider"></div>

        <h2>Réinitialiser la bibliothèque</h2>
        <p class="settings-desc">Efface tous les favoris, listes personnalisées, progressions d'épisodes et historiques enregistrés sur cet appareil.</p>
        <button id="clear-library" class="btn btn-outline danger-button">Tout réinitialiser</button>
      </div>
    `;
    this.element = page;
    return page;
  }

  async onMount() {
    this.element.querySelector('#toggle-theme').onclick = () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      this.storage.setTheme(next);
      this.ui.toast(next === 'dark' ? 'Mode Sakura Nuit activé.' : 'Mode Contraste Doux activé.');
    };

    this.element.querySelector('#clear-library').onclick = () => {
      if (confirm('Es-tu sûr(e) de vouloir tout effacer ? Cette action est irréversible.')) {
        this.storage.clearLocalData();
        this.ui.toast('Bibliothèque entièrement réinitialisée.', 'success');
        this.render().then((newEl) => {
          this.element.replaceWith(newEl);
          this.element = newEl;
          this.onMount();
        });
      }
    };
  }
}
