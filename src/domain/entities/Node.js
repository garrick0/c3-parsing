/**
 * Node - Represents a code element in the property graph
 */
import { Entity } from '@c3/shared';
import { NodeType } from '../value-objects/NodeType.js';
export class Node extends Entity {
    type;
    name;
    metadata;
    constructor(id, type, name, metadata) {
        super(id);
        this.type = type;
        this.name = name;
        this.metadata = metadata;
    }
    /**
     * Get file path
     */
    getFilePath() {
        return this.metadata.filePath;
    }
    /**
     * Get line range
     */
    getLineRange() {
        return {
            start: this.metadata.startLine,
            end: this.metadata.endLine
        };
    }
    /**
     * Check if node represents a file
     */
    isFile() {
        return this.type === NodeType.FILE;
    }
    /**
     * Check if node represents a directory
     */
    isDirectory() {
        return this.type === NodeType.DIRECTORY;
    }
    /**
     * Check if node represents a module
     */
    isModule() {
        return this.type === NodeType.MODULE;
    }
    /**
     * Check if node represents a class
     */
    isClass() {
        return this.type === NodeType.CLASS;
    }
    /**
     * Check if node represents a function
     */
    isFunction() {
        return this.type === NodeType.FUNCTION;
    }
    /**
     * Get display name
     */
    getDisplayName() {
        return `${this.type}:${this.name}`;
    }
}
//# sourceMappingURL=Node.js.map