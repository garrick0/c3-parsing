/**
 * GraphBuilder - Constructs property graphs from parsed data
 */
import { PropertyGraph, GraphMetadata } from '../entities/PropertyGraph.js';
import { Node } from '../entities/Node.js';
import { Edge } from '../entities/Edge.js';
export declare class GraphBuilder {
    private graph?;
    /**
     * Start building a new graph
     */
    start(metadata: GraphMetadata): GraphBuilder;
    /**
     * Add node to graph
     */
    addNode(node: Node): GraphBuilder;
    /**
     * Add edge to graph
     */
    addEdge(edge: Edge): GraphBuilder;
    /**
     * Build and return the graph
     */
    build(): PropertyGraph;
    /**
     * Get current node count
     */
    getNodeCount(): number;
    /**
     * Get current edge count
     */
    getEdgeCount(): number;
}
//# sourceMappingURL=GraphBuilder.d.ts.map