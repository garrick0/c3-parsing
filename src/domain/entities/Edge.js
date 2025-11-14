/**
 * Edge - Represents a relationship between nodes
 */
import { Entity } from '@c3/shared';
import { EdgeType } from '../value-objects/EdgeType.js';
export class Edge extends Entity {
    type;
    fromNodeId;
    toNodeId;
    metadata;
    constructor(id, type, fromNodeId, toNodeId, metadata = {}) {
        super(id);
        this.type = type;
        this.fromNodeId = fromNodeId;
        this.toNodeId = toNodeId;
        this.metadata = metadata;
    }
    /**
     * Get edge weight
     */
    getWeight() {
        return this.metadata.weight ?? 1;
    }
    /**
     * Check if edge represents a dependency
     */
    isDependency() {
        return this.type === EdgeType.DEPENDS_ON;
    }
    /**
     * Check if edge represents an import
     */
    isImport() {
        return this.type === EdgeType.IMPORTS;
    }
    /**
     * Check if edge represents containment
     */
    isContains() {
        return this.type === EdgeType.CONTAINS;
    }
    /**
     * Check if edge represents a call
     */
    isCalls() {
        return this.type === EdgeType.CALLS;
    }
    /**
     * Get display label
     */
    getDisplayLabel() {
        return this.type;
    }
}
//# sourceMappingURL=Edge.js.map