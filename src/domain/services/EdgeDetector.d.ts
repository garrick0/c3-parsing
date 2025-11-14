/**
 * EdgeDetector - Detects edges/relationships between nodes
 */
import { Edge } from '../entities/Edge.js';
export declare class EdgeDetector {
    private edgeCounter;
    /**
     * Create a dependency edge
     */
    createDependencyEdge(fromNodeId: string, toNodeId: string): Edge;
    /**
     * Create an import edge
     */
    createImportEdge(fromNodeId: string, toNodeId: string): Edge;
    /**
     * Create a contains edge
     */
    createContainsEdge(parentNodeId: string, childNodeId: string): Edge;
    /**
     * Create a calls edge
     */
    createCallsEdge(callerNodeId: string, calleeNodeId: string): Edge;
    /**
     * Detect edges from source code
     * Stub: Returns empty array
     */
    detectEdges(sourceCode: string, nodeId: string): Edge[];
    /**
     * Generate unique edge ID
     */
    private generateId;
    /**
     * Reset counter (useful for testing)
     */
    reset(): void;
}
//# sourceMappingURL=EdgeDetector.d.ts.map