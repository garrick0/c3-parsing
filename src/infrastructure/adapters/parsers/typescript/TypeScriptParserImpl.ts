/**
 * TypeScriptParserImpl - Real TypeScript/JavaScript AST parser using ts-morph
 */

import { Project, SourceFile, Node as TSNode, ts, ScriptTarget, ModuleKind } from 'ts-morph';
import { BaseParser } from '../base/BaseParser.js';
import { UnifiedAST } from '../../../../domain/entities/ast/UnifiedAST.js';
import { FileInfo } from '../../../../domain/entities/FileInfo.js';
import { ParseResult } from '../../../../domain/ports/Parser.js';
import { NodeFactory } from '../../../../domain/services/NodeFactory.js';
import { EdgeDetector } from '../../../../domain/services/EdgeDetector.js';
import { Logger } from '../../../mocks/c3-shared.js';
import { TSASTTransformer } from './TSASTTransformer.js';
import { TSSymbolExtractor } from './TSSymbolExtractor.js';
import { TSEdgeDetector } from './TSEdgeDetector.js';
import { TSGraphConverter } from './TSGraphConverter.js';

export interface TypeScriptParserOptions {
  compilerOptions?: ts.CompilerOptions;
  includeComments?: boolean;
  resolveModules?: boolean;
  extractTypes?: boolean;
}

export class TypeScriptParserImpl extends BaseParser<SourceFile> {
  private project: Project;
  private astTransformer: TSASTTransformer;
  private symbolExtractor: TSSymbolExtractor;
  private tsEdgeDetector: TSEdgeDetector;
  private tsGraphConverter: TSGraphConverter;

  constructor(
    logger: Logger,
    nodeFactory: NodeFactory,
    edgeDetector: EdgeDetector,
    private options: TypeScriptParserOptions = {}
  ) {
    super(logger, nodeFactory, edgeDetector);

    // Initialize ts-morph project with compiler options
    this.project = new Project({
      compilerOptions: this.options.compilerOptions || {
        target: ScriptTarget.ES2022,
        module: ModuleKind.ES2022,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        allowJs: true,
        checkJs: false,
        declaration: true,
        sourceMap: true
      },
      useInMemoryFileSystem: true // Use in-memory FS for performance
    });

    // Initialize components
    this.astTransformer = new TSASTTransformer(this.options);
    this.symbolExtractor = new TSSymbolExtractor();
    this.tsEdgeDetector = new TSEdgeDetector();
    this.tsGraphConverter = new TSGraphConverter(nodeFactory, edgeDetector);
  }

  /**
   * Parse source code to TypeScript AST using ts-morph
   */
  protected async parseToLanguageAST(
    source: string,
    fileInfo: FileInfo
  ): Promise<SourceFile> {
    try {
      this.logger.debug(`Parsing TypeScript file: ${fileInfo.path}`);

      // Create source file in ts-morph project
      const sourceFile = this.project.createSourceFile(
        fileInfo.path,
        source,
        { overwrite: true }
      );

      // Get and log diagnostics
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      if (diagnostics.length > 0) {
        this.logger.warn(`TypeScript diagnostics found in ${fileInfo.path}`, {
          count: diagnostics.length,
          errors: diagnostics.filter(d => d.getCategory() === ts.DiagnosticCategory.Error).length,
          warnings: diagnostics.filter(d => d.getCategory() === ts.DiagnosticCategory.Warning).length
        });
      }

      // Optionally resolve module references
      if (this.options.resolveModules) {
        this.resolveModuleReferences(sourceFile);
      }

      return sourceFile;
    } catch (error) {
      this.logger.error(`Failed to parse TypeScript AST`, error as Error);
      throw error;
    }
  }

  /**
   * Transform ts-morph AST to unified AST representation
   */
  protected async transformToUnified(
    sourceFile: SourceFile,
    fileInfo: FileInfo
  ): Promise<UnifiedAST> {
    try {
      // Transform the AST
      const unifiedAST = await this.astTransformer.transform(sourceFile, fileInfo);

      // Extract symbols
      const symbols = await this.symbolExtractor.extractSymbols(sourceFile);

      // Add symbols to unified AST
      for (const symbolType of Object.values(symbols)) {
        if (Array.isArray(symbolType)) {
          for (const symbol of symbolType) {
            if ('name' in symbol && symbol.name) {
              unifiedAST.symbols.set(symbol.name, symbol as any);
            }
          }
        }
      }

      // Detect edges/relationships
      const edges = await this.tsEdgeDetector.detectEdges(sourceFile);

      // Store edge information in metadata for graph conversion
      (unifiedAST as any).detectedEdges = edges;

      return unifiedAST;
    } catch (error) {
      this.logger.error(`Failed to transform to unified AST`, error as Error);
      throw error;
    }
  }

  /**
   * Convert unified AST to property graph
   */
  protected async convertToGraph(
    ast: UnifiedAST,
    fileInfo: FileInfo
  ): Promise<ParseResult> {
    try {
      // Use specialized TypeScript graph converter
      const result = await this.tsGraphConverter.convert(ast, fileInfo);

      // Add detected edges from AST transformation
      const detectedEdges = (ast as any).detectedEdges;
      if (detectedEdges) {
        result.edges.push(...detectedEdges);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to convert to graph`, error as Error);
      throw error;
    }
  }

  /**
   * Resolve module references in the source file
   */
  private resolveModuleReferences(sourceFile: SourceFile): void {
    try {
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDecl of importDeclarations) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();

        // Try to resolve the module
        const resolvedModule = this.resolveModule(moduleSpecifier, sourceFile);

        if (resolvedModule) {
          this.logger.debug(`Resolved module: ${moduleSpecifier} -> ${resolvedModule}`);
        } else {
          this.logger.debug(`Could not resolve module: ${moduleSpecifier}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Error resolving module references`, error as Error);
    }
  }

  /**
   * Resolve a module path
   */
  private resolveModule(modulePath: string, sourceFile: SourceFile): string | undefined {
    try {
      // For now, just return the module path
      // In a real implementation, this would resolve to actual file paths
      if (modulePath.startsWith('.')) {
        // Relative import
        return modulePath;
      } else if (modulePath.startsWith('@')) {
        // Scoped package
        return modulePath;
      } else {
        // Node module or absolute import
        return modulePath;
      }
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get parser name
   */
  getName(): string {
    return 'TypeScriptParserImpl';
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
  }

  /**
   * Check if parser supports a file
   */
  supports(fileInfo: FileInfo): boolean {
    const supportedExtensions = this.getSupportedExtensions();
    return supportedExtensions.includes(fileInfo.extension.toLowerCase());
  }

  /**
   * Get compiler options being used
   */
  getCompilerOptions(): ts.CompilerOptions {
    return this.project.getCompilerOptions();
  }

  /**
   * Clear the project cache
   */
  clearCache(): void {
    // Remove all source files from memory
    const sourceFiles = this.project.getSourceFiles();
    for (const file of sourceFiles) {
      this.project.removeSourceFile(file);
    }
  }
}