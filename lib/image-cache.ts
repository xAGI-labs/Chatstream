// Simple in-memory cache for image URLs

// Cache object will persist between requests in development
// In production, it will be initialized on each server instance
const imageUrlCache: Record<string, string> = {};

/**
 * Store an image URL in the cache
 */
export function cacheImageUrl(key: string, url: string): void {
  imageUrlCache[key] = url;
}

/**
 * Get an image URL from the cache
 */
export function getCachedImageUrl(key: string): string | null {
  return imageUrlCache[key] || null;
}

/**
 * Clear the image URL cache
 */
export function clearImageUrlCache(): void {
  Object.keys(imageUrlCache).forEach(key => {
    delete imageUrlCache[key];
  });
}
