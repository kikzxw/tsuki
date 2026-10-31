/* ==========================================================================
   Tsuki — Cloudflare Worker entry point
   Sert les fichiers statiques (HTML, CSS, JS, SVG, JSON) via le binding ASSETS.
   ========================================================================== */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/__health') {
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // Servir les assets statiques (index.html, style.css, scripts, etc.)
    if (env.ASSETS) {
      try {
        return await env.ASSETS.fetch(request);
      } catch (err) {
        // Si l'asset n'existe pas, on continue vers le fallback SPA
      }
    }

    // Fallback SPA : pour les routes non trouvées, servir index.html
    // (le router côté client gérera l'URL)
    try {
      return await env.ASSETS.fetch(new Request('https://tsuki.kikzxw.workers.dev/index.html'));
    } catch (err) {
      return new Response('Not Found', { status: 404 });
    }
  },
};
