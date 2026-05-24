export function getSafeType(raw) {
  return raw === 'tv' ? 'tv' : 'movie';
}

export function isValidId(id) {
  if (!/^\d+$/.test(String(id))) return false;
  return Number(id) > 0;
}

export function setCacheHeaders(res, seconds = 300) {
  res.set('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}`);
}
