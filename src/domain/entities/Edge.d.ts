/**
 * Edge - Represents a relationship between nodes
 */
import { Entity } from 'c3-shared';
import { EdgeType } from '../value-objects/EdgeType.js';
export interface EdgeMetadata {
    weight?: number;
    [key: string]: any;
}
export declare class Edge extends Entity<string> {
    readonly type: EdgeType;
    readonly fromNodeId: string;
    readonly toNodeId: string;
    readonly metadata: EdgeMetadata;
    constructor(id: string, type: EdgeType, fromNodeId: string, toNodeId: string, metadata?: EdgeMetadata);
    /**
     * Get edge weight
     */
    getWeight(): number;
    /**
     * Check if edge represents a dependency
     */
    isDependency(): boolean;
    /**
     * Check if edge represents an import
     */
    isImport(): boolean;
    /**
     * Check if edge represents containment
     */
    isContains(): boolean;
    /**
     * Check if edge represents a call
     */
    isCalls(): boolean;
    /**
     * Get display label
     */
    getDisplayLabel(): string;
}
//# sourceMappingURL=Edge.d.ts.map