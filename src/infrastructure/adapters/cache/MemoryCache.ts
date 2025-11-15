/**
 * MemoryCache - LRU-based in-memory cache for parse results
 */

import { LRUCache } from 'lru-cache';
import { ParseResult } from '../../../domain/ports/Parser.js';

export interface MemoryCacheOptions {
  maxSize?: number; // Maximum size in bytes
  maxItems?: number; // Maximum number of items
  ttl?: number; // Time to live in milliseconds
}

export interface CacheEntry {
  result: ParseResult;
  size: number;
  timestamp: number;
}

export class MemoryCache {
  private cache: LRUCache<string, CacheEntry>;
  private totalSize: number = 0;

  constructor(private options: MemoryCacheOptions = {}) {
    const defaultMaxSize = 100 * 1024 * 1024; // 100MB
    const defaultMaxItems = 1000;
    const defaultTTL = 3600000; // 1 hour

    this.cache = new LRUCache<string, CacheEntry>({
      max: options.maxItems || defaultMaxItems,
      maxSize: options.maxSize || defaultMaxSize,
      ttl: options.ttl || defaultTTL,
      sizeCalculation: (entry) => entry.size,
      dispose: (entry, key) => {
        this.totalSize -= entry.size;
      }
    });
  }

  /**
   * Get a cached parse result
   */
  async get(key: string): Promise<ParseResult | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (this.options.ttl) {
      const age = Date.now() - entry.timestamp;
      if (age > this.options.ttl) {
        this.cache.delete(key);
        return null;
      }
    }

    return entry.result;
  }

  /**
   * Set a parse result in cache
   */
  async set(key: string, value: ParseResult): Promise<void> {
    const size = this.estimateSize(value);

    const entry: CacheEntry = {
      result: value,
      size,
      timestamp: Date.now()
    };

    this.cache.set(key, entry);
    this.totalSize += size;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.totalSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    items: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return {
      size: this.totalSize,
      items: this.cache.size,
      hits: 0, // LRUCache tracks this internally but we'd need to wrap it
      misses: 0,
      hitRate: 0
    };
  }

  /**
   * Get current cache size in bytes
   */
  getSize(): number {
    return this.totalSize;
  }

  /**
   * Get number of cached items
   */
  getItemCount(): number {
    return this.cache.size;
  }

  /**
   * Estimate size of parse result in bytes
   */
  private estimateSize(result: ParseResult): number {
    // Rough estimation based on JSON serialization
    const json = JSON.stringify({
      nodes: result.nodes,
      edges: result.edges,
      metadata: result.metadata
    });

    return json.length * 2; // Multiply by 2 for Unicode overhead
  }

  /**
   * Prune cache to free up space
   */
  async prune(): Promise<number> {
    const beforeSize = this.cache.size;
    this.cache.purgeStale();
    const afterSize = this.cache.size;

    return beforeSize - afterSize;
  }
}