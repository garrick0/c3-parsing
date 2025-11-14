/**
 * ParseRequest DTO
 */

export interface ParseRequest {
  rootPath: string;
  options?: ParseOptions;
}

export interface ParseOptions {
  ignorePatterns?: string[];
  maxFileSize?: number;
  followSymlinks?: boolean;
  parsers?: string[];
}
