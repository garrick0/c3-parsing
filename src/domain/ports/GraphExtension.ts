/**
 * GraphExtension - Interface for extending the property graph with new data sources
 * 
 * Extensions are simple implementations that parse additional data sources
 * (git, filesystem, test coverage, etc.) and integrate them into the unified graph.
 * 
 * Extensions are injected at configuration time - no plugin discovery needed.
 */

import type { Node } from '../entities/Node.js';
import type { Edge } from '../entities/Edge.js';
import type { Logger } from 'c3-shared';

/**
 * Node type definition - describes a type of node this extension creates
 */
export interface NodeTypeDefinition {
  type: string;                // 'git_commit', 'fs_file', etc.
  displayName: string;         // 'Git Commit', 'File', etc.
  labels: string[];            // ['GitObject', 'Commit']
}

/**
 * Edge type definition - describes a type of edge this extension creates
 */
export interface EdgeTypeDefinition {
  type: string;                // 'modified_by', 'parent_of', etc.
  displayName: string;         // 'Modified By', 'Parent Of', etc.
}

/**
 * Extension context - provided during parse()
 */
export interface ExtensionContext {
  rootPath: string;
  logger: Logger;
  config?: Record<string, any>;
}

/**
 * Link context - provided during link()
 */
export interface LinkContext {
  allNodes: Map<string, Node>;
  query: GraphQuery;
  logger: Logger;
}

/**
 * Graph query interface - for finding nodes during linking
 */
export interface GraphQuery {
  findByType(type: string): Node[];
  findByLabel(label: string): Node[];
  findByDomain(domain: string): Node[];
  find(criteria: NodeCriteria): Node[];
  findOne(criteria: NodeCriteria): Node | undefined;
}

export interface NodeCriteria {
  type?: string;
  labels?: string[];
  domain?: string;
  metadata?: Partial<Record<string, any>>;
}

/**
 * Extension result - returned from parse()
 */
export interface ExtensionResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * GraphExtension - Main extension interface
 * 
 * All extensions must implement this interface.
 */
export interface GraphExtension {
  /**
   * Extension metadata
   */
  readonly name: string;
  readonly version: string;
  readonly domain: string; // 'git', 'filesystem', 'testing', etc.
  
  /**
   * Node/edge types this extension provides
   * Used for type registration and validation
   */
  readonly nodeTypes: NodeTypeDefinition[];
  readonly edgeTypes: EdgeTypeDefinition[];
  
  /**
   * Parse the source and return nodes/edges
   * 
   * @param context - Parsing context (root path, logger, etc.)
   * @returns Nodes and edges created by this extension
   */
  parse(context: ExtensionContext): Promise<ExtensionResult>;
  
  /**
   * Link this extension's nodes to other nodes in the graph
   * Called after all extensions have parsed
   * 
   * @param context - Link context (all nodes, query interface)
   * @returns Additional edges linking to other nodes
   */
  link(context: LinkContext): Promise<Edge[]>;
  
  /**
   * Optional: Dispose resources
   */
  dispose?(): Promise<void>;
}

/**
 * GraphQuery implementation
 */
export class GraphQueryImpl implements GraphQuery {
  constructor(private nodes: Map<string, Node>) {}
  
  findByType(type: string): Node[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type);
  }
  
  findByLabel(label: string): Node[] {
    return Array.from(this.nodes.values()).filter(n => n.hasLabel(label));
  }
  
  findByDomain(domain: string): Node[] {
    return Array.from(this.nodes.values()).filter(n => n.isFromDomain(domain));
  }
  
  find(criteria: NodeCriteria): Node[] {
    return Array.from(this.nodes.values()).filter(node => {
      if (criteria.type && node.type !== criteria.type) {
        return false;
      }
      
      if (criteria.labels && !node.hasAllLabels(criteria.labels)) {
        return false;
      }
      
      if (criteria.domain && !node.isFromDomain(criteria.domain)) {
        return false;
      }
      
      if (criteria.metadata) {
        for (const [key, value] of Object.entries(criteria.metadata)) {
          if (node.metadata[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  findOne(criteria: NodeCriteria): Node | undefined {
    return this.find(criteria)[0];
  }
}

