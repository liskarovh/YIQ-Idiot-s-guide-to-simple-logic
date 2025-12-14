/**
 * @file ImageUrlCache.js
 * @brief Image URL caching utility.
 *
 * @author Jan Kalina \<xkalinj00>
 *
 * Cache for converted image URLs to avoid redundant conversions.
 * - Stores image -> URL mappings with timestamps
 * - Automatically expires entries after CACHE_LIFETIME
 * - Used primarily for SVG → data URL conversions
 */

/** Cache expiration time in milliseconds (10 minutes) */
const CACHE_LIFETIME = 10 * 60 * 1000;

/** Map storing image reference → converted URL */
const imageUrlCache = new Map();

/** Map storing image reference → timestamp of last access */
const cacheTimestamps = new Map();

/**
 * Gets a cached image URL or converts and caches a new one.
 *
 * @param image Image reference (string URL or SVG component)
 * @param converter Function to convert image to URL (e.g., SVG -> data URL)
 *
 * @returns Converted image URL or undefined if conversion fails
 */
export function getCachedImageUrl(image, converter) {
    // If already a string URL, return immediately (no conversion needed)
    if(typeof image === "string") {
        return image;
    }

    const cacheKey = image;
    const now = Date.now();

    // Check if cached entry has expired
    if(cacheTimestamps.has(cacheKey)) {
        const age = now - cacheTimestamps.get(cacheKey);
        if(age > CACHE_LIFETIME) {
            // Remove expired entry
            imageUrlCache.delete(cacheKey);
            cacheTimestamps.delete(cacheKey);
        }
    }

    // Return cached URL if available
    if(imageUrlCache.has(cacheKey)) {
        return imageUrlCache.get(cacheKey);
    }

    // Convert image to URL using provided converter
    const url = converter(image);

    // Cache the result if conversion was successful
    if(url) {
        imageUrlCache.set(cacheKey, url);
        cacheTimestamps.set(cacheKey, now);
    }

    return url;
} // getCachedImageUrl()
