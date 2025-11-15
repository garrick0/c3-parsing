/**
 * FileInfo - Metadata about a file in the codebase
 */

import { Entity } from '../../infrastructure/mocks/c3-shared.js';
import { Language } from '../value-objects/Language.js';

export class FileInfo extends Entity<string> {
  constructor(
    id: string,
    public readonly path: string,
    public readonly extension: string,
    public readonly size: number,
    public readonly language: Language,
    public readonly lastModified: Date
  ) {
    super(id);
  }

  /**
   * Get file name
   */
  getFileName(): string {
    return this.path.split('/').pop() || '';
  }

  /**
   * Get directory path
   */
  getDirectory(): string {
    const parts = this.path.split('/');
    parts.pop();
    return parts.join('/');
  }

  /**
   * Check if file should be analyzed
   */
  shouldAnalyze(): boolean {
    const excludePatterns = ['node_modules', 'dist', 'coverage', '.git'];
    return !excludePatterns.some(pattern => this.path.includes(pattern));
  }

  /**
   * Get relative path from base
   */
  getRelativePath(base: string): string {
    return this.path.replace(base, '').replace(/^\//, '');
  }

  /**
   * Check if file is too large
   */
  isTooLarge(maxSize: number = 1024 * 1024): boolean {
    return this.size > maxSize;
  }
}
