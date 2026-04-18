const SERVER_UI_PARAMS = ['player=jw', 'primaryColor=ffffff', 'secondaryColor=a8a8a8', 'iconColor=ffffff', 'autoplay=true', 'nextbutton=false'].join('&');

function parseCsvIds(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return [];
  return rawValue
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function getMovieProviderRuntimeConfig() {
  const env = import.meta?.env ?? {};
  const enabledIds = parseCsvIds(env.VITE_MOVIE_PROVIDER_ENABLED_IDS);
  const disabledIds = new Set(parseCsvIds(env.VITE_MOVIE_PROVIDER_DISABLED_IDS));
  const orderedIds = parseCsvIds(env.VITE_MOVIE_PROVIDER_ORDER);

  return {
    enabledIds,
    disabledIds,
    orderedIds,
  };
}

const MOVIE_PROVIDER_REGISTRY = [
  {
    id: 1,
    name: 'Server 1',
    label: 'VidLink',
    sublabel: 'vidlink.pro',
    badge: 'HD',
    recommended: true,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://vidlink.pro/tv/${id}/${season}/${episode}?${SERVER_UI_PARAMS}`,
          `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=true`,
        ]
      : [
          `https://vidlink.pro/movie/${id}?${SERVER_UI_PARAMS}`,
          `https://vidlink.pro/movie/${id}?autoplay=true`,
        ],
  },
  {
    id: 2,
    name: 'Server 2',
    label: 'VidSrc',
    sublabel: 'vidsrc.cc',
    badge: 'HD',
    recommended: true,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://vidsrc.cc/v3/embed/tv/${id}/${season}/${episode}`,
          `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
        ]
      : [
          `https://vidsrc.cc/v3/embed/movie/${id}`,
          `https://vidsrc.to/embed/movie/${id}`,
        ],
  },
  {
    id: 3,
    name: 'Server 3',
    label: 'VidSrc Pro',
    sublabel: 'vidsrc.pro',
    badge: 'HD',
    recommended: false,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`,
          `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
        ]
      : [
          `https://vidsrc.pro/embed/movie/${id}`,
          `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
        ],
  },
  {
    id: 4,
    name: 'Server 4',
    label: 'Embed',
    sublabel: 'embed.su',
    badge: '4K',
    recommended: false,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://embed.su/embed/tv/${id}/${season}/${episode}`,
          `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
        ]
      : [
          `https://embed.su/embed/movie/${id}`,
          `https://multiembed.mov/?video_id=${id}&tmdb=1`,
        ],
  },
  {
    id: 5,
    name: 'Server 5',
    label: 'MovieAPI',
    sublabel: 'movieapi.club',
    badge: 'HD',
    recommended: false,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://movieapi.club/tv/${id}-${season}-${episode}`,
          `https://moviesapi.club/tv/${id}-${season}-${episode}`,
        ]
      : [
          `https://movieapi.club/movie/${id}`,
          `https://moviesapi.club/movie/${id}`,
        ],
  },
  {
    id: 6,
    name: 'Server 6',
    label: '2Embed',
    sublabel: '2embed.cc',
    badge: 'HD',
    recommended: false,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
          `https://2embed.org/embedtv/${id}&s=${season}&e=${episode}`,
        ]
      : [
          `https://www.2embed.cc/embedmovie/${id}`,
          `https://2embed.org/embedmovie/${id}`,
        ],
  },
  {
    id: 7,
    name: 'Server 7',
    label: 'MultiEmbed',
    sublabel: 'multiembed.mov',
    badge: 'HD',
    recommended: false,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
          `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
        ]
      : [
          `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
          `https://multiembed.mov/?video_id=${id}&tmdb=1`,
        ],
  },
  {
    id: 8,
    name: 'Server 8',
    label: 'Smashy',
    sublabel: 'smashy.stream',
    badge: 'HD',
    recommended: false,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://player.smashy.stream/tv/${id}?s=${season}&e=${episode}`,
          `https://smashy.stream/tv/${id}?s=${season}&e=${episode}`,
        ]
      : [
          `https://player.smashy.stream/movie/${id}`,
          `https://smashy.stream/movie/${id}`,
        ],
  },
];

const runtimeConfig = getMovieProviderRuntimeConfig();

function applyRuntimeConfig(providers) {
  let nextProviders = [...providers];

  if (runtimeConfig.enabledIds.length > 0) {
    const enabledSet = new Set(runtimeConfig.enabledIds);
    nextProviders = nextProviders.filter((provider) => enabledSet.has(provider.id));
  }

  if (runtimeConfig.disabledIds.size > 0) {
    nextProviders = nextProviders.filter((provider) => !runtimeConfig.disabledIds.has(provider.id));
  }

  if (runtimeConfig.orderedIds.length > 0) {
    const orderMap = new Map(runtimeConfig.orderedIds.map((id, index) => [id, index]));
    nextProviders.sort((left, right) => {
      const leftRank = orderMap.has(left.id) ? orderMap.get(left.id) : Number.MAX_SAFE_INTEGER;
      const rightRank = orderMap.has(right.id) ? orderMap.get(right.id) : Number.MAX_SAFE_INTEGER;

      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.id - right.id;
    });
  }

  return nextProviders;
}

export function getEnabledMovieProviders() {
  return applyRuntimeConfig(
    MOVIE_PROVIDER_REGISTRY.filter((provider) => provider.enabled !== false)
  );
}

export default MOVIE_PROVIDER_REGISTRY;
