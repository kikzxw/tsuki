# Tsuki — Anime Library

Tsuki is a responsive anime discovery and personal library app, deployed as a Cloudflare Worker. The interface is French-first and keeps favorites, lists, preferences, and viewing history in the visitor's browser.

## Local preview

Serve this folder over HTTP (ES modules and the service worker require it):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy

The Worker serves the static site and keeps the catalogue credential server-side. To enable playback, configure the secret once in Cloudflare:

```bash
npx wrangler secret put ANIMEDOC_API_KEY
npx wrangler deploy
```

For GitHub Actions, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository Actions secrets. The browser never receives the catalogue credential. Without the Worker secret, discovery, metadata, search, lists, and favorites still work; playback sources remain unavailable.

If deploying from **Cloudflare Workers Builds** in the dashboard, add `ANIMEDOC_API_KEY` directly to the Worker under **Workers & Pages → tsuki → Settings → Variables and Secrets → Add → Secret**, save, then redeploy. Cloudflare documents this dashboard flow in its [Workers secrets guide](https://developers.cloudflare.com/workers/configuration/secrets/).

## Main features

- Multi-server anime & movie video player (Frembed VF/VOSTFR, VidSrc HD, Direct HLS, Official Trailers, and offline Demo stream)
- Smart episode selector with range pagination (1-25, 26-50...), direct episode jump, and watched progress tracking
- Responsive Sakura-pink dark & light theme, mobile bottom navigation bar, cinema mode, and gentle falling petal animations
- Live trending, top-rated, genre, movie, search, and detail views from AniList
- Anime summaries, covers, ratings, episode counts, characters, staff, and external streaming links
- Favorites, custom marathon lists, and viewing history stored locally in the browser
- Keyboard shortcuts (`N`/`P` for next/previous episodes, `C` for cinema mode, `F` for fullscreen)
- PWA install and offline shell cache (Service Worker v6)

## Project map

- `index.html`, `styles/main.css`: app shell, responsive layouts, and Sakura design system
- `icons/`: PWA and browser icons
- `scripts/api/`: AniList, Frembed, AnimeDoc, and unified `streaming.js` engine
- `scripts/pages/`: home, catalogue, search, detail, player, favorites, lists, history, preferences
- `scripts/storage.js`: local library, watched episodes, and settings
- `src/worker.js`: Cloudflare Worker static assets and server-side catalogue relay
- `sw.js`: offline app shell and cache
