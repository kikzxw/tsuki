/* ==========================================================================
   Tsuki — Bibliothèque UI (composants réutilisables)
   ========================================================================== */

export class UI {
  constructor({ elements } = {}) {
    this.elements = elements || {};
    this._toastTimer = null;
  }

  // --- Utilitaires DOM ---
  escapeHtml(text) {
    if (text == null) return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  posterFallback(title = 'Anime', width = 440, height = 640) {
    const safeTitle = this.escapeHtml(title).slice(0, 70);
    const artwork = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#56364f"/><stop offset="1" stop-color="#18121d"/></linearGradient><radialGradient id="r"><stop stop-color="#d986aa" stop-opacity=".42"/><stop offset="1" stop-color="#d986aa" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${width * .75}" cy="${height * .23}" r="${width * .55}" fill="url(#r)"/><text x="8%" y="83%" fill="#fff0f7" font-family="sans-serif" font-size="${Math.round(width * .062)}" font-weight="700">${safeTitle}</text><text x="9%" y="91%" fill="#e9a4c2" font-family="sans-serif" font-size="${Math.round(width * .03)}" letter-spacing="5">TSUKI LIBRARY</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artwork)}`;
  }

  // --- Toast ---
  toast(message, type = 'info', duration = 3000) {
    const t = this.elements.toast;
    if (!t) return;
    clearTimeout(this._toastTimer);
    t.textContent = message;
    t.className = 'toast show ' + type;
    this._toastTimer = setTimeout(() => t.classList.remove('show'), duration);
  }

  // --- Page statique simple ---
  renderStatic(title, htmlContent) {
    const section = document.createElement('section');
    section.className = 'page static-page';
    section.innerHTML = `
      <header class="page-header">
        <h1>${this.escapeHtml(title)}</h1>
      </header>
      <div class="page-content">${htmlContent}</div>
    `;
    return section;
  }

  // --- Skeleton de chargement ---
  renderSkeleton(count = 6, containerClass = 'grid') {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'card skeleton';
      card.innerHTML = `
        <div class="card-media"><div class="skeleton-img"></div></div>
        <div class="card-info">
          <div class="skeleton-text" style="width:80%"></div>
          <div class="skeleton-text" style="width:60%;margin-top:0.5rem"></div>
        </div>
      `;
      frag.appendChild(card);
    }
    const wrapper = document.createElement('div');
    wrapper.className = containerClass;
    wrapper.appendChild(frag);
    return wrapper;
  }

  // --- Carte d'anime (reusable sur plusieurs pages) ---
  renderCard(media, { clickable = true, showFav = true, isFavorite = false } = {}) {
    const card = document.createElement('article');
    card.style.setProperty('--card-index', document.querySelectorAll('.card').length % 12);
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'gridcell');
    card.setAttribute('aria-label', media.title || 'Anime');

    const score = media.averageScore ? `<span class="badge badge--score">★ ${(media.averageScore / 10).toFixed(1)}</span>` : '';
    const year = media.startDate ? media.startDate.slice(0, 4) : '';
    const format = media.format || '';
    const image = media.coverImage || media.coverImageMedium || '';

    card.innerHTML = `
      <div class="card-media" style="position:relative;">
        <img src="${this.escapeHtml(image)}" alt="Affiche de ${this.escapeHtml(media.title)}"
             loading="lazy" width="220" height="320"
             >
        ${score}${year ? `<span class="badge badge--year">${year}</span>` : ''}
      </div>
      <div class="card-info">
        <h3 class="card-title">${this.escapeHtml(media.title)}</h3>
        <div class="card-meta">${this.escapeHtml(format)} · ${year}</div>
      </div>
      ${showFav ? `
        <button class="card-fav anime-fav" aria-label="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
                data-id="${media.id}">
          ${isFavorite ? '★' : '☆'}
        </button>
      ` : ''}
    `;

    const poster = card.querySelector('img');
    const useFallback = () => {
      poster.onerror = null;
      poster.src = this.posterFallback(media.title || 'Anime');
    };
    poster.addEventListener('error', useFallback, { once: true });
    if (!image) useFallback();

    if (clickable) {
      card.onclick = () => {
        // Navigation via router externe (appelée depuis la page)
        if (card._onClick) card._onClick(media);
      };
      card.onkeydown = (e) => { if (e.key === 'Enter' && card._onClick) card._onClick(media); };
    }

    const favBtn = card.querySelector('.anime-fav');
    if (favBtn) {
      favBtn.onclick = (e) => {
        e.stopPropagation();
        if (favBtn._onToggle) {
          const added = favBtn._onToggle(media.id);
          if (typeof added === 'boolean') {
            favBtn.textContent = added ? '★' : '☆';
            favBtn.setAttribute('aria-label', added ? 'Retirer des favoris' : 'Ajouter aux favoris');
          }
        }
      };
    }

    return card;
  }

  // --- Grille de résultats ---
  renderGrid(cards, containerClass = 'grid') {
    const grid = document.createElement('div');
    grid.className = containerClass;
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', 'Résultats');
    cards.forEach((c) => grid.appendChild(c));
    return grid;
  }

  // --- Vide / Erreur ---
  renderEmpty(message, type = 'info') {
    const div = document.createElement('p');
    div.className = `empty ${type}`;
    div.textContent = message;
    return div;
  }

  // --- Modale globale ---
  openModal(contentHtml, onClose) {
    const modal = this.elements.modal;
    const content = this.elements.modalContent;
    const backdrop = this.elements.modalBackdrop;
    if (!modal || !content) return;
    content.innerHTML = contentHtml;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const closeBtn = content.querySelector('.modal-close') || document.createElement('button');
    if (!content.querySelector('.modal-close')) {
      closeBtn.className = 'modal-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', 'Fermer');
      content.prepend(closeBtn);
    }

    const doClose = () => {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (onClose) onClose();
    };

    closeBtn.onclick = doClose;
    backdrop.onclick = (e) => { if (e.target === backdrop) doClose(); };
    window.onkeydown = (e) => { if (e.key === 'Escape') doClose(); };

    this.elements._modalClose = doClose;
  }

  closeModal() {
    const modal = this.elements.modal;
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // --- Formatage ---
  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  formatScore(score) {
    if (score == null) return '—';
    return (score / 10).toFixed(1);
  }
  formatDuration(minutes) {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m}m` : `${m}min`;
  }
}
