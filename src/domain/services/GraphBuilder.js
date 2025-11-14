/**
 * GraphBuilder - Constructs property graphs from parsed data
 */
import { PropertyGraph } from '../entities/PropertyGraph.js';
export class GraphBuilder {
    graph;
    /**
     * Start building a new graph
     */
    start(metadata) {
        this.graph = new PropertyGraph(`graph-${Date.now()}`, metadata);
        return this;
    }
    /**
     * Add node to graph
     */
    addNode(node) {
        if (!this.graph) {
            throw new Error('Graph not initialized. Call start() first.');
        }
        this.graph.addNode(node);
        return this;
    }
    /**
     * Add edge to graph
     */
    addEdge(edge) {
        if (!this.graph) {
            throw new Error('Graph not initialized. Call start() first.');
        }
        this.graph.addEdge(edge);
        return this;
    }
    /**
     * Build and return the graph
     */
    build() {
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
    getNodeCount() {
        return this.graph?.getNodeCount() ?? 0;
    }
    /**
     * Get current edge count
     */
    getEdgeCount() {
        return this.graph?.getEdgeCount() ?? 0;
    }
}
//# sourceMappingURL=GraphBuilder.js.map