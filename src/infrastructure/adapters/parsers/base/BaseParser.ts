/**
 * BaseParser - Abstract base class for all language parsers
 */

import { Parser, ParseResult } from '../../../../domain/ports/Parser.js';
import { FileInfo } from '../../../../domain/entities/FileInfo.js';
import { UnifiedAST } from '../../../../domain/entities/ast/UnifiedAST.js';
import { NodeFactory } from '../../../../domain/services/NodeFactory.js';
import { EdgeDetector } from '../../../../domain/services/EdgeDetector.js';
import { GraphConverter } from '../../../../domain/services/ast/GraphConverter.js';
import { Logger } from '../../../mocks/c3-shared.js';

export class ParserError extends Error {
  constructor(
    message: string,
    public fileInfo: FileInfo,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

export abstract class BaseParser<TLanguageAST = any> implements Parser {
  protected graphConverter: GraphConverter;

  constructor(
    protected readonly logger: Logger,
    protected readonly nodeFactory: NodeFactory,
    protected readonly edgeDetector: EdgeDetector
  ) {
    this.graphConverter = new GraphConverter(nodeFactory, edgeDetector);
  }

  /**
   * Main parse method - template method pattern
   */
  async parse(source: string, fileInfo: FileInfo): Promise<ParseResult> {
    try {
      // Log start of parsing
      this.logger.debug(`Parsing file: ${fileInfo.path}`);

      // Step 1: Parse to language-specific AST
      const startParse = performance.now();
      const languageAST = await this.parseToLanguageAST(source, fileInfo);
      const parseTime = performance.now() - startParse;

      this.logger.debug(`Language AST parsed in ${parseTime.toFixed(2)}ms`);

      // Step 2: Transform to unified AST
      const startTransform = performance.now();
      const unifiedAST = await this.transformToUnified(languageAST, fileInfo);
      const transformTime = performance.now() - startTransform;

      this.logger.debug(`Transformed to unified AST in ${transformTime.toFixed(2)}ms`);

      // Step 3: Convert to graph elements
      const startConvert = performance.now();
      const graphElements = await this.convertToGraph(unifiedAST, fileInfo);
      const convertTime = performance.now() - startConvert;

      this.logger.debug(`Converted to graph in ${convertTime.toFixed(2)}ms`);

      // Add timing metadata
      graphElements.metadata = {
        ...graphElements.metadata,
        parseTime,
        transformTime,
        convertTime,
        totalTime: parseTime + transformTime + convertTime
      };

      this.logger.info(`Successfully parsed ${fileInfo.path}`, {
        nodes: graphElements.nodes.length,
        edges: graphElements.edges.length,
        totalTime: graphElements.metadata.totalTime
      });

      return graphElements;
    } catch (error) {
      this.logger.error(`Failed to parse ${fileInfo.path}`, error as Error);

      if (error instanceof ParserError) {
        throw error;
      }

      throw new ParserError(
        `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
        fileInfo,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parse source code to language-specific AST
   * Must be implemented by language-specific parsers
   */
  protected abstract parseToLanguageAST(
    source: string,
    fileInfo: FileInfo
  ): Promise<TLanguageAST>;

  /**
   * Transform language-specific AST to unified representation
   * Must be implemented by language-specific parsers
   */
  protected abstract transformToUnified(
    ast: TLanguageAST,
    fileInfo: FileInfo
  ): Promise<UnifiedAST>;

  /**
   * Convert unified AST to property graph elements
   * Can be overridden for custom conversion logic
   */
  protected async convertToGraph(
    ast: UnifiedAST,
    fileInfo: FileInfo
  ): Promise<ParseResult> {
    return this.graphConverter.convert(ast, fileInfo);
  }

  /**
   * Get parser name
   */
  abstract getName(): string;

  /**
   * Get supported file extensions
   */
  abstract getSupportedExtensions(): string[];

  /**
   * Check if parser supports a file
   */
  supports(fileInfo: FileInfo): boolean {
    const supportedExtensions = this.getSupportedExtensions();
    return supportedExtensions.includes(fileInfo.extension);
  }

  /**
   * Validate source code before parsing
   * Can be overridden for language-specific validation
   */
  protected validateSource(source: string, fileInfo: FileInfo): void {
    if (!source) {
      throw new ParserError('Source code is empty', fileInfo);
    }

    if (fileInfo.isTooLarge()) {
      throw new ParserError(
        `File is too large: ${fileInfo.size} bytes`,
        fileInfo
      );
    }
  }

  /**
   * Handle parser errors with recovery strategies
   * Can be overridden for language-specific error handling
   */
  protected handleError(error: Error, context: {
    source: string;
    fileInfo: FileInfo;
    stage: 'parse' | 'transform' | 'convert';
  }): ParseResult | null {
    this.logger.warn(`Error during ${context.stage} stage`, {
      file: context.fileInfo.path,
      error: error.message
    });

    // Default: no recovery, return null to indicate failure
    return null;
  }

  /**
   * Create empty parse result for error cases
   */
  protected createEmptyResult(fileInfo: FileInfo, error?: Error): ParseResult {
    const fileNode = this.nodeFactory.createFileNode(fileInfo.path, {
      error: error?.message,
      size: fileInfo.size
    });

    return {
      nodes: [fileNode],
      edges: [],
      metadata: {
        language: fileInfo.language,
        error: error?.message,
        hasErrors: true
      }
    };
  }
}