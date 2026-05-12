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
  return { enabledIds, disabledIds, orderedIds };
}

const MOVIE_PROVIDER_REGISTRY = [
  {
    id: 1,
    name: 'Server 1',
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
    id: 2,
    name: 'Server 2',
    badge: 'HD',
    recommended: false,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://111movies.net/tv/${id}/${season}/${episode}`,
          `https://111movies.com/tv/${id}/${season}/${episode}`,
        ]
      : [
          `https://111movies.net/movie/${id}`,
          `https://111movies.com/movie/${id}`,
        ],
  },
  {
    id: 3,
    name: 'Server 3',
    badge: 'HD',
    recommended: false,
    enabled: true,
    // params removed - anyembed blocks customized embed URLs
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [`https://anyembed.xyz/embed/tmdb-tv-${id}-${season}-${episode}`]
      : [`https://anyembed.xyz/embed/tmdb-movie-${id}`],
  },
  {
    id: 4,
    name: 'Server 4',
    badge: 'HD',
    recommended: true,
    enabled: true,
    providerKey: 'vidlink',
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
    id: 5,
    name: 'Server 5',
    badge: 'HD',
    recommended: false,
    enabled: true,
    getUrls: (id, type, season, episode) => type === 'tv'
      ? [
          `https://vidsrc.net/embed/tv/${id}/${season}/${episode}`,
          `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
          `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
        ]
      : [
          `https://vidsrc.net/embed/movie/${id}`,
          `https://vidsrc.to/embed/movie/${id}`,
          `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
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
