/**
 * Expiring Cache Implementation
 *
 * Adapted from typescript-eslint v8
 * Original: https://github.com/typescript-eslint/typescript-eslint
 * License: MIT
 *
 * A cache with Time-To-Live (TTL) support using high-resolution timers.
 */

export const DEFAULT_TSCONFIG_CACHE_DURATION_SECONDS = 30;

export interface CacheLike<Key, Value> {
  get(key: Key): Value | undefined;
  set(key: Key, value: Value): this;
}

interface CacheEntry<Value> {
  lastSeen: [number, number]; // High-resolution time
  value: Value;
}

/**
 * A cache that automatically expires entries after a configured duration
 *
 * Uses process.hrtime for high-resolution time tracking to determine
 * when entries should be evicted.
 */
export class ExpiringCache<Key, Value> implements CacheLike<Key, Value> {
  readonly #cacheDurationSeconds: number;
  readonly #map = new Map<Key, CacheEntry<Value>>();

  constructor(cacheDurationSeconds: number = DEFAULT_TSCONFIG_CACHE_DURATION_SECONDS) {
    this.#cacheDurationSeconds = cacheDurationSeconds;
  }

  /**
   * Gets a value from the cache
   *
   * Returns undefined if:
   * - The key doesn't exist
   * - The entry has expired
   *
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  get(key: Key): Value | undefined {
    const entry = this.#map.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    const ageSeconds = process.hrtime(entry.lastSeen)[0];
    if (ageSeconds > this.#cacheDurationSeconds) {
      // Entry expired - remove it
      this.#map.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Sets a value in the cache
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @returns This cache instance for chaining
   */
  set(key: Key, value: Value): this {
    this.#map.set(key, {
      lastSeen: process.hrtime(),
      value,
    });
    return this;
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.#map.clear();
  }

  /**
   * Gets the current size of the cache (including expired entries)
   */
  get size(): number {
    return this.#map.size;
  }

  /**
   * Checks if a key exists in the cache (does not check expiration)
   */
  has(key: Key): boolean {
    return this.#map.has(key);
  }

  /**
   * Deletes a key from the cache
   */
  delete(key: Key): boolean {
    return this.#map.delete(key);
  }
}
