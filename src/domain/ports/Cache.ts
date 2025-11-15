/**
 * Cache - Interface for caching parsed results
 */

export interface CacheOptions {
  ttl?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memorySize?: number;
  memoryItems?: number;
  fileSize?: number;
  fileItems?: number;
}

export interface Cache<T = any> {
  /**
   * Get value from cache
   */
  get(key: string): Promise<T | undefined | null>;

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

  /**
   * Get cache statistics
   */
  getStats(): CacheStats;

  /**
   * Generate cache key from file path and content hash
   */
  generateKey(filePath: string, contentHash: string): string;

  /**
   * Hash content for cache key
   */
  hashContent(content: string): string;
}
