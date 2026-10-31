/* ==========================================================================
   Tsuki — Cloudflare Worker entry point
   Sert les fichiers statiques (HTML, CSS, JS, SVG, JSON) via le binding ASSETS.
   ========================================================================== */

const sourceRequests = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/__health') {
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    if (url.pathname.startsWith('/api/catalog/')) {
      const sourcePath = url.pathname.replace(/^\/api\/catalog/, '');
      if (request.method !== 'GET' || !/^\/api\/v2\/anime\/[\w-]+\/media-sources$/.test(sourcePath)) {
        return Response.json({ error: 'Cette ressource est indisponible.' }, { status: 404 });
      }
      if (!env.ANIMEDOC_API_KEY) {
        return Response.json({ error: 'Le catalogue est momentanément indisponible.' }, { status: 503 });
      }
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const now = Date.now();
      const windowStart = now - 60_000;
      const recent = (sourceRequests.get(ip) || []).filter((time) => time > windowStart);
      if (recent.length >= 30) {
        return Response.json({ error: 'Trop de demandes. Réessaie dans une minute.' }, { status: 429 });
      }
      recent.push(now);
      sourceRequests.set(ip, recent);
      if (sourceRequests.size > 5000) {
        for (const [address, timestamps] of sourceRequests) {
          if (!timestamps.some((timestamp) => timestamp > windowStart)) sourceRequests.delete(address);
        }
      }
      const upstreamUrl = new URL(sourcePath + url.search, 'https://api.animedoc.cloud');
      const headers = new Headers(request.headers);
      headers.delete('host');
      headers.delete('origin');
      headers.delete('referer');
      headers.set('X-API-Key', env.ANIMEDOC_API_KEY);
      headers.set('Accept', 'application/json');
      const upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json', 'Cache-Control': 'private, max-age=60' },
      });
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
