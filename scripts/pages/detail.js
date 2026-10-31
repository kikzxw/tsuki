/* ==========================================================================
   Tsuki — Page Détail d'un anime (catalogue démo embarqué en priorité)
   ========================================================================== */

export class DetailPage {
  constructor({ router, anilist, animedoc, frembed, ui, storage, params = {} } = {}) {
    this.router = router;
    this.anilist = anilist;
    this.animedoc = animedoc;
    this.frembed = frembed;
    this.ui = ui;
    this.storage = storage;
    this.params = params;
    this.element = null;
    this.mediaId = null;
    this.media = null;
    this.videoSources = [];
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
          <div id="detail-score"></div>
          <div id="detail-synopsis"></div>
          <div class="detail-tags" id="detail-tags"></div>
          <div class="detail-actions">
            <button id="detail-watch" class="btn btn-primary btn-large">🎬 Regarder</button>
            <button id="detail-fav" class="btn btn-outline">☆ Favoris</button>
            <button id="detail-share" class="btn btn-outline">🔗 Partager</button>
          </div>
          <div class="detail-list-action"><select id="detail-list-select" aria-label="Choisir une liste"></select><button id="detail-add-list" class="btn btn-outline">＋ Ajouter à la liste</button></div>
        </div>
      </div>

      <section class="detail-section">
        <h2>Épisodes</h2>
        <div id="detail-episodes"></div>
      </section>

      <section class="detail-section">
        <h2>Personnages</h2>
        <div id="detail-characters" class="characters-list"></div>
      </section>

      <section class="detail-section">
        <h2>Staff</h2>
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
    btnBack.onclick = () => this.router.navigate('/');

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
    const charsEl = this.element.querySelector('#detail-characters');
    const staffEl = this.element.querySelector('#detail-staff');
    const linksEl = this.element.querySelector('#detail-links');
    const watchBtn = this.element.querySelector('#detail-watch');
    const favBtn = this.element.querySelector('#detail-fav');

    poster.src = '';
    titleEl.textContent = 'Chargement…';
    episodesEl.innerHTML = '';
    charsEl.innerHTML = '';
    staffEl.innerHTML = '';
    linksEl.innerHTML = '';

    this.media = null;
    this.videoSources = [];

    // Reuse the full metadata snapshot first, then the bundled fallback catalogue.
    try {
      this.media = this.storage.getMedia(this.mediaId);
      if (this.media) this.videoSources = this._extractVideoSources(this.media);
      const { getDemoAnime } = await import('../demo-data.js');
      this.media ||= getDemoAnime(this.mediaId);
    } catch (e) {
      console.warn('Demo data indisponible', e);
    }

    // Fetch current metadata for any item not already available locally.
    if (!this.media) {
      try {
        this.media = await this.anilist.getMedia(this.mediaId);
      } catch (e) {
        console.warn('Fiche anime indisponible', e);
      }
    }

    if (this.media && !this.videoSources.length) {
      try {
        const sources = await this.animedoc.getMediaSources(this.mediaId);
        this.videoSources = this._extractVideoSources(sources);
      } catch (e) {
        console.info('Lecture non disponible pour cette fiche.');
      }
    }
    if (!this.media) { titleEl.textContent = 'Anime introuvable'; return; }
    this.storage.saveMedia(this.media);

    // Rendu des métadonnées
    titleEl.textContent = this.media.title;
    if (this.media.bannerImage) {
      this.element.style.setProperty('--detail-banner', `url("${this.media.bannerImage}")`);
      this.element.classList.add('has-detail-banner');
    }
    poster.src = this.media.coverImage || this.media.coverImageMedium || this.ui.posterFallback(this.media.title, 620, 900);
    poster.onerror = () => { poster.onerror = null; poster.src = this.ui.posterFallback(this.media.title, 620, 900); };
    poster.alt = `Affiche de ${this.media.title}`;

    const year = this.media.startDate ? this.media.startDate.slice(0, 4) : (this.media.year || '');
    const metaParts = [this.media.format, this.media.status, year, this.ui.formatDuration(this.media.duration)].filter(Boolean);
    metaEl.innerHTML = metaParts.join(' · ');

    scoreEl.innerHTML = `
      <span class="score-badge">${this.ui.formatScore(this.media.averageScore)} / 10</span>
      <span class="score-pop">Popularité : ${Math.round(this.media.popularity || 0)}</span>
    `;

    synopsisEl.innerHTML = this.media.description
      ? `<p>${this.ui.escapeHtml(this.media.description)}</p>`
      : '<p>Aucun synopsis disponible.</p>';

    const tags = [...(this.media.genres || []), ...(this.media.studios?.slice(0, 3) || [])];
    tagsEl.innerHTML = tags.map((t) => `<span class="tag">${this.ui.escapeHtml(t)}</span>`).join('');

    // Favori
    const isFav = this.storage.isFavorite(this.media.id);
    favBtn.textContent = isFav ? '★ Retirer des favoris' : '☆ Ajouter aux favoris';
    favBtn.onclick = () => {
      const added = this.storage.toggleFavorite(this.media.id);
      favBtn.textContent = added ? '★ Retirer des favoris' : '☆ Ajouter aux favoris';
      this.ui.toast(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
    };

    // Playback is only enabled for an actual playable source.
    const hasVideo = this.videoSources.length > 0;
    watchBtn.disabled = !hasVideo;
    watchBtn.title = hasVideo ? 'Lancer la lecture' : 'Lecture indisponible pour le moment';
    watchBtn.onclick = () => {
      if (hasVideo) {
        this.router.navigate(`/lecteur?animeId=${encodeURIComponent(this.mediaId)}&title=${encodeURIComponent(this.media.title)}&cover=${encodeURIComponent(this.media.coverImage || '')}`);
      }
    };

    const listSelect = this.element.querySelector('#detail-list-select');
    const lists = this.storage.getLists();
    listSelect.replaceChildren(...Object.keys(lists).map((name) => {
      const option = document.createElement('option'); option.value = name; option.textContent = name; return option;
    }));
    this.element.querySelector('#detail-add-list').onclick = () => {
      this.storage.addToList(listSelect.value, this.media);
      this.ui.toast(`Ajouté à « ${listSelect.value} »`, 'success');
    };

    // Partager
    this.element.querySelector('#detail-share').onclick = () => {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: this.media.title, url });
      } else {
        navigator.clipboard.writeText(url).then(() => this.ui.toast('Lien copié'));
      }
    };

    // Épisodes
    this._renderEpisodes(episodesEl, this.media.episodes || 0);

    // Personnages / Staff
    this._renderList(charsEl, this.media.characters || [], 'personnage');
    this._renderList(staffEl, this.media.staff || [], 'staff');

    // Liens externes
    this._renderLinks(linksEl, this.media.externalLinks || []);
  }

  _normalizeAnimedocDetail(details) {
    const d = details?.data || details || {};
    if (!d && !details.title) return null;
    return {
      id: String(d.id || details.id || this.mediaId),
      title: d.title || details.title || 'Sans titre',
      titleRomaji: d.titleRomaji || details.titleRomaji,
      titleEnglish: d.titleEnglish || details.titleEnglish,
      description: d.description || details.description || null,
      format: d.format || details.format || 'TV',
      status: d.status || details.status || null,
      episodes: d.episodes || details.episodes || d.episodeCount || null,
      duration: d.duration || details.duration || null,
      averageScore: d.score || d.averageScore || details.score || details.averageScore || null,
      popularity: d.popularity || details.popularity || 0,
      coverImage: d.coverImage || d.poster || details.coverImage || details.poster || null,
      bannerImage: d.bannerImage || details.bannerImage || null,
      genres: d.genres || details.genres || [],
      studios: d.studios || details.studios || [],
      characters: (d.characters || details.characters || []).map((c) => ({
        id: String(c.id), name: c.name || c.fullName, image: c.image || c.coverImage, role: c.role || null,
      })),
      staff: (d.staff || details.staff || []).map((s) => ({
        id: String(s.id), name: s.name || s.fullName, image: s.image || s.coverImage, role: s.role || null,
      })),
      externalLinks: d.externalLinks || details.externalLinks || [],
      startDate: d.startDate || details.startDate || null,
      endDate: d.endDate || details.endDate || null,
      source: 'animedoc',
    };
  }

  _extractVideoSources(sources) {
    const out = [];
    const data = sources?.data || sources || {};
    const list = data.sources || data.mediaSources || data.urls || [];
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

  _renderEpisodes(container, total) {
    container.innerHTML = '';
    if (!total || total <= 0) {
      container.innerHTML = '<p class="empty">Nombre d\'épisodes non renseigné.</p>';
      return;
    }
    const limit = Math.min(total, 50);
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= limit; i++) {
      const btn = document.createElement('button');
      btn.className = 'episode-btn';
      btn.textContent = `Ép. ${i}`;
      btn.disabled = this.videoSources.length === 0;
      btn.title = btn.disabled ? 'Lecture indisponible pour cet anime' : `Lire l'épisode ${i}`;
      btn.onclick = () => {
        if (!this.videoSources.length) return;
        this.router.navigate(`/lecteur?animeId=${encodeURIComponent(this.mediaId)}&ep=${i}&title=${encodeURIComponent(this.media.title)}&cover=${encodeURIComponent(this.media.coverImage || '')}`);
      };
      frag.appendChild(btn);
    }
    container.appendChild(frag);
    if (total > limit) {
      const more = document.createElement('p');
      more.className = 'empty';
      more.textContent = `…et ${total - limit} autre(s) épisode(s).`;
      container.appendChild(more);
    }
  }

  _renderList(container, items, type) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.innerHTML = '<p class="empty">Non renseigné.</p>';
      return;
    }
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'credit-card';
      const img = item.image ? `<img src="${this.ui.escapeHtml(item.image)}" alt="" loading="lazy">` : `<div class="credit-avatar">?</div>`;
      card.innerHTML = `
        ${img}
        <div class="credit-info">
          <div class="credit-name">${this.ui.escapeHtml(item.name || item.title || 'Inconnu')}</div>
          <div class="credit-role">${this.ui.escapeHtml(item.role || (type === 'staff' ? (item.primaryOccupations?.join(', ') || '') : ''))}</div>
        </div>
      `;
      const creditImage = card.querySelector('img');
      if (creditImage) creditImage.onerror = () => { creditImage.outerHTML = `<div class="credit-avatar">${this.ui.escapeHtml((item.name || '?').slice(0, 1))}</div>`; };
      container.appendChild(card);
    });
  }

  _renderLinks(container, links) {
    container.innerHTML = '';
    const relevant = links.filter((l) => ['TMDB', 'IMDb', 'AniList', 'Official', 'Wikipedia'].includes(l.site));
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
