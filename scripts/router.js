/* ==========================================================================
   Tsuki — Router côté client (SPA multi-pages, hash-based)
   Liens #/page fonctionnent sur n'importe quel hébergement statique.
   ========================================================================== */

export class Router {
  constructor({ outlet, onRouteChange } = {}) {
    this.outlet = outlet;
    this.onRouteChange = onRouteChange;
    this.routes = new Map();
    this.currentPath = '/';
    this._initListeners();
  }

  register(path, PageComponent) {
    this.routes.set(path, { page: PageComponent });
  }

  _getHashPath() {
    const hash = window.location.hash || '';
    let path = hash.replace(/^#/, '');
    if (path && !path.startsWith('/')) path = '/' + path;
    return path || '/';
  }

  _resolve(path) {
    let clean = path.replace(/^\/+/, '').replace(/\/+$/, '').split('?')[0].split('#')[0] || '/';

    if (this.routes.has(clean)) {
      return { pattern: clean, params: {}, component: this.routes.get(clean).page };
    }

    for (const [pattern, route] of this.routes) {
      const regex = this._patternToRegex(pattern);
      const match = clean.match(regex);
      if (match) {
        const paramNames = this._paramNames(pattern);
        const params = {};
        paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
        return { pattern, params, component: route.page };
      }
    }

    return null;
  }

  _patternToRegex(pattern) {
    return new RegExp('^' + pattern.replace(/:([\w]+)/g, '([^/?#]+)') + '$');
  }

  _paramNames(pattern) {
    const names = [];
    const re = /:([\w]+)/g;
    let m;
    while ((m = re.exec(pattern))) names.push(m[1]);
    return names;
  }

  navigate(path, { replace = false } = {}) {
    let clean = path.replace(/^#/, '');
    if (!clean.startsWith('/')) clean = '/' + clean;

    const resolved = this._resolve(clean);
    if (!resolved) {
      clean = '/';
    }

    this.currentPath = clean;
    const url = '#' + clean;
    if (replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }

    this._render(resolved || this._resolve('/'));
  }

  _initListeners() {
    const handleRoute = () => {
      const path = this._getHashPath();
      const resolved = this._resolve(path);
      if (resolved) {
        this.currentPath = path;
        this._render(resolved);
      } else {
        this.navigate('/');
      }
    };
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('popstate', handleRoute);
  }

  async _render(resolved) {
    if (this.outlet) this.outlet.innerHTML = '';
    const { component, params } = resolved;

    if (this.outlet) {
      this.outlet.innerHTML = `<div class="page-skeleton" style="min-height:400px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">Chargement…</div>`;
    }

    try {
      const Page = component;
      const pageInstance = new Page({ router: this });
      const el = await pageInstance.render();
      if (this.outlet) {
        this.outlet.innerHTML = '';
        this.outlet.appendChild(el);
      }
      if (pageInstance.onMount) await pageInstance.onMount();
      if (this.onRouteChange) this.onRouteChange(this.currentPath, params);
      window.scrollTo(0, 0);
    } catch (e) {
      console.error('Erreur rendu page', e);
      if (this.outlet) {
        this.outlet.innerHTML = `
          <div class="empty error" style="text-align:center;padding:3rem;">
            <p>Erreur lors du chargement de la page.</p>
            <button class="btn btn-primary" onclick="location.reload()">Réessayer</button>
          </div>`;
      }
    }
  }

  async start() {
    const path = this._getHashPath();
    const resolved = this._resolve(path);
    if (resolved) {
      this.currentPath = path;
      this._render(resolved);
    } else {
      this.navigate('/');
    }
  }

  get current() { return this.currentPath; }
}
