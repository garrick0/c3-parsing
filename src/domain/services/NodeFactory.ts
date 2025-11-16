/**
 * NodeFactory - Creates graph nodes
 */

import { Node, NodeMetadata, SourceMetadata } from '../entities/Node.js';
import { NodeType } from '../value-objects/NodeType.js';

export class NodeFactory {
  private nodeCounter = 0;

  /**
   * Create a file node
   */
  createFileNode(
    filePath: string,
    metadata: Partial<NodeMetadata> = {},
    labels?: string[],
    source?: SourceMetadata
  ): Node {
    const fileName = filePath.split('/').pop() || filePath;
    
    // Default labels for file nodes
    const defaultLabels = new Set(['FileSystemObject']);
    const allLabels = labels 
      ? new Set([...defaultLabels, ...labels])
      : defaultLabels;

    return new Node(
      this.generateId('file'),
      NodeType.FILE,
      fileName,
      {
        filePath,
        ...metadata
      },
      allLabels,
      source
    );
  }

  /**
   * Create a directory node
   */
  createDirectoryNode(
    dirPath: string,
    metadata: Partial<NodeMetadata> = {},
    labels?: string[],
    source?: SourceMetadata
  ): Node {
    const dirName = dirPath.split('/').pop() || dirPath;
    
    // Default labels for directory nodes
    const defaultLabels = new Set(['FileSystemObject']);
    const allLabels = labels 
      ? new Set([...defaultLabels, ...labels])
      : defaultLabels;

    return new Node(
      this.generateId('dir'),
      NodeType.DIRECTORY,
      dirName,
      {
        filePath: dirPath,
        ...metadata
      },
      allLabels,
      source
    );
  }

  /**
   * Create a class node
   */
  createClassNode(
    className: string,
    filePath: string,
    metadata: Partial<NodeMetadata> = {},
    labels?: string[],
    source?: SourceMetadata
  ): Node {
    // Default labels for class nodes
    const defaultLabels = new Set(['CodeElement', 'Type']);
    const allLabels = labels 
      ? new Set([...defaultLabels, ...labels])
      : defaultLabels;

    return new Node(
      this.generateId('class'),
      NodeType.CLASS,
      className,
      {
        filePath,
        ...metadata
      },
      allLabels,
      source
    );
  }

  /**
   * Create a function node
   */
  createFunctionNode(
    functionName: string,
    filePath: string,
    metadata: Partial<NodeMetadata> = {},
    labels?: string[],
    source?: SourceMetadata
  ): Node {
    // Default labels for function nodes
    const defaultLabels = new Set(['CodeElement', 'Callable']);
    const allLabels = labels 
      ? new Set([...defaultLabels, ...labels])
      : defaultLabels;

    return new Node(
      this.generateId('func'),
      NodeType.FUNCTION,
      functionName,
      {
        filePath,
        ...metadata
      },
      allLabels,
      source
    );
  }

  /**
   * Generate unique node ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${this.nodeCounter++}-${Date.now()}`;
  }

  /**
   * Reset counter (useful for testing)
   */
  reset(): void {
    this.nodeCounter = 0;
  }
}
