/* ==========================================================================
   Tsuki — Page Détail d'un anime
   Affichage complet, sélection d'épisodes par tranches & lecture débloquée
   ========================================================================== */

export class DetailPage {
  constructor({ router, anilist, animedoc, frembed, streaming, ui, storage, params = {} } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.frembed = frembed;
    this.streaming = streaming;
    this.ui = ui;
    this.storage = storage;
    this.params = params;
    this.element = null;
    this.mediaId = null;
    this.media = null;
    this.activeRangeIndex = 0;
    this.rangeSize = 25;
    this.maxDisplayEpisodes = 50;
  }

  async render() {
    const section = document.createElement('section');
    section.className = 'page detail-page';
    section.innerHTML = `
      <header class="page-header detail-header">
        <button class="btn btn-back" id="detail-back">← Retour</button>
        <h1 id="detail-title">Chargement…</h1>
        <div class="detail-meta" id="detail-meta"></div>
      </header>

      <div class="detail-body">
        <div class="detail-poster">
          <img id="detail-poster" src="" alt="" loading="lazy">
        </div>
        <div class="detail-info">
          <div class="detail-score" id="detail-score"></div>
          <div class="detail-synopsis" id="detail-synopsis"></div>
          <div class="detail-tags" id="detail-tags"></div>
          <div class="detail-actions">
            <button id="detail-watch" class="btn btn-primary btn-large">🎬 Regarder l'épisode 1</button>
            <button id="detail-trailer" class="btn btn-outline" style="display:none;">🍿 Bande-annonce</button>
            <button id="detail-fav" class="btn btn-outline">☆ Favoris</button>
            <button id="detail-share" class="btn btn-outline">🔗 Partager</button>
          </div>
          <div class="detail-list-action">
            <select id="detail-list-select" aria-label="Choisir une liste"></select>
            <button id="detail-add-list" class="btn btn-outline">＋ Ajouter à la liste</button>
          </div>
        </div>
      </div>

      <section class="detail-section" id="section-episodes">
        <div class="section-row">
          <h2>Épisodes disponibles</h2>
          <div class="episode-quick-jump">
            <label for="jump-ep-input" class="jump-label">Aller à l'ép. :</label>
            <input type="number" id="jump-ep-input" min="1" placeholder="N°" class="jump-input">
            <button id="jump-ep-btn" class="btn btn-outline btn-sm">OK</button>
          </div>
        </div>
        <div id="detail-episode-ranges" class="episode-ranges-tabs"></div>
        <div id="detail-episodes" class="episodes-grid"></div>
      </section>

      <section class="detail-section">
        <h2>Personnages</h2>
        <div id="detail-characters" class="characters-list"></div>
      </section>

      <section class="detail-section">
        <h2>Staff & Production</h2>
        <div id="detail-staff" class="staff-list"></div>
      </section>

      <section class="detail-section">
        <h2>Liens externes</h2>
        <div id="detail-links"></div>
      </section>
    `;
    this.element = section;
    return section;
  }

  async onMount() {
    const btnBack = this.element.querySelector('#detail-back');
    btnBack.onclick = () => window.history.back();

    const mediaId = this.params.id;
    if (!mediaId) {
      this.element.querySelector('#detail-title').textContent = 'Anime introuvable';
      return;
    }
    this.mediaId = mediaId;
    await this.load();
  }

  async load() {
    const poster = this.element.querySelector('#detail-poster');
    const titleEl = this.element.querySelector('#detail-title');
    const metaEl = this.element.querySelector('#detail-meta');
    const scoreEl = this.element.querySelector('#detail-score');
    const synopsisEl = this.element.querySelector('#detail-synopsis');
    const tagsEl = this.element.querySelector('#detail-tags');
    const episodesEl = this.element.querySelector('#detail-episodes');
    const rangesEl = this.element.querySelector('#detail-episode-ranges');
    const charsEl = this.element.querySelector('#detail-characters');
    const staffEl = this.element.querySelector('#detail-staff');
    const linksEl = this.element.querySelector('#detail-links');
    const watchBtn = this.element.querySelector('#detail-watch');
    const trailerBtn = this.element.querySelector('#detail-trailer');
    const favBtn = this.element.querySelector('#detail-fav');

    poster.src = '';
    titleEl.textContent = 'Chargement…';
    episodesEl.innerHTML = '';
    rangesEl.innerHTML = '';
    charsEl.innerHTML = '';
    staffEl.innerHTML = '';
    linksEl.innerHTML = '';

    this.media = null;

    // 1. Snapshot local ou catalogue démo
    try {
      this.media = this.storage.getMedia(this.mediaId);
      const { getDemoAnime } = await import('../demo-data.js');
      this.media ||= getDemoAnime(this.mediaId);
    } catch (e) {
      console.warn('Données locales non trouvées', e);
    }

    // 2. Récupération distante AniList
    if (!this.media) {
      try {
        this.media = await this.anilist.getMedia(this.mediaId);
      } catch (e) {
        console.warn('Fiche anime distante indisponible', e);
      }
    }

    if (!this.media) {
      titleEl.textContent = 'Anime introuvable';
      return;
    }
    this.storage.saveMedia(this.media);

    // Titre & Bannière
    titleEl.textContent = this.media.title;
    if (this.media.bannerImage) {
      this.element.style.setProperty('--detail-banner', `url("${this.media.bannerImage}")`);
      this.element.classList.add('has-detail-banner');
    }

    // Affiche
    poster.src = this.media.coverImage || this.media.coverImageMedium || this.ui.posterFallback(this.media.title, 620, 900);
    poster.onerror = () => {
      poster.onerror = null;
      poster.src = this.ui.posterFallback(this.media.title, 620, 900);
    };
    poster.alt = `Affiche de ${this.media.title}`;

    // Métadonnées
    const year = this.media.startDate ? this.media.startDate.slice(0, 4) : (this.media.year || '');
    const metaParts = [
      this.media.format,
      this.media.status === 'FINISHED' ? 'Terminé' : (this.media.status === 'RELEASING' ? 'En cours' : this.media.status),
      year,
      this.ui.formatDuration(this.media.duration),
      this.media.episodes ? `${this.media.episodes} épisode(s)` : (this.media.format === 'MOVIE' ? 'Film' : 'Épisodes en cours'),
    ].filter(Boolean);
    metaEl.innerHTML = metaParts.join(' · ');

    // Score & Popularité
    scoreEl.innerHTML = `
      <span class="score-badge">${this.ui.formatScore(this.media.averageScore)} / 10</span>
      <span class="score-pop">Popularité : ${Math.round(this.media.popularity || 0)}</span>
    `;

    // Synopsis
    synopsisEl.innerHTML = this.media.description
      ? `<p>${this.ui.escapeHtml(this.media.description)}</p>`
      : '<p>Aucun synopsis disponible.</p>';

    // Tags
    const tags = [...(this.media.genres || []), ...(this.media.studios?.slice(0, 3) || [])];
    tagsEl.innerHTML = tags.map((t) => `<span class="tag">${this.ui.escapeHtml(t)}</span>`).join('');

    // Bouton Regarder : TOUJOURS ACTIF & DÉBLOQUÉ
    const isMovie = this.media.format === 'MOVIE';
    watchBtn.disabled = false;
    watchBtn.textContent = isMovie ? '🎬 Lancer le film' : '🎬 Regarder l\'épisode 1';
    watchBtn.title = 'Accéder au lecteur vidéo';
    watchBtn.onclick = () => {
      this.router.navigate(
        `/lecteur?animeId=${encodeURIComponent(this.mediaId)}&ep=1&title=${encodeURIComponent(this.media.title)}&cover=${encodeURIComponent(this.media.coverImage || '')}`
      );
    };

    // Bouton Trailer YouTube
    if (this.media.trailer && this.media.trailer.id) {
      trailerBtn.style.display = 'inline-flex';
      trailerBtn.onclick = () => {
        this.ui.openModal(`
          <div class="trailer-modal-container">
            <h3 style="margin-bottom:1rem;font-size:1.2rem;">${this.ui.escapeHtml(this.media.title)} — Bande-annonce</h3>
            <div class="video-responsive-embed">
              <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.media.trailer.id)}?autoplay=1"
                      allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
            </div>
          </div>
        `);
      };
    }

    // Favori
    const isFav = this.storage.isFavorite(this.media.id);
    favBtn.textContent = isFav ? '★ Retirer des favoris' : '☆ Favoris';
    favBtn.onclick = () => {
      const added = this.storage.toggleFavorite(this.media.id);
      favBtn.textContent = added ? '★ Retirer des favoris' : '☆ Favoris';
      this.ui.toast(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
    };

    // Listes
    const listSelect = this.element.querySelector('#detail-list-select');
    const lists = this.storage.getLists();
    listSelect.replaceChildren(...Object.keys(lists).map((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      return option;
    }));
    this.element.querySelector('#detail-add-list').onclick = () => {
      this.storage.addToList(listSelect.value, this.media);
      this.ui.toast(`Ajouté à « ${listSelect.value} »`, 'success');
    };

    // Partager
    this.element.querySelector('#detail-share').onclick = () => {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: this.media.title, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => this.ui.toast('Lien copié dans le presse-papier !'));
      }
    };

    // Rendu des Épisodes
    this._renderEpisodesNavigator(this.media);

    // Personnages / Staff
    this._renderList(charsEl, this.media.characters || [], 'personnage');
    this._renderList(staffEl, this.media.staff || [], 'staff');

    // Liens externes
    this._renderLinks(linksEl, this.media.externalLinks || []);
  }

  _renderEpisodesNavigator(media) {
    const container = this.element.querySelector('#detail-episodes');
    const rangesContainer = this.element.querySelector('#detail-episode-ranges');
    const jumpInput = this.element.querySelector('#jump-ep-input');
    const jumpBtn = this.element.querySelector('#jump-ep-btn');

    container.innerHTML = '';
    rangesContainer.innerHTML = '';

    const isMovie = media.format === 'MOVIE';
    if (isMovie) {
      const movieBtn = document.createElement('button');
      movieBtn.className = 'btn btn-primary btn-large movie-play-card';
      movieBtn.innerHTML = `<span>▶</span> <div><strong>Film Complet</strong><small>Clique pour lancer le lecteur</small></div>`;
      movieBtn.onclick = () => {
        this.router.navigate(
          `/lecteur?animeId=${encodeURIComponent(media.id)}&ep=1&title=${encodeURIComponent(media.title)}&cover=${encodeURIComponent(media.coverImage || '')}`
        );
      };
      container.appendChild(movieBtn);
      return;
    }

    const total = media.episodes || this.maxDisplayEpisodes;
    const watchedSet = this.storage.getWatchedEpisodes(media.id);

    // Saut direct
    const doJump = () => {
      const epNum = parseInt(jumpInput.value, 10);
      if (epNum > 0) {
        this.router.navigate(
          `/lecteur?animeId=${encodeURIComponent(media.id)}&ep=${epNum}&title=${encodeURIComponent(media.title)}&cover=${encodeURIComponent(media.coverImage || '')}`
        );
      }
    };
    jumpBtn.onclick = doJump;
    jumpInput.onkeydown = (e) => { if (e.key === 'Enter') doJump(); };

    // Si plus de 25 épisodes, génère des tranches d'onglets
    if (total > this.rangeSize) {
      const numRanges = Math.ceil(total / this.rangeSize);
      for (let r = 0; r < numRanges; r++) {
        const start = r * this.rangeSize + 1;
        const end = Math.min((r + 1) * this.rangeSize, total);
        const tabBtn = document.createElement('button');
        tabBtn.className = `range-tab-btn ${r === this.activeRangeIndex ? 'active' : ''}`;
        tabBtn.textContent = `Ép. ${start} – ${end}`;
        tabBtn.onclick = () => {
          this.activeRangeIndex = r;
          this._renderEpisodesNavigator(media);
        };
        rangesContainer.appendChild(tabBtn);
      }
    }

    const rangeStart = this.activeRangeIndex * this.rangeSize + 1;
    const rangeEnd = Math.min((this.activeRangeIndex + 1) * this.rangeSize, total);

    const frag = document.createDocumentFragment();
    for (let i = rangeStart; i <= rangeEnd; i++) {
      const btn = document.createElement('button');
      const isWatched = watchedSet.has(i);
      btn.className = `episode-btn ${isWatched ? 'watched' : ''}`;
      btn.innerHTML = `
        <span class="ep-num">Ép. ${i}</span>
        ${isWatched ? '<span class="ep-badge-watched" title="Déjà visionné">✓ Vu</span>' : ''}
      `;
      btn.title = `Regarder l'épisode ${i}`;
      btn.onclick = () => {
        this.router.navigate(
          `/lecteur?animeId=${encodeURIComponent(media.id)}&ep=${i}&title=${encodeURIComponent(media.title)}&cover=${encodeURIComponent(media.coverImage || '')}`
        );
      };
      frag.appendChild(btn);
    }
    container.appendChild(frag);

    // Si le nombre total n'est pas renseigné (anime en cours)
    if (!media.episodes) {
      const moreBtn = document.createElement('button');
      moreBtn.className = 'btn btn-outline btn-load-more-episodes';
      moreBtn.textContent = '＋ Charger 25 épisodes de plus';
      moreBtn.onclick = () => {
        this.maxDisplayEpisodes += 25;
        this._renderEpisodesNavigator(media);
      };
      container.appendChild(moreBtn);
    }
  }

  _renderList(container, items, type) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.innerHTML = '<p class="empty">Non renseigné.</p>';
      return;
    }
    items.slice(0, 15).forEach((item) => {
      const card = document.createElement('div');
      card.className = 'credit-card';
      const img = item.image
        ? `<img src="${this.ui.escapeHtml(item.image)}" alt="" loading="lazy">`
        : `<div class="credit-avatar">${this.ui.escapeHtml((item.name || '?').slice(0, 1))}</div>`;
      card.innerHTML = `
        ${img}
        <div class="credit-info">
          <div class="credit-name">${this.ui.escapeHtml(item.name || item.title || 'Inconnu')}</div>
          <div class="credit-role">${this.ui.escapeHtml(item.role || (type === 'staff' ? (item.primaryOccupations?.join(', ') || '') : ''))}</div>
        </div>
      `;
      const creditImage = card.querySelector('img');
      if (creditImage) {
        creditImage.onerror = () => {
          creditImage.outerHTML = `<div class="credit-avatar">${this.ui.escapeHtml((item.name || '?').slice(0, 1))}</div>`;
        };
      }
      container.appendChild(card);
    });
  }

  _renderLinks(container, links) {
    container.innerHTML = '';
    const relevant = (links || []).filter((l) => ['TMDB', 'IMDb', 'AniList', 'Crunchyroll', 'Official Site', 'Wikipedia'].includes(l.site));
    if (relevant.length === 0) {
      container.innerHTML = '<p class="empty">Aucun lien externe.</p>';
      return;
    }
    relevant.forEach((l) => {
      const a = document.createElement('a');
      a.href = l.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-chip';
      a.textContent = l.site;
      container.appendChild(a);
    });
  }
}
