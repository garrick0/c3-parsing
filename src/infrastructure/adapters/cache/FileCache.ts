/**
 * FileCache - File-based persistent cache for parse results
 */

import { ParseResult } from '../../../domain/ports/Parser.js';
import { readFile, writeFile, mkdir, unlink, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { createHash } from 'crypto';

export interface FileCacheOptions {
  directory?: string; // Cache directory path
  maxSize?: number; // Maximum cache size in bytes
  compression?: boolean; // Enable gzip compression
}

export interface FileCacheMetadata {
  key: string;
  timestamp: number;
  size: number;
  version: string;
}

export class FileCache {
  private readonly cacheDir: string;
  private readonly maxSize: number;
  private currentSize: number = 0;

  constructor(private options: FileCacheOptions = {}) {
    this.cacheDir = options.directory || '.c3-cache';
    this.maxSize = options.maxSize || 1024 * 1024 * 1024; // 1GB default
  }

  /**
   * Initialize cache directory
   */
  async initialize(): Promise<void> {
    try {
      await mkdir(this.cacheDir, { recursive: true });
      await this.calculateCurrentSize();
    } catch (error) {
      console.warn('Failed to initialize file cache', error);
    }
  }

  /**
   * Get a cached parse result
   */
  async get(key: string): Promise<ParseResult | null> {
    try {
      const filePath = this.getFilePath(key);
      const metadataPath = this.getMetadataPath(key);

      // Check if cache file exists
      const data = await readFile(filePath, 'utf-8');
      const metadataStr = await readFile(metadataPath, 'utf-8');
      const metadata: FileCacheMetadata = JSON.parse(metadataStr);

      // Validate cache entry
      if (!this.isValid(metadata)) {
        await this.delete(key);
        return null;
      }

      // Parse and return result
      const result: ParseResult = JSON.parse(data);
      return result;
    } catch (error) {
      // Cache miss or error
      return null;
    }
  }

  /**
   * Set a parse result in cache
   */
  async set(key: string, value: ParseResult): Promise<void> {
    try {
      await this.initialize();

      const filePath = this.getFilePath(key);
      const metadataPath = this.getMetadataPath(key);

      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });

      // Serialize result
      const data = JSON.stringify(value, null, 0); // No formatting for smaller size
      const size = Buffer.byteLength(data, 'utf-8');

      // Check size constraints
      if (this.currentSize + size > this.maxSize) {
        await this.evict(size);
      }

      // Write data
      await writeFile(filePath, data, 'utf-8');

      // Write metadata
      const metadata: FileCacheMetadata = {
        key,
        timestamp: Date.now(),
        size,
        version: '1.0.0'
      };
      await writeFile(metadataPath, JSON.stringify(metadata), 'utf-8');

      this.currentSize += size;
    } catch (error) {
      console.warn('Failed to write to file cache', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      const metadataPath = this.getMetadataPath(key);

      // Get file size before deletion
      const stats = await stat(filePath);
      const size = stats.size;

      // Delete files
      await unlink(filePath);
      await unlink(metadataPath).catch(() => {}); // Ignore if metadata doesn't exist

      this.currentSize -= size;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const files = await readdir(this.cacheDir);

      for (const file of files) {
        const filePath = join(this.cacheDir, file);
        await unlink(filePath).catch(() => {});
      }

      this.currentSize = 0;
    } catch (error) {
      console.warn('Failed to clear file cache', error);
    }
  }

  /**
   * Get cache file path for a key
   */
  private getFilePath(key: string): string {
    const hash = this.hashKey(key);
    const prefix = hash.substring(0, 2);
    return join(this.cacheDir, prefix, `${hash}.json`);
  }

  /**
   * Get metadata file path for a key
   */
  private getMetadataPath(key: string): string {
    const hash = this.hashKey(key);
    const prefix = hash.substring(0, 2);
    return join(this.cacheDir, prefix, `${hash}.meta.json`);
  }

  /**
   * Hash a cache key
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(metadata: FileCacheMetadata): boolean {
    // Check version compatibility
    if (metadata.version !== '1.0.0') {
      return false;
    }

    // No TTL check for file cache (persistent)
    return true;
  }

  /**
   * Evict old entries to make space
   */
  private async evict(neededSize: number): Promise<void> {
    try {
      // Get all cache files with metadata
      const entries = await this.getAllEntries();

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);

      // Delete oldest entries until we have enough space
      let freedSize = 0;

      for (const entry of entries) {
        if (freedSize >= neededSize) {
          break;
        }

        await this.delete(entry.metadata.key);
        freedSize += entry.metadata.size;
      }
    } catch (error) {
      console.warn('Failed to evict cache entries', error);
    }
  }

  /**
   * Get all cache entries
   */
  private async getAllEntries(): Promise<Array<{ metadata: FileCacheMetadata; path: string }>> {
    const entries: Array<{ metadata: FileCacheMetadata; path: string }> = [];

    try {
      const prefixes = await readdir(this.cacheDir);

      for (const prefix of prefixes) {
        const prefixDir = join(this.cacheDir, prefix);
        const files = await readdir(prefixDir);

        for (const file of files) {
          if (file.endsWith('.meta.json')) {
            const metadataPath = join(prefixDir, file);
            const metadataStr = await readFile(metadataPath, 'utf-8');
            const metadata: FileCacheMetadata = JSON.parse(metadataStr);

            entries.push({
              metadata,
              path: metadataPath.replace('.meta.json', '.json')
            });
          }
        }
      }
    } catch {
      // Ignore errors
    }

    return entries;
  }

  /**
   * Calculate current cache size
   */
  private async calculateCurrentSize(): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      this.currentSize = entries.reduce((sum, entry) => sum + entry.metadata.size, 0);
    } catch {
      this.currentSize = 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    size: number;
    items: number;
    directory: string;
  }> {
    const entries = await this.getAllEntries();

    return {
      size: this.currentSize,
      items: entries.length,
      directory: this.cacheDir
    };
  }
}