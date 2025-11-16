/**
 * PropertyGraph - Core representation of codebase as nodes and edges
 */

import { Entity } from '@garrick0/c3-shared';
import { Node } from './Node.js';
import { Edge } from './Edge.js';

export interface GraphMetadata {
  codebaseId: string;
  parsedAt: Date;
  language: string;
  version: string;
}

export class PropertyGraph extends Entity<string> {
  private nodes: Map<string, Node> = new Map();
  private edges: Edge[] = [];

  constructor(
    id: string,
    public readonly metadata: GraphMetadata
  ) {
    super(id);
  }

  /**
   * Add a node to the graph
   */
  addNode(node: Node): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge: Edge): void {
    this.edges.push(edge);
  }

  /**
   * Get node by ID
   */
  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes
   */
  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges
   */
  getEdges(): Edge[] {
    return [...this.edges];
  }

  /**
   * Find edges from a node
   */
  getEdgesFrom(nodeId: string): Edge[] {
    return this.edges.filter(e => e.fromNodeId === nodeId);
  }

  /**
   * Find edges to a node
   */
  getEdgesTo(nodeId: string): Edge[] {
    return this.edges.filter(e => e.toNodeId === nodeId);
  }

  /**
   * Get node count
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Get edge count
   */
  getEdgeCount(): number {
    return this.edges.length;
  }

  /**
   * Check if graph has cycles
   * Stub: Returns false
   */
  hasCycles(): boolean {
    // Stub: Would implement cycle detection algorithm
    return false;
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    nodes: number;
    edges: number;
    avgDegree: number;
  } {
    const nodeCount = this.getNodeCount();
    const edgeCount = this.getEdgeCount();

    return {
      nodes: nodeCount,
      edges: edgeCount,
      avgDegree: nodeCount > 0 ? edgeCount / nodeCount : 0
    };
  }

  /**
   * Get nodes by label
   */
  getNodesByLabel(label: string): Node[] {
    return this.getNodes().filter(node => node.hasLabel(label));
  }

  /**
   * Get nodes matching any of the given labels
   */
  getNodesByAnyLabel(labels: string[]): Node[] {
    return this.getNodes().filter(node => node.hasAnyLabel(labels));
  }

  /**
   * Get nodes matching all of the given labels
   */
  getNodesByAllLabels(labels: string[]): Node[] {
    return this.getNodes().filter(node => node.hasAllLabels(labels));
  }

  /**
   * Get nodes by source domain
   */
  getNodesByDomain(domain: string): Node[] {
    return this.getNodes().filter(node => node.isFromDomain(domain));
  }

  /**
   * Get edges by source domain
   */
  getEdgesByDomain(domain: string): Edge[] {
    return this.edges.filter(edge => edge.isFromDomain(domain));
  }

  /**
   * Get all unique labels in the graph
   */
  getAllLabels(): string[] {
    const labels = new Set<string>();
    for (const node of this.getNodes()) {
      for (const label of node.getLabels()) {
        labels.add(label);
      }
    }
    return Array.from(labels);
  }

  /**
   * Get all unique domains in the graph
   */
  getAllDomains(): string[] {
    const domains = new Set<string>();
    for (const node of this.getNodes()) {
      const domain = node.getSourceDomain();
      if (domain) {
        domains.add(domain);
      }
    }
    return Array.from(domains);
  }
}
