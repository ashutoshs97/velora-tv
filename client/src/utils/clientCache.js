// Simple in-memory cache for the client-side to prevent redundant fetching of movie/TV details (like trailers)
const cache = new Map();

export const clientCache = {
  get(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    
    // Optional: implement expiration logic here, e.g., 5 min TTL
    if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  },
  
  set(key, data) {
    // Optional: enforce max size
    if (cache.size > 200) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  clear() {
    cache.clear();
  }
};
