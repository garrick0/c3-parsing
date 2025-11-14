/**
 * PropertyGraph - Core representation of codebase as nodes and edges
 */
import { Entity } from 'c3-shared';
import { Node } from './Node.js';
import { Edge } from './Edge.js';
export interface GraphMetadata {
    codebaseId: string;
    parsedAt: Date;
    language: string;
    version: string;
}
export declare class PropertyGraph extends Entity<string> {
    readonly metadata: GraphMetadata;
    private nodes;
    private edges;
    constructor(id: string, metadata: GraphMetadata);
    /**
     * Add a node to the graph
     */
    addNode(node: Node): void;
    /**
     * Add an edge to the graph
     */
    addEdge(edge: Edge): void;
    /**
     * Get node by ID
     */
    getNode(id: string): Node | undefined;
    /**
     * Get all nodes
     */
    getNodes(): Node[];
    /**
     * Get all edges
     */
    getEdges(): Edge[];
    /**
     * Find edges from a node
     */
    getEdgesFrom(nodeId: string): Edge[];
    /**
     * Find edges to a node
     */
    getEdgesTo(nodeId: string): Edge[];
    /**
     * Get node count
     */
    getNodeCount(): number;
    /**
     * Get edge count
     */
    getEdgeCount(): number;
    /**
     * Check if graph has cycles
     * Stub: Returns false
     */
    hasCycles(): boolean;
    /**
     * Get graph statistics
     */
    getStats(): {
        nodes: number;
        edges: number;
        avgDegree: number;
    };
}
//# sourceMappingURL=PropertyGraph.d.ts.map