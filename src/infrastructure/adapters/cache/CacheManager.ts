/**
 * CacheManager - Multi-level cache management
 */

import { ParseResult } from '../../../domain/ports/Parser.js';
import { Cache, CacheStats } from '../../../domain/ports/Cache.js';
import { MemoryCache, MemoryCacheOptions } from './MemoryCache.js';
import { FileCache, FileCacheOptions } from './FileCache.js';
import { Logger } from 'c3-shared';
import { createHash } from 'crypto';

export interface CacheManagerOptions {
  memory?: MemoryCacheOptions;
  file?: FileCacheOptions;
  enableFileCache?: boolean;
}

export class CacheManager implements Cache {
  private memoryCache: MemoryCache;
  private fileCache?: FileCache;
  private stats: {
    hits: number;
    misses: number;
    memoryHits: number;
    fileHits: number;
  };

  constructor(
    private options: CacheManagerOptions,
    private logger?: Logger
  ) {
    this.memoryCache = new MemoryCache(options.memory || {});

    if (options.enableFileCache) {
      this.fileCache = new FileCache(options.file || {});
      this.fileCache.initialize().catch(err => {
        this.logger?.warn('Failed to initialize file cache', err);
      });
    }

    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      fileHits: 0
    };
  }

  /**
   * Get a cached parse result
   */
  async get(key: string): Promise<ParseResult | null> {
    const cacheKey = this.normalizeKey(key);

    // Try memory cache first (L1)
    let result = await this.memoryCache.get(cacheKey);
    if (result) {
      this.stats.hits++;
      this.stats.memoryHits++;
      this.logger?.debug('Memory cache hit', { key: cacheKey });
      return result;
    }

    // Try file cache (L2)
    if (this.fileCache) {
      result = await this.fileCache.get(cacheKey);
      if (result) {
        this.stats.hits++;
        this.stats.fileHits++;
        this.logger?.debug('File cache hit', { key: cacheKey });

        // Promote to memory cache
        await this.memoryCache.set(cacheKey, result);

        return result;
      }
    }

    // Cache miss
    this.stats.misses++;
    this.logger?.debug('Cache miss', { key: cacheKey });
    return null;
  }

  /**
   * Set a parse result in cache
   */
  async set(key: string, value: ParseResult): Promise<void> {
    const cacheKey = this.normalizeKey(key);

    // Set in memory cache
    await this.memoryCache.set(cacheKey, value);

    // Async write to file cache
    if (this.fileCache) {
      this.fileCache.set(cacheKey, value).catch(err => {
        this.logger?.warn('Failed to write to file cache', err);
      });
    }
  }

  /**
   * Check if key exists in any cache level
   */
  async has(key: string): Promise<boolean> {
    const cacheKey = this.normalizeKey(key);

    if (this.memoryCache.has(cacheKey)) {
      return true;
    }

    if (this.fileCache) {
      return this.fileCache.has(cacheKey);
    }

    return false;
  }

  /**
   * Delete from all cache levels
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.normalizeKey(key);

    await this.memoryCache.delete(cacheKey);

    if (this.fileCache) {
      await this.fileCache.delete(cacheKey);
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    await this.memoryCache.clear();

    if (this.fileCache) {
      await this.fileCache.clear();
    }

    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      fileHits: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalAccesses = this.stats.hits + this.stats.misses;
    const hitRate = totalAccesses > 0 ? this.stats.hits / totalAccesses : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      memorySize: this.memoryCache.getSize(),
      memoryItems: this.memoryCache.getItemCount(),
      fileSize: undefined, // Would need async call
      fileItems: undefined
    };
  }

  /**
   * Get detailed statistics including file cache
   */
  async getDetailedStats(): Promise<CacheStats> {
    const stats = this.getStats();

    if (this.fileCache) {
      const fileStats = await this.fileCache.getStats();
      stats.fileSize = fileStats.size;
      stats.fileItems = fileStats.items;
    }

    return stats;
  }

  /**
   * Generate cache key from file path and content hash
   */
  generateKey(filePath: string, contentHash: string): string {
    return `${filePath}::${contentHash}`;
  }

  /**
   * Hash file content for cache key
   */
  hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Normalize cache key
   */
  private normalizeKey(key: string): string {
    // Ensure consistent key format
    return key.toLowerCase().replace(/\\/g, '/');
  }

  /**
   * Prune caches to reclaim space
   */
  async prune(): Promise<{ memory: number; file: number }> {
    const memoryPruned = await this.memoryCache.prune();
    let filePruned = 0;

    if (this.fileCache) {
      // File cache pruning would go here
      // For now, just report 0
      filePruned = 0;
    }

    return {
      memory: memoryPruned,
      file: filePruned
    };
  }

  /**
   * Warm up cache with commonly accessed files
   */
  async warmup(keys: string[]): Promise<void> {
    this.logger?.info('Warming up cache', { keys: keys.length });

    for (const key of keys) {
      // Trigger cache lookup to promote from file to memory
      await this.get(key);
    }
  }
}