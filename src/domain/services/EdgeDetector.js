/**
 * EdgeDetector - Detects edges/relationships between nodes
 */
import { Edge } from '../entities/Edge.js';
import { EdgeType } from '../value-objects/EdgeType.js';
export class EdgeDetector {
    edgeCounter = 0;
    /**
     * Create a dependency edge
     */
    createDependencyEdge(fromNodeId, toNodeId) {
        return new Edge(this.generateId('edge'), EdgeType.DEPENDS_ON, fromNodeId, toNodeId);
    }
    /**
     * Create an import edge
     */
    createImportEdge(fromNodeId, toNodeId) {
        return new Edge(this.generateId('edge'), EdgeType.IMPORTS, fromNodeId, toNodeId);
    }
    /**
     * Create a contains edge
     */
    createContainsEdge(parentNodeId, childNodeId) {
        return new Edge(this.generateId('edge'), EdgeType.CONTAINS, parentNodeId, childNodeId);
    }
    /**
     * Create a calls edge
     */
    createCallsEdge(callerNodeId, calleeNodeId) {
        return new Edge(this.generateId('edge'), EdgeType.CALLS, callerNodeId, calleeNodeId);
    }
    /**
     * Detect edges from source code
     * Stub: Returns empty array
     */
    detectEdges(sourceCode, nodeId) {
        // Stub: Would analyze code and detect relationships
        return [];
    }
    /**
     * Generate unique edge ID
     */
    generateId(prefix) {
        return `${prefix}-${this.edgeCounter++}-${Date.now()}`;
    }
    /**
     * Reset counter (useful for testing)
     */
    reset() {
        this.edgeCounter = 0;
    }
}
//# sourceMappingURL=EdgeDetector.js.map