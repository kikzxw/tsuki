/* ==========================================================================
   Tsuki — Lecteur Vidéo Multi-Serveurs & Sélecteur d'Épisodes Fluide
   Supporte Frembed (VF/VOSTFR), VidSrc, HLS et Bandes-annonces
   ========================================================================== */

import { StreamingEngine } from '../api/streaming.js';

export class PlayerPage {
  constructor({ router, anilist, animedoc, frembed, ui, storage, streaming } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.frembed = frembed;
    this.ui = ui;
    this.storage = storage;
    this.streaming = streaming || new StreamingEngine({ frembed, animedoc });

    this.element = null;
    this.hls = null;
    this.currentAnime = null;
    this.animeId = null;
    this.currentEpisode = 1;
    this.currentSeason = 1;
    this.sources = [];
    this.selectedSourceIndex = 0;
    this.cinemaMode = false;
    this.activeRangeIndex = 0;
    this.rangeSize = 25;
    this.maxDisplayEpisodes = 50;
    this._keyHandler = null;
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page player-page';
    section.innerHTML = `
      <header class="page-header player-header">
        <div class="player-header-top">
          <button class="btn btn-back" id="player-back">← Retour à la fiche</button>
          <div class="player-top-actions">
            <button id="player-cinema-btn" class="icon-btn-text" title="Mode Cinéma (tamiser la lumière)">
              💡 Mode Cinéma
            </button>
            <button id="player-fullscreen-btn" class="icon-btn-text" title="Plein écran">
              ⛶ Plein écran
            </button>
          </div>
        </div>
        <div class="player-title-row">
          <h1 id="player-title">Lecteur</h1>
          <span id="player-badge-ep" class="badge badge--score">Épisode 1</span>
        </div>
      </header>

      <div class="player-main-layout">
        <!-- Zone Vidéo -->
        <div class="player-screen-area">
          <div class="player-wrapper" id="player-wrapper">
            <div class="player-loading-spinner" id="player-spinner">
              <div class="spinner"></div>
              <span>Chargement du flux vidéo…</span>
            </div>
          </div>

          <!-- Barre de Contrôles & Navigation Rapide -->
          <div class="player-controls-bar">
            <div class="player-ep-nav-controls">
              <button id="btn-prev-ep" class="btn btn-outline btn-sm">⏮ Ép. Précédent</button>
              <button id="btn-next-ep" class="btn btn-primary btn-sm">Ép. Suivant ⏭</button>
            </div>

            <!-- Sélecteur de Serveurs -->
            <div class="player-servers-container">
              <span class="servers-label">Serveur :</span>
              <div id="player-servers-list" class="server-chips"></div>
            </div>
          </div>

          <!-- Note informative -->
          <div class="player-notice" id="player-notice">
            <span>ℹ️</span>
            <p>Le <strong>Serveur 1 (Frembed)</strong> inclut le choix <strong>VF / VOSTFR</strong> directement dans les contrôles du lecteur. En cas de lenteur, change simplement de serveur.</p>
          </div>
        </div>

        <!-- Volet de Sélection des Épisodes -->
        <div class="player-episodes-panel">
          <div class="episodes-panel-header">
            <h3>Liste des Épisodes</h3>
            <div class="jump-mini-form">
              <input type="number" id="player-jump-input" min="1" placeholder="N°" class="jump-input">
              <button id="player-jump-btn" class="btn btn-outline btn-sm">Aller</button>
            </div>
          </div>

          <div id="player-ranges-tabs" class="episode-ranges-tabs"></div>
          <div id="player-episodes-grid" class="episodes-grid player-grid"></div>
        </div>
      </div>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    const hash = window.location.hash;
    const qs = hash.split('?')[1] || '';
    const params = new URLSearchParams(qs);

    this.animeId = params.get('animeId');
    const title = params.get('title') || 'Lecteur';
    const coverImage = params.get('cover') || '';
    this.currentEpisode = Math.max(1, parseInt(params.get('ep'), 10) || 1);
    this.currentSeason = Math.max(1, parseInt(params.get('sa'), 10) || 1);

    if (!this.animeId) {
      this.ui.toast('Aucun anime sélectionné.', 'error');
      this.router.navigate('/');
      return;
    }

    // Récupérer la fiche anime (mémoire locale ou stockage)
    this.currentAnime = this.storage?.getMedia(this.animeId) || {
      id: this.animeId,
      title,
      coverImage,
    };

    if (!this.currentAnime.episodes) {
      try {
        const fetched = await this.anilist.getMedia(this.animeId);
        if (fetched) {
          this.currentAnime = fetched;
          this.storage.saveMedia(fetched);
        }
      } catch (_) {}
    }

    this._bindControls();
    await this._loadStream();
    this._renderEpisodesList();
    this._setupKeybindings();
  }

  _bindControls() {
    const backBtn = this.element.querySelector('#player-back');
    backBtn.onclick = () => {
      this.router.navigate(`/anime/${encodeURIComponent(this.animeId)}`);
    };

    // Mode cinéma
    const cinemaBtn = this.element.querySelector('#player-cinema-btn');
    cinemaBtn.onclick = () => {
      this.cinemaMode = !this.cinemaMode;
      document.body.classList.toggle('cinema-dimmed', this.cinemaMode);
      cinemaBtn.classList.toggle('active', this.cinemaMode);
      cinemaBtn.textContent = this.cinemaMode ? '☀️ Quitter Cinéma' : '💡 Mode Cinéma';
    };

    // Plein écran
    const fsBtn = this.element.querySelector('#player-fullscreen-btn');
    const wrapper = this.element.querySelector('#player-wrapper');
    fsBtn.onclick = () => {
      if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };

    // Précédent / Suivant
    const prevBtn = this.element.querySelector('#btn-prev-ep');
    const nextBtn = this.element.querySelector('#btn-next-ep');

    prevBtn.onclick = () => {
      if (this.currentEpisode > 1) {
        this.switchEpisode(this.currentEpisode - 1);
      }
    };

    nextBtn.onclick = () => {
      const total = this.currentAnime.episodes || this.maxDisplayEpisodes;
      if (this.currentEpisode < total) {
        this.switchEpisode(this.currentEpisode + 1);
      }
    };

    // Saut direct
    const jumpInput = this.element.querySelector('#player-jump-input');
    const jumpBtn = this.element.querySelector('#player-jump-btn');
    const doJump = () => {
      const epNum = parseInt(jumpInput.value, 10);
      if (epNum > 0) {
        this.switchEpisode(epNum);
      }
    };
    jumpBtn.onclick = doJump;
    jumpInput.onkeydown = (e) => { if (e.key === 'Enter') doJump(); };
  }

  async _loadStream() {
    const titleEl = this.element.querySelector('#player-title');
    const badgeEl = this.element.querySelector('#player-badge-ep');
    const prevBtn = this.element.querySelector('#btn-prev-ep');
    const nextBtn = this.element.querySelector('#btn-next-ep');

    const titleText = this.currentAnime.title || 'Tsuki Player';
    titleEl.textContent = titleText;
    document.title = `${titleText} — Épisode ${this.currentEpisode} | Tsuki`;

    const isMovie = this.currentAnime.format === 'MOVIE';
    badgeEl.textContent = isMovie ? 'Film Complet' : `Épisode ${this.currentEpisode}`;

    prevBtn.disabled = this.currentEpisode <= 1;
    const total = this.currentAnime.episodes || this.maxDisplayEpisodes;
    nextBtn.disabled = !isMovie && this.currentEpisode >= total;

    // Enregistre dans l'historique et marque l'épisode comme vu
    this.storage.markEpisodeWatched(this.animeId, this.currentEpisode);
    this.storage.addHistory({
      ...this.currentAnime,
      id: this.animeId,
      episode: this.currentEpisode,
      watchedAt: Date.now(),
    });

    // Génère les sources
    this.sources = await this.streaming.getSourcesForEpisode(this.currentAnime, {
      season: this.currentSeason,
      episode: this.currentEpisode,
    });

    this._renderServers();
    this._playSource(this.sources[this.selectedSourceIndex] || this.sources[0]);
  }

  _renderServers() {
    const list = this.element.querySelector('#player-servers-list');
    list.innerHTML = '';

    this.sources.forEach((src, idx) => {
      const btn = document.createElement('button');
      btn.className = `server-chip ${idx === this.selectedSourceIndex ? 'active' : ''}`;
      btn.innerHTML = `<span>${this.ui.escapeHtml(src.name)}</span> ${src.badge ? `<small class="chip-badge">${src.badge}</small>` : ''}`;
      btn.onclick = () => {
        this.selectedSourceIndex = idx;
        this._renderServers();
        this._playSource(src);
      };
      list.appendChild(btn);
    });
  }

  _playSource(source) {
    const wrapper = this.element.querySelector('#player-wrapper');
    this._destroyHls();
    wrapper.innerHTML = '';

    const spinner = document.createElement('div');
    spinner.className = 'player-loading-spinner';
    spinner.innerHTML = `<div class="spinner"></div><span>Connexion au flux ${this.ui.escapeHtml(source.name)}…</span>`;
    wrapper.appendChild(spinner);

    if (source.type === 'iframe') {
      const iframe = document.createElement('iframe');
      iframe.className = 'player-embed-frame';
      iframe.src = source.url;
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.onload = () => {
        spinner.remove();
      };
      wrapper.appendChild(iframe);
    } else {
      // Lecteur natif HLS / Video
      const video = document.createElement('video');
      video.className = 'player-video-tag';
      video.controls = true;
      video.playsInline = true;
      video.poster = this.currentAnime.coverImage || '';

      wrapper.appendChild(video);

      if (source.url.includes('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        this.hls = hls;
        hls.loadSource(source.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          spinner.remove();
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, () => {
          spinner.remove();
          this.ui.toast('Erreur de flux direct. Essaie le Serveur 1 ou 2.', 'warning');
        });
      } else {
        video.src = source.url;
        video.oncanplay = () => {
          spinner.remove();
          video.play().catch(() => {});
        };
        video.onerror = () => {
          spinner.remove();
          this.ui.toast('Flux indisponible. Bascule sur un autre serveur.', 'warning');
        };
      }
    }
  }

  switchEpisode(ep) {
    this.currentEpisode = Math.max(1, ep);

    // Met à jour la tranche active pour qu'elle corresponde à l'épisode
    this.activeRangeIndex = Math.floor((this.currentEpisode - 1) / this.rangeSize);

    // Mise à jour de l'URL hash sans recharger toute la page
    const newHash = `#/lecteur?animeId=${encodeURIComponent(this.animeId)}&ep=${this.currentEpisode}&title=${encodeURIComponent(this.currentAnime.title || '')}&cover=${encodeURIComponent(this.currentAnime.coverImage || '')}`;
    history.replaceState(null, '', newHash);

    this._loadStream();
    this._renderEpisodesList();
  }

  _renderEpisodesList() {
    const container = this.element.querySelector('#player-episodes-grid');
    const rangesContainer = this.element.querySelector('#player-ranges-tabs');
    container.innerHTML = '';
    rangesContainer.innerHTML = '';

    const isMovie = this.currentAnime.format === 'MOVIE';
    if (isMovie) {
      const btn = document.createElement('button');
      btn.className = 'episode-btn active';
      btn.innerHTML = `Film Complet`;
      container.appendChild(btn);
      return;
    }

    const total = this.currentAnime.episodes || this.maxDisplayEpisodes;
    const watchedSet = this.storage.getWatchedEpisodes(this.animeId);

    // Onglets par tranches si > 25 épisodes
    if (total > this.rangeSize) {
      const numRanges = Math.ceil(total / this.rangeSize);
      for (let r = 0; r < numRanges; r++) {
        const start = r * this.rangeSize + 1;
        const end = Math.min((r + 1) * this.rangeSize, total);
        const tabBtn = document.createElement('button');
        tabBtn.className = `range-tab-btn ${r === this.activeRangeIndex ? 'active' : ''}`;
        tabBtn.textContent = `${start} – ${end}`;
        tabBtn.onclick = () => {
          this.activeRangeIndex = r;
          this._renderEpisodesList();
        };
        rangesContainer.appendChild(tabBtn);
      }
    }

    const rangeStart = this.activeRangeIndex * this.rangeSize + 1;
    const rangeEnd = Math.min((this.activeRangeIndex + 1) * this.rangeSize, total);

    const frag = document.createDocumentFragment();
    for (let i = rangeStart; i <= rangeEnd; i++) {
      const btn = document.createElement('button');
      const isActive = i === this.currentEpisode;
      const isWatched = watchedSet.has(i);

      btn.className = `episode-btn ${isActive ? 'active' : ''} ${isWatched ? 'watched' : ''}`;
      btn.innerHTML = `
        <span class="ep-num">Ép. ${i}</span>
        ${isWatched && !isActive ? '<span class="ep-badge-watched">✓</span>' : ''}
      `;
      btn.title = `Lire l'épisode ${i}`;
      btn.onclick = () => this.switchEpisode(i);
      frag.appendChild(btn);
    }
    container.appendChild(frag);
  }

  _setupKeybindings() {
    this._keyHandler = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        const total = this.currentAnime?.episodes || this.maxDisplayEpisodes;
        if (this.currentEpisode < total) this.switchEpisode(this.currentEpisode + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        if (this.currentEpisode > 1) this.switchEpisode(this.currentEpisode - 1);
      } else if (e.key === 'c' || e.key === 'C') {
        const btn = this.element.querySelector('#player-cinema-btn');
        btn?.click();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  _destroyHls() {
    if (this.hls) {
      try { this.hls.destroy(); } catch (_) {}
      this.hls = null;
    }
  }

  destroy() {
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    document.body.classList.remove('cinema-dimmed');
    this._destroyHls();
  }
}
