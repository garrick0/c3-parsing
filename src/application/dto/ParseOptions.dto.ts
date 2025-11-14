/**
 * ParseOptions DTO
 */

export interface ParseOptions {
  ignorePatterns?: string[];
  maxFileSize?: number;
  followSymlinks?: boolean;
  parsers?: string[];
  includeTests?: boolean;
  includeDocs?: boolean;
}
