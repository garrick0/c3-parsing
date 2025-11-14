/**
 * Node - Represents a code element in the property graph
 */
import { Entity } from 'c3-shared';
import { NodeType } from '../value-objects/NodeType.js';
export interface NodeMetadata {
    filePath: string;
    startLine?: number;
    endLine?: number;
    size?: number;
    [key: string]: any;
}
export declare class Node extends Entity<string> {
    readonly type: NodeType;
    readonly name: string;
    readonly metadata: NodeMetadata;
    constructor(id: string, type: NodeType, name: string, metadata: NodeMetadata);
    /**
     * Get file path
     */
    getFilePath(): string;
    /**
     * Get line range
     */
    getLineRange(): {
        start?: number;
        end?: number;
    };
    /**
     * Check if node represents a file
     */
    isFile(): boolean;
    /**
     * Check if node represents a directory
     */
    isDirectory(): boolean;
    /**
     * Check if node represents a module
     */
    isModule(): boolean;
    /**
     * Check if node represents a class
     */
    isClass(): boolean;
    /**
     * Check if node represents a function
     */
    isFunction(): boolean;
    /**
     * Get display name
     */
    getDisplayName(): string;
}
//# sourceMappingURL=Node.d.ts.map