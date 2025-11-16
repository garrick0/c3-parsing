/**
 * TypeScriptExtension - Parses TypeScript/JavaScript code as a GraphExtension
 * 
 * This refactors the TypeScript parser from a special "primary parser" into a standard
 * extension, making all data sources equal in the architecture.
 * 
 * Version: 2.0.0 - TypeScript parsing as extension
 */

import { glob } from 'glob';
import type {
  GraphExtension,
  NodeTypeDefinition,
  EdgeTypeDefinition,
  ExtensionContext,
  LinkContext,
  ExtensionResult
} from '../../../domain/ports/GraphExtension.js';
import { Node, type SourceMetadata } from '../../../domain/entities/Node.js';
import { Edge } from '../../../domain/entities/Edge.js';
import { NodeType } from '../../../domain/value-objects/NodeType.js';
import { EdgeType } from '../../../domain/value-objects/EdgeType.js';
import { FileInfo } from '../../../domain/entities/FileInfo.js';
import { Language, detectLanguage } from '../../../domain/value-objects/Language.js';
import { NodeFactory } from '../../../domain/services/NodeFactory.js';
import { EdgeDetector } from '../../../domain/services/EdgeDetector.js';
import { ESTreeGraphConverter } from '../../../domain/services/ast/ESTreeGraphConverter.js';
import { ESTreeTransformer } from '../../adapters/parsers/typescript/ESTreeTransformer.js';
import { TSSymbolExtractor } from '../../adapters/parsers/typescript/TSSymbolExtractor.js';
import { TSEdgeDetector } from '../../adapters/parsers/typescript/TSEdgeDetector.js';
import { ProjectServiceAdapter } from '../../adapters/parsers/typescript/project-service/ProjectServiceAdapter.js';

export interface TypeScriptExtensionConfig {
  // Project Service options
  tsconfigRootDir?: string;
  allowDefaultProject?: string[];
  maximumDefaultProjectFileMatchCount?: number;
  errorOnTypeScriptSyntacticAndSemanticIssues?: boolean;
  extraFileExtensions?: string[];
  
  // Parser options
  includeComments?: boolean;
  includeJSDoc?: boolean;
  includePrivateMembers?: boolean;
  
  // File matching
  extensions?: string[];
  excludePatterns?: string[];
  maxConcurrency?: number;
}

/**
 * TypeScriptExtension - Parse TypeScript/JavaScript as a graph extension
 * 
 * Implements GraphExtension interface for uniform architecture
 */
export class TypeScriptExtension implements GraphExtension {
  readonly name = 'typescript';
  readonly version = '2.0.0';
  readonly domain = 'code';
  
  readonly nodeTypes: NodeTypeDefinition[] = [
    { type: 'file', displayName: 'File', labels: ['CodeElement', 'File'] },
    { type: 'directory', displayName: 'Directory', labels: ['CodeElement', 'Directory'] },
    { type: 'module', displayName: 'Module', labels: ['CodeElement', 'Module'] },
    { type: 'class', displayName: 'Class', labels: ['CodeElement', 'Type', 'Class'] },
    { type: 'interface', displayName: 'Interface', labels: ['CodeElement', 'Type', 'Interface'] },
    { type: 'function', displayName: 'Function', labels: ['CodeElement', 'Callable', 'Function'] },
    { type: 'method', displayName: 'Method', labels: ['CodeElement', 'Callable', 'Method'] },
    { type: 'variable', displayName: 'Variable', labels: ['CodeElement', 'Variable'] },
    { type: 'constant', displayName: 'Constant', labels: ['CodeElement', 'Constant'] },
    { type: 'enum', displayName: 'Enum', labels: ['CodeElement', 'Type', 'Enum'] },
    { type: 'type', displayName: 'Type', labels: ['CodeElement', 'Type'] },
    { type: 'import', displayName: 'Import', labels: ['CodeElement', 'Import'] },
    { type: 'export', displayName: 'Export', labels: ['CodeElement', 'Export'] }
  ];
  
  readonly edgeTypes: EdgeTypeDefinition[] = [
    { type: 'depends_on', displayName: 'Depends On' },
    { type: 'imports', displayName: 'Imports' },
    { type: 'exports', displayName: 'Exports' },
    { type: 'contains', displayName: 'Contains' },
    { type: 'calls', displayName: 'Calls' },
    { type: 'extends', displayName: 'Extends' },
    { type: 'implements', displayName: 'Implements' },
    { type: 'references', displayName: 'References' }
  ];
  
  private sourceMetadata: SourceMetadata;
  private projectServiceAdapter?: ProjectServiceAdapter;
  private estreeTransformer?: ESTreeTransformer;
  private symbolExtractor: TSSymbolExtractor;
  private tsEdgeDetector: TSEdgeDetector;
  private graphConverter?: ESTreeGraphConverter;
  private nodeFactory: NodeFactory;
  private edgeDetector: EdgeDetector;
  
  constructor(private config: TypeScriptExtensionConfig = {}) {
    this.sourceMetadata = {
      domain: this.domain,
      extension: this.name,
      version: this.version,
      timestamp: new Date()
    };
    
    // Initialize reusable components
    this.nodeFactory = new NodeFactory();
    this.edgeDetector = new EdgeDetector();
    this.symbolExtractor = new TSSymbolExtractor();
    this.tsEdgeDetector = new TSEdgeDetector();
  }
  
  async parse(context: ExtensionContext): Promise<ExtensionResult> {
    context.logger.info('Parsing TypeScript/JavaScript code', {
      rootPath: context.rootPath,
      extensions: this.config.extensions || ['.ts', '.tsx', '.js', '.jsx']
    });
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    try {
      // Initialize Project Service (lazy, one-time)
      if (!this.projectServiceAdapter) {
        context.logger.info('Initializing TypeScript Project Service');
        
        this.projectServiceAdapter = new ProjectServiceAdapter(
          context.logger,
          {
            tsconfigRootDir: this.config.tsconfigRootDir || context.rootPath,
            allowDefaultProject: this.config.allowDefaultProject || ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
            maximumDefaultProjectFileMatchCount: this.config.maximumDefaultProjectFileMatchCount,
            errorOnTypeScriptSyntacticAndSemanticIssues: this.config.errorOnTypeScriptSyntacticAndSemanticIssues,
            extraFileExtensions: this.config.extraFileExtensions
          }
        );
        
        this.estreeTransformer = new ESTreeTransformer(context.logger, {
          includeComments: this.config.includeComments,
          includeTokens: false
        });
        
        this.graphConverter = new ESTreeGraphConverter(
          context.logger,
          this.nodeFactory,
          this.edgeDetector,
          {
            includePrivateMembers: this.config.includePrivateMembers
          }
        );
      }
      
      // Find TypeScript/JavaScript files
      const files = await this.findFiles(context.rootPath, context.logger);
      context.logger.info(`Found ${files.length} TypeScript/JavaScript file(s)`);
      
      // Parse files with concurrency control
      const maxConcurrency = this.config.maxConcurrency || 10;
      const results = await this.parseFilesWithConcurrency(
        files,
        maxConcurrency,
        context.logger
      );
      
      // Collect all nodes and edges
      for (const result of results) {
        nodes.push(...result.nodes);
        edges.push(...result.edges);
      }
      
      context.logger.info('TypeScript parsing complete', {
        nodes: nodes.length,
        edges: edges.length
      });
      
      return { nodes, edges };
      
    } catch (error) {
      context.logger.error('TypeScript extension failed', error as Error);
      throw error;
    }
  }
  
  async link(context: LinkContext): Promise<Edge[]> {
    // Future: Could link code files to filesystem nodes
    // e.g., create edges from code 'file' nodes to 'fs_file' nodes
    context.logger.debug('TypeScript extension: no cross-linking implemented yet');
    return [];
  }
  
  async dispose(): Promise<void> {
    if (this.projectServiceAdapter) {
      this.projectServiceAdapter.dispose();
    }
  }
  
  /**
   * Find TypeScript/JavaScript files in directory
   */
  private async findFiles(rootPath: string, logger: any): Promise<string[]> {
    const extensions = this.config.extensions || ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];
    const patterns = extensions.map(ext => `**/*${ext}`);
    
    const excludePatterns = this.config.excludePatterns || [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**'
    ];
    
    const files: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const matches = await glob(pattern, {
          cwd: rootPath,
          absolute: true,
          ignore: excludePatterns
        });
        files.push(...matches);
      } catch (error: any) {
        logger.warn(`Failed to glob pattern ${pattern}:`, error.message);
      }
    }
    
    return [...new Set(files)]; // Remove duplicates
  }
  
  /**
   * Parse files with concurrency control
   */
  private async parseFilesWithConcurrency(
    files: string[],
    maxConcurrency: number,
    logger: any
  ): Promise<Array<{ nodes: Node[]; edges: Edge[] }>> {
    const results: Array<{ nodes: Node[]; edges: Edge[] }> = [];
    const chunks: string[][] = [];
    
    // Split files into chunks
    for (let i = 0; i < files.length; i += maxConcurrency) {
      chunks.push(files.slice(i, i + maxConcurrency));
    }
    
    // Process chunks sequentially, files within chunk concurrently
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(file => this.parseFile(file, logger))
      );
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  /**
   * Parse a single file
   */
  private async parseFile(
    filePath: string,
    logger: any
  ): Promise<{ nodes: Node[]; edges: Edge[] }> {
    try {
      const fileInfo = await this.createFileInfo(filePath);
      const source = await this.readFile(filePath);
      
      // Get Program from Project Service
      const result = await this.projectServiceAdapter!.getProgram(
        filePath,
        source,
        true // hasFullTypeInformation
      );
      
      if (!result || !result.ast || !result.program) {
        logger.warn(`Failed to get Program for ${filePath}`);
        return { nodes: [], edges: [] };
      }
      
      // Transform to ESTree
      const estree = await this.estreeTransformer!.transform(
        result.ast,
        result.program,
        fileInfo
      );
      
      // Convert to graph
      const graphResult = await this.graphConverter!.convert(estree, fileInfo);
      
      // Extract symbols
      const symbols = await this.symbolExtractor.extractSymbols(
        result.ast,
        result.program
      );
      
      // Detect edges
      const detectedEdges = await this.tsEdgeDetector.detectEdges(
        result.ast,
        result.program
      );
      
      // Add source metadata to all nodes
      const nodes = graphResult.nodes.map(node => {
        if (!node.source) {
          return new Node(
            node.id,
            node.type,
            node.name,
            node.metadata,
            node.labels,
            this.sourceMetadata
          );
        }
        return node;
      });
      
      // Add source metadata to all edges
      const edges = [
        ...graphResult.edges.map(edge => {
          if (!edge.source) {
            return new Edge(
              edge.id,
              edge.type,
              edge.fromNodeId,
              edge.toNodeId,
              edge.metadata,
              this.sourceMetadata
            );
          }
          return edge;
        }),
        ...(detectedEdges || []).map(edge => {
          if (!edge.source) {
            return new Edge(
              edge.id,
              edge.type,
              edge.fromNodeId,
              edge.toNodeId,
              edge.metadata,
              this.sourceMetadata
            );
          }
          return edge;
        })
      ];
      
      return { nodes, edges };
      
    } catch (error) {
      logger.error(`Failed to parse ${filePath}`, error as Error);
      return { nodes: [], edges: [] };
    }
  }
  
  /**
   * Create FileInfo from path
   */
  private async createFileInfo(filePath: string): Promise<FileInfo> {
    const { stat } = await import('fs/promises');
    const stats = await stat(filePath);
    const extension = filePath.substring(filePath.lastIndexOf('.'));
    const language = detectLanguage(extension);
    
    return new FileInfo(
      `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filePath,
      extension,
      stats.size,
      language,
      stats.mtime
    );
  }
  
  /**
   * Read file content
   */
  private async readFile(filePath: string): Promise<string> {
    const { readFile } = await import('fs/promises');
    return readFile(filePath, 'utf-8');
  }
}

