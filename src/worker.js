/* ==========================================================================
   Tsuki — Cloudflare Worker entry point
   Les fichiers statiques (HTML, CSS, JS, SVG, JSON) sont servis automatiquement
   par la section [assets] de wrangler.toml.
   ========================================================================== */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/__health') {
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // Le handler par défaut (assets statiques) est fourni par wrangler via [assets]
    // On retourne 404 pour toute requête non gérée (devrait arriver rarement)
    return new Response('Not Found', { status: 404 });
  },
};
