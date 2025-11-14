/**
 * NodeFactory - Creates graph nodes
 */

import { Node, NodeMetadata } from '../entities/Node.js';
import { NodeType } from '../value-objects/NodeType.js';

export class NodeFactory {
  private nodeCounter = 0;

  /**
   * Create a file node
   */
  createFileNode(filePath: string, metadata: Partial<NodeMetadata> = {}): Node {
    const fileName = filePath.split('/').pop() || filePath;

    return new Node(
      this.generateId('file'),
      NodeType.FILE,
      fileName,
      {
        filePath,
        ...metadata
      }
    );
  }

  /**
   * Create a directory node
   */
  createDirectoryNode(dirPath: string, metadata: Partial<NodeMetadata> = {}): Node {
    const dirName = dirPath.split('/').pop() || dirPath;

    return new Node(
      this.generateId('dir'),
      NodeType.DIRECTORY,
      dirName,
      {
        filePath: dirPath,
        ...metadata
      }
    );
  }

  /**
   * Create a class node
   */
  createClassNode(
    className: string,
    filePath: string,
    metadata: Partial<NodeMetadata> = {}
  ): Node {
    return new Node(
      this.generateId('class'),
      NodeType.CLASS,
      className,
      {
        filePath,
        ...metadata
      }
    );
  }

  /**
   * Create a function node
   */
  createFunctionNode(
    functionName: string,
    filePath: string,
    metadata: Partial<NodeMetadata> = {}
  ): Node {
    return new Node(
      this.generateId('func'),
      NodeType.FUNCTION,
      functionName,
      {
        filePath,
        ...metadata
      }
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
