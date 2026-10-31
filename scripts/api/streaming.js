/* ==========================================================================
   Tsuki — Moteur de Résolution Streaming & Multi-Serveurs
   Ordonne les serveurs par fiabilité et préférence utilisateur.
   AUCUN lecteur test / flux factice : uniquement de vrais lecteurs streaming.
   ========================================================================== */

// Base de correspondance AniList ID / Clé Démo -> TMDB ID & type
const TMDB_MAP = {
  // Demo items
  'demo-1': { id: '1429', type: 'tv' },
  'demo-2': { id: '85937', type: 'tv' },
  'demo-3': { id: '95479', type: 'tv' },
  'demo-4': { id: '1246', type: 'tv' },
  'demo-5': { id: '31910', type: 'tv' },
  'demo-6': { id: '37854', type: 'tv' },
  'demo-7': { id: '31845', type: 'tv' },
  'demo-8': { id: '37854', type: 'tv' },
  'demo-9': { id: '13916', type: 'tv' },
  'demo-10': { id: '38408', type: 'tv' },
  'demo-11': { id: '46298', type: 'tv' },
  'demo-12': { id: '65930', type: 'tv' },
  'demo-13': { id: '61374', type: 'tv' },
  'demo-14': { id: '45782', type: 'tv' },
  'demo-15': { id: '46261', type: 'tv' },
  'demo-16': { id: '30984', type: 'tv' },
  'demo-17': { id: '12971', type: 'tv' },
  'demo-18': { id: '3681', type: 'tv' },
  'demo-19': { id: '45564', type: 'tv' },
  'demo-20': { id: '45786', type: 'tv' },
  'demo-21': { id: '890', type: 'tv' },
  'demo-22': { id: '1809', type: 'tv' },
  'demo-23': { id: '1269', type: 'tv' },
  'demo-24': { id: '33880', type: 'tv' },
  'demo-25': { id: '1948', type: 'tv' },
  'demo-26': { id: '12630', type: 'tv' },
  'demo-27': { id: '235', type: 'tv' },
  'demo-28': { id: '2114', type: 'tv' },
  'demo-29': { id: '33418', type: 'tv' },
  'demo-30': { id: '12609', type: 'tv' },
  'demo-31': { id: '34460', type: 'tv' },
  'demo-32': { id: '44558', type: 'tv' },
  'demo-33': { id: '13917', type: 'tv' },
  'demo-34': { id: '372058', type: 'movie' },
  'demo-35': { id: '378064', type: 'movie' },
  'demo-36': { id: '129', type: 'movie' },
  'demo-37': { id: '128', type: 'movie' },
  'demo-38': { id: '4935', type: 'movie' },
  'demo-39': { id: '47', type: 'movie' },
  'demo-40': { id: '10494', type: 'movie' },
  'demo-41': { id: '4977', type: 'movie' },
  'demo-42': { id: '14069', type: 'movie' },
  'demo-43': { id: '42480', type: 'movie' },
  'demo-44': { id: '110420', type: 'movie' },
  'demo-45': { id: '315011', type: 'movie' },
  'demo-46': { id: '341174', type: 'movie' },
  'demo-47': { id: '441130', type: 'movie' },
  'demo-48': { id: '242828', type: 'movie' },
  'demo-49': { id: '149871', type: 'movie' },
  'demo-50': { id: '15049', type: 'movie' },

  // AniList IDs populaires
  '1': { id: '1246', type: 'tv' }, // Cowboy Bebop
  '20': { id: '46260', type: 'tv' }, // Naruto
  '21': { id: '37854', type: 'tv' }, // One Piece
  '1535': { id: '13916', type: 'tv' }, // Death Note
  '16498': { id: '1429', type: 'tv' }, // Attack on Titan
  '28877': { id: '31910', type: 'tv' }, // Naruto Shippuden
  '101922': { id: '85937', type: 'tv' }, // Demon Slayer
  '113415': { id: '95479', type: 'tv' }, // Jujutsu Kaisen
  '9752': { id: '31845', type: 'tv' }, // Fullmetal Alchemist: Brotherhood
  '9753': { id: '37854', type: 'tv' }, // Steins;Gate
  '11071': { id: '46298', type: 'tv' }, // Hunter x Hunter
  '21459': { id: '65930', type: 'tv' }, // My Hero Academia
  '20581': { id: '61374', type: 'tv' }, // Tokyo Ghoul
  '11771': { id: '45782', type: 'tv' }, // Sword Art Online
  '6702': { id: '46261', type: 'tv' }, // Fairy Tail
  '269': { id: '30984', type: 'tv' }, // Bleach
  '813': { id: '12971', type: 'tv' }, // Dragon Ball Z
  '527': { id: '3681', type: 'tv' }, // Pokemon
  '14813': { id: '152865', type: 'tv' }, // Bleach TYBW
  '105333': { id: '86031', type: 'tv' }, // Dr. Stone
  '21087': { id: '63926', type: 'tv' }, // One Punch Man
  '101759': { id: '83097', type: 'tv' }, // The Promised Neverland
  '108465': { id: '99516', type: 'tv' }, // Mushoku Tensei
  '99147': { id: '75510', type: 'tv' }, // Violet Evergarden
  '101386': { id: '89456', type: 'tv' }, // Vinland Saga
  '127230': { id: '114410', type: 'tv' }, // Chainsaw Man
  '140960': { id: '120089', type: 'tv' }, // Spy x Family
  '145064': { id: '203737', type: 'tv' }, // Oshi no Ko
  '154587': { id: '209867', type: 'tv' }, // Frieren
  '151807': { id: '211128', type: 'tv' }, // Solo Leveling
  '131586': { id: '120089', type: 'tv' }, // Spy x Family part 2
  '142838': { id: '1429', type: 'tv' }, // Attack on Titan Final Season
  '113993': { id: '95479', type: 'tv' }, // Jujutsu Kaisen 2
  '120377': { id: '1429', type: 'tv' }, // Attack on Titan Final part 1
  '137748': { id: '1429', type: 'tv' }, // Attack on Titan Final part 2
  '14513': { id: '85937', type: 'tv' }, // Demon Slayer Entertainment Arc
  '155963': { id: '85937', type: 'tv' }, // Demon Slayer Swordsmith Arc
  '166240': { id: '85937', type: 'tv' }, // Demon Slayer Hashira Arc
  '153288': { id: '207347', type: 'tv' }, // Kaiju No. 8
  '171018': { id: '240411', type: 'tv' }, // Dandadan
  '128893': { id: '154522', type: 'tv' }, // Hell's Paradise
  '74204': { id: '74204', type: 'tv' }, // Black Clover
  '60863': { id: '60863', type: 'tv' }, // Haikyuu!!
  '65942': { id: '65942', type: 'tv' }, // Re:Zero
  '64196': { id: '64196', type: 'tv' }, // Overlord
  '65701': { id: '65701', type: 'tv' }, // Konosuba
  '67075': { id: '67075', type: 'tv' }, // Mob Psycho 100
  '199': { id: '129', type: 'movie' }, // Spirited Away
  '164': { id: '128', type: 'movie' }, // Princess Mononoke
  '431': { id: '4935', type: 'movie' }, // Howl's Moving Castle
  '47': { id: '47', type: 'movie' }, // Akira
  '1042': { id: '10494', type: 'movie' }, // Perfect Blue
  '21519': { id: '372058', type: 'movie' }, // Your Name
  '98394': { id: '372058', type: 'movie' }, // Your Name
  '98334': { id: '378064', type: 'movie' }, // A Silent Voice
  '106286': { id: '568160', type: 'movie' }, // Weathering with You
  '135340': { id: '916224', type: 'movie' }, // Suzume
  '145137': { id: '508883', type: 'movie' }, // The Boy and the Heron
};

// Titres normalisés vers TMDB ID
const TITLE_MAP = [
  { match: /attack on titan|shingeki no kyojin/i, id: '1429', type: 'tv' },
  { match: /demon slayer|kimetsu no yaiba/i, id: '85937', type: 'tv' },
  { match: /jujutsu kaisen/i, id: '95479', type: 'tv' },
  { match: /cowboy bebop/i, id: '1246', type: 'tv' },
  { match: /one piece/i, id: '37854', type: 'tv' },
  { match: /naruto shippu/i, id: '31910', type: 'tv' },
  { match: /^naruto$/i, id: '46260', type: 'tv' },
  { match: /fullmetal alchemist/i, id: '31845', type: 'tv' },
  { match: /steins;?gate/i, id: '37854', type: 'tv' },
  { match: /death note/i, id: '13916', type: 'tv' },
  { match: /code geass/i, id: '38408', type: 'tv' },
  { match: /hunter x hunter|hunter × hunter/i, id: '46298', type: 'tv' },
  { match: /my hero academia|boku no hero/i, id: '65930', type: 'tv' },
  { match: /tokyo ghoul/i, id: '61374', type: 'tv' },
  { match: /sword art online/i, id: '45782', type: 'tv' },
  { match: /fairy tail/i, id: '46261', type: 'tv' },
  { match: /bleach/i, id: '30984', type: 'tv' },
  { match: /dragon ball z/i, id: '12971', type: 'tv' },
  { match: /^dragon ball$/i, id: '12609', type: 'tv' },
  { match: /dragon ball super/i, id: '62715', type: 'tv' },
  { match: /pok[eé]mon/i, id: '3681', type: 'tv' },
  { match: /frieren/i, id: '209867', type: 'tv' },
  { match: /solo leveling/i, id: '211128', type: 'tv' },
  { match: /chainsaw man/i, id: '114410', type: 'tv' },
  { match: /spy x family/i, id: '120089', type: 'tv' },
  { match: /oshi no ko/i, id: '203737', type: 'tv' },
  { match: /vinland saga/i, id: '89456', type: 'tv' },
  { match: /dandadan/i, id: '240411', type: 'tv' },
  { match: /kaiju no\.?\s?8/i, id: '207347', type: 'tv' },
  { match: /black clover/i, id: '74204', type: 'tv' },
  { match: /haikyu/i, id: '60863', type: 'tv' },
  { match: /re:?zero/i, id: '65942', type: 'tv' },
  { match: /overlord/i, id: '64196', type: 'tv' },
  { match: /mob psycho/i, id: '67075', type: 'tv' },
  { match: /your name|kimi no na wa/i, id: '372058', type: 'movie' },
  { match: /silent voice|koe no katachi/i, id: '378064', type: 'movie' },
  { match: /spirited away|voyage de chihiro/i, id: '129', type: 'movie' },
  { match: /princess mononoke|princesse mononok/i, id: '128', type: 'movie' },
  { match: /howl's moving castle|ch[aâ]teau ambulant/i, id: '4935', type: 'movie' },
  { match: /weathering with you|enfants du temps/i, id: '568160', type: 'movie' },
  { match: /suzume/i, id: '916224', type: 'movie' },
  { match: /boy and the heron|garçon et le héron/i, id: '508883', type: 'movie' },
  { match: /akira/i, id: '47', type: 'movie' },
  { match: /perfect blue/i, id: '10494', type: 'movie' },
  { match: /paprika/i, id: '4977', type: 'movie' },
  { match: /summer wars/i, id: '42480', type: 'movie' },
  { match: /wolf children|enfants loups/i, id: '110420', type: 'movie' },
];

export class StreamingEngine {
  constructor({ frembed, animedoc } = {}) {
    this.frembed = frembed;
    this.animedoc = animedoc;
  }

  /**
   * Tente de résoudre l'ID TMDB d'un anime
   */
  resolveTmdb(media) {
    if (!media) return null;

    const id = String(media.id || '');
    if (TMDB_MAP[id]) return TMDB_MAP[id];

    // Vérification dans les liens externes AniList
    if (Array.isArray(media.externalLinks)) {
      const tmdbLink = media.externalLinks.find(
        (l) => l.site === 'TMDB' || (l.url && l.url.includes('themoviedb.org'))
      );
      if (tmdbLink && tmdbLink.url) {
        const match = tmdbLink.url.match(/(tv|movie)\/(\d+)/i);
        if (match) {
          return { id: match[2], type: match[1].toLowerCase() };
        }
        const numeric = tmdbLink.url.replace(/\D/g, '');
        if (numeric) {
          return { id: numeric, type: media.format === 'MOVIE' ? 'movie' : 'tv' };
        }
      }
    }

    // Recherche par titre
    const titles = [
      media.title,
      media.titleRomaji,
      media.titleEnglish,
      media.titleNative,
      ...(media.synonyms || []),
    ].filter(Boolean);

    for (const title of titles) {
      for (const entry of TITLE_MAP) {
        if (entry.match.test(title)) {
          return { id: entry.id, type: entry.type };
        }
      }
    }

    // Fallback avec ID numérique
    const isMovie = media.format === 'MOVIE';
    return { id: id.replace(/\D/g, '') || '1429', type: isMovie ? 'movie' : 'tv', fallback: true };
  }

  /**
   * Génère les vrais serveurs de streaming triés par fiabilité et préférence.
   * AUCUN flux démo/test : uniquement des lecteurs réels opérationnels.
   */
  async getSourcesForEpisode(media, { season = 1, episode = 1 } = {}) {
    const sources = [];
    const isMovie = media?.format === 'MOVIE';
    const s = Math.max(1, Number(season) || 1);
    const ep = Math.max(1, Number(episode) || 1);

    const tmdbInfo = this.resolveTmdb(media);
    const tmdbId = tmdbInfo?.id;
    const isSeries = !isMovie && tmdbInfo?.type !== 'movie';

    if (tmdbId) {
      // 1. SERVEUR 1 : FREMBED (Recommandé & Préféré en France : VF / VOSTFR)
      const frembedUrl = isSeries
        ? `https://frembed.uno/embed/serie/${tmdbId}?sa=${s}&epi=${ep}`
        : `https://frembed.uno/embed/movie/${tmdbId}`;

      sources.push({
        id: 'frembed',
        name: 'Serveur 1 : Frembed (VF / VOSTFR)',
        badge: 'Recommandé FR 🇫🇷',
        type: 'iframe',
        url: frembedUrl,
        desc: 'Lecteur français avec choix de la langue (VF ou VOSTFR) directement dans la vidéo.',
      });

      // 2. SERVEUR 2 : VIDSRC HD (Ultra-rapide, buffer instantané, HD 1080p)
      const vidsrcUrl = isSeries
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${ep}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`;

      sources.push({
        id: 'vidsrc',
        name: 'Serveur 2 : VidSrc HD',
        badge: 'Ultra Rapide ⚡',
        type: 'iframe',
        url: vidsrcUrl,
        desc: 'Lecteur international haute performance, qualité HD 1080p garantie.',
      });

      // 3. SERVEUR 3 : MULTIEMBED (Multi-sources avec bascule automatique)
      const multiembedUrl = isSeries
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${ep}`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;

      sources.push({
        id: 'multiembed',
        name: 'Serveur 3 : MultiEmbed',
        badge: 'Multi-Lecteurs 🛡️',
        type: 'iframe',
        url: multiembedUrl,
        desc: 'Lecteur de secours intégrant plusieurs sous-serveurs alternatifs.',
      });

      // 4. SERVEUR 4 : 2EMBED (Secours direct)
      const twoEmbedUrl = isSeries
        ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${ep}`
        : `https://www.2embed.cc/embed/${tmdbId}`;

      sources.push({
        id: '2embed',
        name: 'Serveur 4 : 2Embed HD',
        badge: 'Secours 🔄',
        type: 'iframe',
        url: twoEmbedUrl,
        desc: 'Serveur alternatif mondial en cas de saturation réseau.',
      });

      // 5. SERVEUR 5 : VIDSRC CC
      const vidsrcCcUrl = isSeries
        ? `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${ep}`
        : `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;

      sources.push({
        id: 'vidsrc-cc',
        name: 'Serveur 5 : VidSrc CC',
        badge: 'Secours 2 🌐',
        type: 'iframe',
        url: vidsrcCcUrl,
        desc: 'Deuxième miroir VidSrc avec sous-titres multilingues.',
      });
    }

    // 6. SOURCE HLS DIRECTE : Si le backend AnimeDoc est configuré avec sa clé
    if (this.animedoc && media?.id) {
      try {
        const animedocData = await this.animedoc.getMediaSources(media.id);
        const list = animedocData?.data?.sources || animedocData?.sources || [];
        list.forEach((src, idx) => {
          if (src.url) {
            sources.unshift({
              id: `direct-${idx}`,
              name: `Flux Direct HD (${src.quality || '1080p'})`,
              badge: 'Flux Direct HLS 🚀',
              type: 'hls',
              url: src.url,
              desc: 'Lecture native directe sans publicité ni lecteur externe.',
            });
          }
        });
      } catch (_) {
        // En local ou sans secret, on continue sans interrompre
      }
    }

    // 7. BANDE-ANNONCE OFFICIELLE : Si l'anime dispose d'un trailer AniList
    if (media?.trailer && media.trailer.id && (media.trailer.site === 'youtube' || !media.trailer.site)) {
      sources.push({
        id: 'trailer',
        name: 'Bande-annonce HD (YouTube)',
        badge: 'Trailer Officiel 🍿',
        type: 'iframe',
        url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(media.trailer.id)}?autoplay=1&rel=0`,
        desc: 'Bande-annonce et extraits vidéo officiels.',
      });
    }

    return sources;
  }
}
