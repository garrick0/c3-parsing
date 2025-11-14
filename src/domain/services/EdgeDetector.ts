/**
 * EdgeDetector - Detects edges/relationships between nodes
 */

import { Edge } from '../entities/Edge.js';
import { EdgeType } from '../value-objects/EdgeType.js';

export class EdgeDetector {
  private edgeCounter = 0;

  /**
   * Create a dependency edge
   */
  createDependencyEdge(fromNodeId: string, toNodeId: string): Edge {
    return new Edge(
      this.generateId('edge'),
      EdgeType.DEPENDS_ON,
      fromNodeId,
      toNodeId
    );
  }

  /**
   * Create an import edge
   */
  createImportEdge(fromNodeId: string, toNodeId: string): Edge {
    return new Edge(
      this.generateId('edge'),
      EdgeType.IMPORTS,
      fromNodeId,
      toNodeId
    );
  }

  /**
   * Create a contains edge
   */
  createContainsEdge(parentNodeId: string, childNodeId: string): Edge {
    return new Edge(
      this.generateId('edge'),
      EdgeType.CONTAINS,
      parentNodeId,
      childNodeId
    );
  }

  /**
   * Create a calls edge
   */
  createCallsEdge(callerNodeId: string, calleeNodeId: string): Edge {
    return new Edge(
      this.generateId('edge'),
      EdgeType.CALLS,
      callerNodeId,
      calleeNodeId
    );
  }

  /**
   * Detect edges from source code
   * Stub: Returns empty array
   */
  detectEdges(sourceCode: string, nodeId: string): Edge[] {
    // Stub: Would analyze code and detect relationships
    return [];
  }

  /**
   * Generate unique edge ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${this.edgeCounter++}-${Date.now()}`;
  }

  /**
   * Reset counter (useful for testing)
   */
  reset(): void {
    this.edgeCounter = 0;
  }
}
