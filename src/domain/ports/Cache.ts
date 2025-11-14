/**
 * Cache - Interface for caching parsed results
 */

export interface CacheOptions {
  ttl?: number;
}

export interface Cache<T = any> {
  /**
   * Get value from cache
   */
  get(key: string): Promise<T | undefined>;

  /**
   * Set value in cache
   */
  set(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete value from cache
   */
  delete(key: string): Promise<void>;

  /**
   * Check if key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all cache
   */
  clear(): Promise<void>;
}
