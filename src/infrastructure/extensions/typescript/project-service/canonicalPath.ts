/**
 * Canonical Path Utilities
 *
 * Adapted from typescript-eslint v8
 * Original: https://github.com/typescript-eslint/typescript-eslint
 * License: MIT
 *
 * Utilities for normalizing file paths to canonical form, handling
 * case-sensitivity correctly across different operating systems.
 */

import * as path from 'node:path';
import * as ts from 'typescript';

// Brand type for canonical paths - ensures type safety
declare const CanonicalPathBrand: unique symbol;
export type CanonicalPath = string & { [CanonicalPathBrand]: true };

/**
 * Normalizes a file path to canonical form
 *
 * This function:
 * 1. Normalizes the path (resolves . and ..)
 * 2. Removes trailing separators
 * 3. Converts to lowercase on case-insensitive file systems
 *
 * @param filePath - Path to normalize
 * @returns Canonical path
 */
export function getCanonicalFileName(filePath: string): CanonicalPath {
  let normalized = path.normalize(filePath);

  // Remove trailing separator if present
  if (normalized.endsWith(path.sep)) {
    normalized = normalized.slice(0, -1);
  }

  // Convert to lowercase on case-insensitive file systems
  if (!ts.sys.useCaseSensitiveFileNames) {
    normalized = normalized.toLowerCase();
  }

  return normalized as CanonicalPath;
}

/**
 * Gets the canonical directory name for a file path
 *
 * @param filePath - File path to get directory from
 * @returns Canonical directory path
 */
export function canonicalDirname(filePath: CanonicalPath): CanonicalPath {
  return path.dirname(filePath) as CanonicalPath;
}

/**
 * Ensures a path is absolute
 *
 * If the path is already absolute, returns it unchanged.
 * Otherwise, resolves it relative to tsconfigRootDir or cwd.
 *
 * @param filePath - Path to make absolute
 * @param tsconfigRootDir - Root directory for relative resolution
 * @returns Absolute path
 */
export function ensureAbsolutePath(
  filePath: string,
  tsconfigRootDir?: string
): string {
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(tsconfigRootDir ?? process.cwd(), filePath);
}

/**
 * Creates a hash for content
 *
 * Uses TypeScript's built-in hash function if available,
 * otherwise returns the content itself (for browser environments)
 *
 * @param content - Content to hash
 * @returns Hash string
 */
export function createHash(content: string): string {
  if (ts.sys.createHash) {
    return ts.sys.createHash(content);
  }
  // Fallback for environments without createHash
  return content;
}
