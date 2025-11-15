/**
 * ParserFactory - Factory for creating parser instances
 */

import { Parser } from '../../../../domain/ports/Parser.js';
import { Language } from '../../../../domain/value-objects/Language.js';
import { NodeFactory } from '../../../../domain/services/NodeFactory.js';
import { EdgeDetector } from '../../../../domain/services/EdgeDetector.js';
import { Logger } from '../../../mocks/c3-shared.js';

// Import stub parsers for backward compatibility
import { TypeScriptParser as StubTypeScriptParser } from '../../TypeScriptParser.js';
import { PythonParser as StubPythonParser } from '../../PythonParser.js';

// Import real TypeScript parser (Phase 2)
import { TypeScriptParserImpl } from '../typescript/TypeScriptParserImpl.js';

export interface ParserOptions {
  /**
   * @deprecated Use real parsers by default. This option will be removed in v2.0.0
   */
  useRealParser?: boolean;
  logger: Logger;
  nodeFactory?: NodeFactory;
  edgeDetector?: EdgeDetector;
  /**
   * Use stub parsers for testing only
   * @deprecated Stub parsers will be removed in v2.0.0
   */
  useStubParser?: boolean;
}

export class ParserFactory {
  private parsers: Map<string, Parser> = new Map();
  private nodeFactory: NodeFactory;
  private edgeDetector: EdgeDetector;

  constructor(
    private options: ParserOptions
  ) {
    this.nodeFactory = options.nodeFactory || new NodeFactory();
    this.edgeDetector = options.edgeDetector || new EdgeDetector();
    this.initializeParsers();
  }

  /**
   * Initialize available parsers
   */
  private initializeParsers(): void {
    // Phase 3: Use real parsers by default
    if (this.options.useStubParser) {
      // Backward compatibility: Allow explicit stub parser usage
      this.options.logger.warn('Using deprecated stub parsers. Stub parsers will be removed in v2.0.0');
      this.registerStubParsers();
    } else {
      // Default: Use real parsers
      this.registerRealParsers();
      this.options.logger.info('Using real TypeScript parser implementation');
    }
  }

  /**
   * Register real parsers (Phase 2)
   */
  private registerRealParsers(): void {
    // TypeScript real parser
    const tsRealParser = new TypeScriptParserImpl(
      this.options.logger,
      this.nodeFactory,
      this.edgeDetector,
      {
        includeComments: false,
        resolveModules: true,
        extractTypes: true
      }
    );

    this.parsers.set('typescript', tsRealParser);
    this.parsers.set('javascript', tsRealParser); // Also use for JavaScript

    // Python real parser will be added when implemented
    // this.parsers.set('python', new PythonParserImpl(...));
  }

  /**
   * Register stub parsers
   */
  private registerStubParsers(): void {
    // TypeScript stub parser
    const tsStubParser = new StubTypeScriptParser();
    this.parsers.set('typescript-stub', tsStubParser);
    this.parsers.set('javascript-stub', tsStubParser);

    // Python stub parser
    const pyStubParser = new StubPythonParser();
    this.parsers.set('python-stub', pyStubParser);
  }

  /**
   * Create parser for a specific language
   */
  createParser(language: Language | string): Parser {
    const lang = language.toString().toLowerCase();

    // Check for real parser first (if enabled)
    if (this.options.useRealParser) {
      const realParser = this.parsers.get(lang);
      if (realParser) {
        return realParser;
      }
    }

    // Fall back to stub parser
    const stubKey = `${lang}-stub`;
    const stubParser = this.parsers.get(stubKey);

    if (stubParser) {
      this.options.logger.debug(`Using stub parser for ${lang}`);
      return stubParser;
    }

    throw new Error(`No parser available for language: ${language}`);
  }

  /**
   * Get parser by file extension
   */
  getParserForExtension(extension: string): Parser | null {
    // Map extensions to languages
    const extensionMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.mjs': 'javascript',
      '.py': 'python'
    };

    const language = extensionMap[extension];
    if (!language) {
      return null;
    }

    try {
      return this.createParser(language);
    } catch {
      return null;
    }
  }

  /**
   * Register a custom parser
   */
  registerParser(key: string, parser: Parser): void {
    this.parsers.set(key, parser);
    this.options.logger.info(`Registered parser: ${key}`);
  }

  /**
   * Get all registered parsers
   */
  getRegisteredParsers(): string[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * Check if real parsers are enabled
   */
  isUsingRealParsers(): boolean {
    return this.options.useRealParser || false;
  }

  /**
   * Clear all registered parsers
   */
  clear(): void {
    this.parsers.clear();
  }
}