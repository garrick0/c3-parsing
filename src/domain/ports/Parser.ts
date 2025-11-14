/**
 * Parser - Interface for language-specific parsers
 */

import { PropertyGraph } from '../entities/PropertyGraph.js';
import { FileInfo } from '../entities/FileInfo.js';

export interface ParseResult {
  nodes: any[];
  edges: any[];
  metadata: Record<string, any>;
}

export interface Parser {
  /**
   * Parse source code into graph elements
   */
  parse(source: string, fileInfo: FileInfo): Promise<ParseResult>;

  /**
   * Check if parser supports this file
   */
  supports(fileInfo: FileInfo): boolean;

  /**
   * Get parser name
   */
  getName(): string;

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[];
}
