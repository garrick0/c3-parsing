/**
 * NodeFactory - Creates graph nodes
 */
import { Node, NodeMetadata } from '../entities/Node.js';
export declare class NodeFactory {
    private nodeCounter;
    /**
     * Create a file node
     */
    createFileNode(filePath: string, metadata?: Partial<NodeMetadata>): Node;
    /**
     * Create a directory node
     */
    createDirectoryNode(dirPath: string, metadata?: Partial<NodeMetadata>): Node;
    /**
     * Create a class node
     */
    createClassNode(className: string, filePath: string, metadata?: Partial<NodeMetadata>): Node;
    /**
     * Create a function node
     */
    createFunctionNode(functionName: string, filePath: string, metadata?: Partial<NodeMetadata>): Node;
    /**
     * Generate unique node ID
     */
    private generateId;
    /**
     * Reset counter (useful for testing)
     */
    reset(): void;
}
//# sourceMappingURL=NodeFactory.d.ts.map