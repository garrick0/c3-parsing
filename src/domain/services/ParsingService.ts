/**
 * ParsingService - Main orchestration service for parsing codebases
 */

import { PropertyGraph } from '../entities/PropertyGraph.js';
import { Parser, ParseResult } from '../ports/Parser.js';
import { GraphRepository } from '../ports/GraphRepository.js';
import { FileSystem } from '../ports/FileSystem.js';
import { Cache } from '../ports/Cache.js';
import { Logger } from '../../infrastructure/mocks/c3-shared.js';
import { GraphBuilder } from './GraphBuilder.js';
import { FileInfo } from '../entities/FileInfo.js';
import { Language, detectLanguage } from '../value-objects/Language.js';
import { createHash } from 'crypto';

export interface ParsingOptions {
  maxConcurrency?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
  onProgress?: (current: number, total: number) => void;
}

export class ParsingService {
  constructor(
    private parsers: Parser[],
    private graphRepository: GraphRepository,
    private fileSystem: FileSystem,
    private logger: Logger,
    private cache?: Cache
  ) {}

  /**
   * Parse entire codebase into property graph
   */
  async parseCodebase(
    rootPath: string,
    options: ParsingOptions = {}
  ): Promise<PropertyGraph> {
    const startTime = performance.now();
    this.logger.info('Starting codebase parse', { rootPath });

    try {
      // Find all parseable files
      const files = await this.findParseableFiles(rootPath, options);
      this.logger.info(`Found ${files.length} files to parse`);

      // Parse files with concurrency control
      const results = await this.parseFilesWithConcurrency(
        files,
        options.maxConcurrency || 10,
        options.onProgress
      );

      // Build graph from results
      const graph = this.buildGraphFromResults(results, rootPath);

      // Save to repository
      await this.graphRepository.save(graph);

      const duration = performance.now() - startTime;
      this.logger.info('Parsing complete', {
        files: files.length,
        nodes: graph.getNodeCount(),
        edges: graph.getEdgeCount(),
        duration: `${duration.toFixed(2)}ms`,
        cacheStats: this.cache?.getStats()
      });

      return graph;
    } catch (error) {
      this.logger.error('Failed to parse codebase', error as Error);
      throw error;
    }
  }

  /**
   * Parse single file
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    this.logger.debug('Parsing file', { filePath });

    // Check cache first
    if (this.cache) {
      const content = await this.readFileContent(filePath);
      const cacheKey = this.cache.generateKey(filePath, this.cache.hashContent(content));
      const cached = await this.cache.get(cacheKey);

      if (cached) {
        this.logger.debug('Cache hit for file', { filePath });
        return cached;
      }
    }

    // Find appropriate parser
    const fileInfo = await this.createFileInfo(filePath);
    const parser = this.findParser(fileInfo);

    if (!parser) {
      throw new Error(`No parser found for file: ${filePath}`);
    }

    // Parse file
    const content = await this.readFileContent(filePath);
    const result = await parser.parse(content, fileInfo);

    // Cache result
    if (this.cache) {
      const cacheKey = this.cache.generateKey(filePath, this.cache.hashContent(content));
      await this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Find parser for file
   */
  private findParser(fileInfo: FileInfo): Parser | undefined {
    for (const parser of this.parsers) {
      if (parser.supports(fileInfo)) {
        return parser;
      }
    }
    return undefined;
  }

  /**
   * Find all parseable files in a directory
   */
  private async findParseableFiles(
    rootPath: string,
    options: ParsingOptions
  ): Promise<string[]> {
    const allFiles: string[] = [];
    const excludePatterns = options.excludePatterns || [
      'node_modules',
      'dist',
      'coverage',
      '.git',
      '.cache'
    ];

    // Recursively find files
    await this.walkDirectory(rootPath, allFiles, excludePatterns);

    // Filter by include patterns if specified
    if (options.includePatterns && options.includePatterns.length > 0) {
      return allFiles.filter(file =>
        options.includePatterns!.some(pattern => file.includes(pattern))
      );
    }

    return allFiles;
  }

  /**
   * Recursively walk directory
   */
  private async walkDirectory(
    dir: string,
    files: string[],
    excludePatterns: string[]
  ): Promise<void> {
    // This would use the FileSystem port in a real implementation
    // For now, we'll keep it simple
    // TODO: Implement using fileSystem.readDirectory() when available
  }

  /**
   * Parse multiple files with concurrency control
   */
  private async parseFilesWithConcurrency(
    files: string[],
    maxConcurrency: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<ParseResult[]> {
    const results: ParseResult[] = [];
    let completed = 0;

    // Process in batches
    for (let i = 0; i < files.length; i += maxConcurrency) {
      const batch = files.slice(i, i + maxConcurrency);

      const batchResults = await Promise.allSettled(
        batch.map(file => this.parseFile(file))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.warn('Failed to parse file', result.reason);
        }

        completed++;
        onProgress?.(completed, files.length);
      }
    }

    return results;
  }

  /**
   * Build property graph from parse results
   */
  private buildGraphFromResults(
    results: ParseResult[],
    rootPath: string
  ): PropertyGraph {
    const graphBuilder = new GraphBuilder();

    graphBuilder.start({
      codebaseId: rootPath,
      parsedAt: new Date(),
      language: 'typescript',
      version: '1.0.0'
    });

    // Add all nodes and edges
    for (const result of results) {
      for (const node of result.nodes) {
        graphBuilder.addNode(node);
      }
      for (const edge of result.edges) {
        graphBuilder.addEdge(edge);
      }
    }

    return graphBuilder.build();
  }

  /**
   * Create FileInfo from file path
   */
  private async createFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await this.getFileStats(filePath);
    const extension = this.getExtension(filePath);
    const language = detectLanguage(extension);

    return new FileInfo(
      this.generateFileId(filePath),
      filePath,
      extension,
      stats.size,
      language,
      stats.lastModified
    );
  }

  /**
   * Read file content
   */
  private async readFileContent(filePath: string): Promise<string> {
    // Would use fileSystem.readFile() in production
    const { readFile } = await import('fs/promises');
    return readFile(filePath, 'utf-8');
  }

  /**
   * Get file stats
   */
  private async getFileStats(filePath: string): Promise<{
    size: number;
    lastModified: Date;
  }> {
    const { stat } = await import('fs/promises');
    const stats = await stat(filePath);
    return {
      size: stats.size,
      lastModified: stats.mtime
    };
  }

  /**
   * Get file extension
   */
  private getExtension(filePath: string): string {
    const parts = filePath.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(filePath: string): string {
    const hash = createHash('md5').update(filePath).digest('hex');
    return `file-${hash}`;
  }

  /**
   * Get cached graph
   */
  async getCachedGraph(codebaseId: string): Promise<PropertyGraph | undefined> {
    return this.graphRepository.findById(codebaseId);
  }

  /**
   * Clear parse cache
   */
  async clearCache(): Promise<void> {
    if (this.cache) {
      await this.cache.clear();
      this.logger.info('Parse cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache?.getStats();
  }
}
