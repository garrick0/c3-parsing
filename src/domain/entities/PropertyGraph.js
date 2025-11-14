/**
 * PropertyGraph - Core representation of codebase as nodes and edges
 */
import { Entity } from '@c3/shared';
export class PropertyGraph extends Entity {
    metadata;
    nodes = new Map();
    edges = [];
    constructor(id, metadata) {
        super(id);
        this.metadata = metadata;
    }
    /**
     * Add a node to the graph
     */
    addNode(node) {
        this.nodes.set(node.id, node);
    }
    /**
     * Add an edge to the graph
     */
    addEdge(edge) {
        this.edges.push(edge);
    }
    /**
     * Get node by ID
     */
    getNode(id) {
        return this.nodes.get(id);
    }
    /**
     * Get all nodes
     */
    getNodes() {
        return Array.from(this.nodes.values());
    }
    /**
     * Get all edges
     */
    getEdges() {
        return [...this.edges];
    }
    /**
     * Find edges from a node
     */
    getEdgesFrom(nodeId) {
        return this.edges.filter(e => e.fromNodeId === nodeId);
    }
    /**
     * Find edges to a node
     */
    getEdgesTo(nodeId) {
        return this.edges.filter(e => e.toNodeId === nodeId);
    }
    /**
     * Get node count
     */
    getNodeCount() {
        return this.nodes.size;
    }
    /**
     * Get edge count
     */
    getEdgeCount() {
        return this.edges.length;
    }
    /**
     * Check if graph has cycles
     * Stub: Returns false
     */
    hasCycles() {
        // Stub: Would implement cycle detection algorithm
        return false;
    }
    /**
     * Get graph statistics
     */
    getStats() {
        const nodeCount = this.getNodeCount();
        const edgeCount = this.getEdgeCount();
        return {
            nodes: nodeCount,
            edges: edgeCount,
            avgDegree: nodeCount > 0 ? edgeCount / nodeCount : 0
        };
    }
}
//# sourceMappingURL=PropertyGraph.js.map