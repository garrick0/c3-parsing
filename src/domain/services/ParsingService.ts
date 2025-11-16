/**
 * ParsingService - Main orchestration service for parsing codebases
 * 
 * Version 2.0.0: Simplified to work only with extensions
 * All data sources (TypeScript, Filesystem, Git, etc.) are now extensions
 */

import { PropertyGraph } from '../entities/PropertyGraph.js';
import { GraphRepository } from '../ports/GraphRepository.js';
import { Logger } from 'c3-shared';
import { GraphBuilder } from './GraphBuilder.js';
import type { GraphExtension, ExtensionContext, LinkContext } from '../ports/GraphExtension.js';
import { GraphQueryImpl } from '../ports/GraphExtension.js';
import type { Node } from '../entities/Node.js';

export interface ParsingOptions {
  onProgress?: (current: number, total: number) => void;
  extensions?: GraphExtension[];  // Override constructor extensions
}

/**
 * ParsingService - Orchestrates graph extensions
 * 
 * Version 2.0.0 Changes:
 * - Removed Parser/FileSystem/Cache dependencies
 * - Simplified to only work with extensions
 * - All data sources are now extensions (TypeScript, Filesystem, etc.)
 */
export class ParsingService {
  constructor(
    private graphRepository: GraphRepository,
    private logger: Logger,
    private extensions: GraphExtension[] = []
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
      // Create empty graph
      const graphBuilder = new GraphBuilder();
      graphBuilder.start({
        codebaseId: rootPath,
        parsedAt: new Date(),
        language: 'multi',  // Multi-source graph
        version: '2.0.0'
      });
      
      const graph = graphBuilder.build();
      
      // Run extensions (TypeScript, Filesystem, Git, etc.)
      const extensionsToRun = options.extensions || this.extensions;
      
      if (extensionsToRun.length === 0) {
        this.logger.warn('No extensions configured - graph will be empty');
      }
      
      await this.runExtensions(extensionsToRun, rootPath, graph);
      
      // Save to repository
      await this.graphRepository.save(graph);
      
      const duration = performance.now() - startTime;
      this.logger.info('Parsing complete', {
        nodes: graph.getNodeCount(),
        edges: graph.getEdgeCount(),
        extensions: extensionsToRun.map(e => `${e.name}@${e.version}`),
        duration: `${duration.toFixed(2)}ms`
      });
      
      return graph;
    } catch (error) {
      this.logger.error('Failed to parse codebase', error as Error);
      throw error;
    }
  }
  
  /**
   * Run extensions to add data to the graph
   * 
   * Two-phase processing:
   * 1. Parse phase - Each extension parses its data source
   * 2. Link phase - Extensions create cross-domain edges
   */
  private async runExtensions(
    extensions: GraphExtension[],
    rootPath: string,
    graph: PropertyGraph
  ): Promise<void> {
    this.logger.info(`Running ${extensions.length} extension(s)`, {
      extensions: extensions.map(e => `${e.name}@${e.version}`)
    });
    
    // Phase 1: Parse - each extension parses its data source
    const extensionResults = new Map<GraphExtension, { nodes: Node[], edges: any[] }>();
    
    for (const extension of extensions) {
      try {
        this.logger.info(`Running extension: ${extension.name}`, {
          domain: extension.domain,
          version: extension.version
        });
        
        const context: ExtensionContext = {
          rootPath,
          logger: this.logger,
          config: {}
        };
        
        const result = await extension.parse(context);
        
        this.logger.info(`Extension ${extension.name} complete`, {
          nodes: result.nodes.length,
          edges: result.edges.length
        });
        
        // Add extension nodes and edges to graph
        for (const node of result.nodes) {
          graph.addNode(node);
        }
        for (const edge of result.edges) {
          graph.addEdge(edge);
        }
        
        extensionResults.set(extension, result);
        
      } catch (error) {
        this.logger.error(`Extension ${extension.name} failed`, error as Error);
        // Continue with other extensions
      }
    }
    
    // Phase 2: Link - extensions can create edges to nodes from other extensions
    this.logger.info('Running extension linking phase');
    
    // Create node map for query interface
    const allNodesMap = new Map<string, Node>();
    for (const node of graph.getNodes()) {
      allNodesMap.set(node.id, node);
    }
    
    for (const extension of extensions) {
      try {
        const context: LinkContext = {
          allNodes: allNodesMap,
          query: new GraphQueryImpl(allNodesMap),
          logger: this.logger
        };
        
        const linkEdges = await extension.link(context);
        
        if (linkEdges.length > 0) {
          this.logger.info(`Extension ${extension.name} created ${linkEdges.length} link edge(s)`);
          
          for (const edge of linkEdges) {
            graph.addEdge(edge);
          }
        }
        
      } catch (error) {
        this.logger.error(`Extension ${extension.name} linking failed`, error as Error);
        // Continue with other extensions
      }
    }
    
    this.logger.info('Extension processing complete');
  }
  
  /**
   * Get list of configured extensions
   */
  getExtensions(): GraphExtension[] {
    return this.extensions;
  }
}
