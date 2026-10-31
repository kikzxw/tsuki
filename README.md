# Tsuki — Anime Stream (déployé sur Cloudflare Workers)

Site de streaming d'animes complet, hébergé sur **tsuki.kikzxw.workers.dev** via Cloudflare Workers + GitHub.

## 🚀 Déploiement

### Option 1 : Déploiement automatique via GitHub Actions

1. Poussez ce code sur un repository GitHub (branche `main`)
2. Dans votre repository GitHub, allez dans **Settings → Secrets and variables → Actions**
3. Ajoutez les secrets suivants :
   - `CLOUDFLARE_API_TOKEN` : votre token API Cloudflare (avec permission `Workers Edit`)
   - `CLOUDFLARE_ACCOUNT_ID` : votre ID de compte Cloudflare
4. À chaque push sur `main`, le site se déploie automatiquement sur `tsuki.kikzxw.workers.dev`

### Option 2 : Déploiement manuel (local)

```bash
# 1. Installer wrangler
npm install -g wrangler

# 2. Se connecter à Cloudflare
wrangler login

# 3. Déployer
wrangler deploy --minify
```

Le site sera accessible sur : **https://tsuki.kikzxw.workers.dev**

## 📁 Structure du projet

```
tsuki/
├── index.html              # Shell SPA (point d'entrée)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (cache hors-ligne)
├── icon-192.svg, icon-512.svg
├── styles/main.css         # Tous les styles (thème, composants, responsive)
├── wrangler.toml           # Configuration Cloudflare Workers
├── src/worker.js           # Entry point du worker
├── .github/workflows/deploy.yml  # CI/CD GitHub Actions
├── scripts/
│   ├── config.js           # Configuration (clé API AnimeDoc intégrée)
│   ├── storage.js          # localStorage (favoris, thème, clé API)
│   ├── cache.js            # Cache API avec TTL
│   ├── router.js           # Routeur côté client (hash-based)
│   ├── ui.js               # Composants UI réutilisables
│   ├── app.js              # Initialisation globale
│   ├── demo.js             # Données de démo (fallback si API down)
│   ├── api/
│   │   ├── anilist.js      # Client GraphQL AniList (fallback gratuit)
│   │   ├── frembed.js      # Client REST Frembed (fallback lecture)
│   │   └── animedoc.js     # Client REST AnimeDoc (API principale)
│   └── pages/
│       ├── home.js         # Accueil (tendances, top, par genre)
│       ├── discover.js     # Découverte avec filtres + pagination
│       ├── search.js       # Recherche plein texte + débounce
│       ├── detail.js       # Détail complet d'un anime
│       ├── player.js       # Lecteur vidéo (sources directes + hls.js)
│       ├── favorites.js    # Liste des favoris
│       └── settings.js     # Paramètres (clé API, thème, etc.)
└── README.md
```

## 🔑 API utilisées

| API | Rôle | Clé requise |
|-----|------|-------------|
| **AnimeDoc** (`api.animedoc.cloud`) | Métadonnées complètes + sources vidéo directes | ✅ Oui (intégrée dans config.js) |
| **AniList** (`graphql.anilist.co`) | Fallback métadonnées (gratuit, sans clé) | Non |
| **Frembed** (`frembed.uno`) | Fallback lecture (gratuit, sans clé) | Non |

La clé API AnimeDoc se configure depuis la page **Paramètres** (⚙️) et reste dans le stockage local du navigateur. Le catalogue de démonstration et la recherche restent disponibles sans clé.

## ✨ Fonctionnalités

- **Catalogue complet** d'animes via AnimeDoc (des milliers de titres)
- **Recherche** plein texte avec débounce
- **Découverte** par genre, format, popularité avec pagination
- **Détail** de chaque anime : synopsis, note, studio, personnages, staff, épisodes
- **Lecture vidéo** avec sources directes (plusieurs qualités, sous-titres, HLS `.m3u8`)
- **Favoris** persistés localement
- **Thème sombre/clair** (mémorisé + préférence système)
- **PWA** : installable, icônes, Service Worker (hors-ligne)
- **Responsive** mobile, accessible (ARIA, lien d'évitement clavier, Échap)

## 🐛 Dépannage

**Le site ne charge pas d'animes ?**
- Vérifiez que la clé API AnimeDoc est bien dans `scripts/config.js`
- Ouvrez la console navigateur (F12) pour voir les erreurs d'API
- En cas de panne d'AnimeDoc, le bascule automatique sur AniList puis données de démo

**Déploiement échoue ?**
- Vérifiez les secrets GitHub (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- Vérifiez que `wrangler.toml` a le bon `name = "tsuki"`
- Testez en local avec `wrangler deploy --dry-run`

## 📄 Licence

Démonstration éducative.
