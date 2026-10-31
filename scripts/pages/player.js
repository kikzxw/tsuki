/* ==========================================================================
   Tsuki — Page Lecteur (flux de test par défaut + sources AnimeDoc)
   ========================================================================== */

export class PlayerPage {
  constructor({ router, anilist, animedoc, frembed, ui, storage } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.frembed = frembed;
    this.ui = ui;
    this.storage = storage;
    this.element = null;
    this.hls = null;
    this.currentSources = [];
    this.currentEpisode = 1;
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page player-page';
    section.innerHTML = `
      <header class="page-header player-header">
        <button class="btn btn-back" id="player-back">← Retour</button>
        <h1 id="player-title">Lecteur</h1>
        <div id="player-status" class="player-status"></div>
      </header>

      <div class="player-container">
        <div class="player-wrapper" id="player-wrapper">
          <video id="videoPlayer" controls playsinline preload="metadata" poster=""></video>
        </div>
        <div class="player-info" id="player-info"></div>
      </div>

      <div class="player-sources" id="player-sources">
        <!-- Sélecteur de qualité / source -->
      </div>

      <div class="player-episodes" id="player-episodes">
        <!-- Liste des épisodes -->
      </div>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    const back = this.element.querySelector('#player-back');
    back.onclick = () => this.router.navigate('/');

    const hash = window.location.hash;
    const qs = hash.split('?')[1] || '';
    const params = new URLSearchParams(qs);
    const animeId = params.get('animeId');
    const ep = params.get('ep');
    const title = params.get('title') || 'Lecteur';
    const coverImage = params.get('cover') || '';

    this.currentEpisode = Math.max(1, Number.parseInt(ep, 10) || 1);
    this.currentAnime = this.storage?.getMedia(animeId) || { id: animeId, title, coverImage };
    this.element.querySelector('#player-title').textContent = title;

    const wrapper = this.element.querySelector('#player-wrapper');
    const info = this.element.querySelector('#player-info');
    const sourcesEl = this.element.querySelector('#player-sources');
    const episodesEl = this.element.querySelector('#player-episodes');
    const video = this.element.querySelector('#videoPlayer');
    video.poster = coverImage;

    if (!animeId) {
      info.innerHTML = `<p class="empty">Aucun anime spécifié.</p>`;
      return;
    }

    // Charger les sources depuis AnimeDoc si clé configurée
    try {
      const sourcesData = await this.animedoc.getMediaSources(animeId);
      this.currentSources = this._extractSources(sourcesData);
    } catch (e) {
      console.warn('Impossible de charger les sources AnimeDoc', e);
    }

    if (this.currentSources.length === 0) {
      info.innerHTML = '<div class="empty-state compact-empty"><span>◌</span><h2>Aucun lecteur disponible</h2><p>La fiche reste dans ton historique. Réessaie plus tard ou choisis un autre anime.</p><a class="btn btn-outline" href="#/anime/' + encodeURIComponent(animeId) + '">Revenir à la fiche</a></div>';
      this.storage?.addHistory({ ...this.currentAnime, id: animeId, title, coverImage, episode: this.currentEpisode });
      video.remove();
      return;
    } else {
      info.innerHTML = `<p>${this.currentSources.length} source(s) disponible(s)</p>`;
    }
    this.storage?.addHistory({ ...this.currentAnime, id: animeId, title, coverImage, episode: this.currentEpisode });

    // Sélecteur de qualité
    sourcesEl.innerHTML = '';
    if (this.currentSources.length > 1) {
      const label = document.createElement('label');
      label.textContent = 'Qualité :';
      label.style.fontSize = '0.85rem';
      label.style.color = 'var(--text-muted)';
      sourcesEl.appendChild(label);
      this.currentSources.forEach((src, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline';
        btn.textContent = src.quality;
        btn.onclick = () => this._playSource(src, video);
        sourcesEl.appendChild(btn);
      });
    }

    // Jouer la première source
    this._playSource(this.currentSources[0], video);

    // Liste des épisodes
    this._renderEpisodes(episodesEl, animeId);
  }

  _extractSources(data) {
    const out = [];
    const d = data?.data || data || {};
    const list = d.sources || d.mediaSources || d.urls || [];
    if (!Array.isArray(list)) return out;
    list.forEach((s) => {
      if (s.url) {
        out.push({
          url: s.url,
          quality: s.quality || s.resolution || 'auto',
          type: s.type || s.mime || (s.url.includes('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp4'),
          isM3U8: s.url.includes('.m3u8'),
        });
      }
    });
    return out;
  }

  _playSource(source, video) {
    if (!source || !video) return;
    this._destroyHls();
    video.pause();
    video.removeAttribute('src');
    video.load();

    if (source.isM3U8 && typeof Hls !== 'undefined' && Hls.isSupported()) {
      const hls = new Hls();
      this.hls = hls;
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, () => {
        this.ui.toast('Erreur de lecture du flux HLS.', 'error');
      });
    } else {
      video.src = source.url;
      video.play().catch(() => {});
    }
  }

  _destroyHls() {
    if (this.hls) {
      try { this.hls.destroy(); } catch (_) {}
      this.hls = null;
    }
  }

  _renderEpisodes(container, animeId) {
    container.innerHTML = '';
    const limit = 20;
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= limit; i++) {
      const btn = document.createElement('button');
      btn.className = 'episode-btn' + (i === this.currentEpisode ? ' active' : '');
      btn.textContent = `Ép. ${i}`;
      btn.onclick = () => {
        this.currentEpisode = i;
        this.router.navigate(`/lecteur?animeId=${encodeURIComponent(animeId)}&ep=${i}&title=${encodeURIComponent(this.currentAnime.title || 'Lecteur')}&cover=${encodeURIComponent(this.currentAnime.coverImage || '')}`);
      };
      frag.appendChild(btn);
    }
    container.appendChild(frag);
  }

  destroy() {
    const wrapper = this.element?.querySelector('#player-wrapper');
    if (wrapper) wrapper.innerHTML = '';
    this._destroyHls();
  }
}
