/**
 * GraphBuilder - Constructs property graphs from parsed data
 */

import { PropertyGraph, GraphMetadata } from '../entities/PropertyGraph.js';
import { Node } from '../entities/Node.js';
import { Edge } from '../entities/Edge.js';

export class GraphBuilder {
  private graph?: PropertyGraph;

  /**
   * Start building a new graph
   */
  start(metadata: GraphMetadata): GraphBuilder {
    this.graph = new PropertyGraph(`graph-${Date.now()}`, metadata);
    return this;
  }

  /**
   * Add node to graph
   */
  addNode(node: Node): GraphBuilder {
    if (!this.graph) {
      throw new Error('Graph not initialized. Call start() first.');
    }
    this.graph.addNode(node);
    return this;
  }

  /**
   * Add edge to graph
   */
  addEdge(edge: Edge): GraphBuilder {
    if (!this.graph) {
      throw new Error('Graph not initialized. Call start() first.');
    }
    this.graph.addEdge(edge);
    return this;
  }

  /**
   * Build and return the graph
   */
  build(): PropertyGraph {
    if (!this.graph) {
      throw new Error('Graph not initialized. Call start() first.');
    }

    const result = this.graph;
    this.graph = undefined; // Reset for next build
    return result;
  }

  /**
   * Get current node count
   */
  getNodeCount(): number {
    return this.graph?.getNodeCount() ?? 0;
  }

  /**
   * Get current edge count
   */
  getEdgeCount(): number {
    return this.graph?.getEdgeCount() ?? 0;
  }
}
