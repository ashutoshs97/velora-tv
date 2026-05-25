const BASE_URL = 'https://image.tmdb.org/t/p';

export const TMDB_SIZES = {
  backdrop: ['w300', 'w780', 'w1280', 'original'],
  poster: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
  profile: ['w45', 'w185', 'h632', 'original'],
  still: ['w92', 'w185', 'w300', 'original']
};

/**
 * Returns src and srcSet attributes for TMDB images to enable responsive loading.
 * @param {string} path - The image path from TMDB (e.g., "/abc.jpg")
 * @param {string} type - 'backdrop', 'poster', 'profile', or 'still'
 * @param {string} defaultSize - The fallback size if srcSet is not supported
 * @returns {{src: string, srcSet: string}}
 */
export function getTmdbImage(path, type = 'poster', defaultSize = 'w500') {
  if (!path) return { src: '', srcSet: undefined };
  
  const sizes = TMDB_SIZES[type] || TMDB_SIZES.poster;
  const src = `${BASE_URL}/${defaultSize}${path}`;
  
  // Filter out non-width sizes for srcSet generation
  const widthSizes = sizes.filter(s => s.startsWith('w'));
  
  const srcSet = widthSizes.map(size => {
    const width = size.replace('w', '');
    return `${BASE_URL}/${size}${path} ${width}w`;
  }).join(', ');

  return { src, srcSet };
}

/**
 * Convenience method to get just a direct URL for a specific size
 */
export function getTmdbImageUrl(path, size = 'original') {
  if (!path) return '';
  return `${BASE_URL}/${size}${path}`;
}
