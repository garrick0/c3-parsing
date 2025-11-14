/**
 * NodeFactory - Creates graph nodes
 */
import { Node } from '../entities/Node.js';
import { NodeType } from '../value-objects/NodeType.js';
export class NodeFactory {
    nodeCounter = 0;
    /**
     * Create a file node
     */
    createFileNode(filePath, metadata = {}) {
        const fileName = filePath.split('/').pop() || filePath;
        return new Node(this.generateId('file'), NodeType.FILE, fileName, {
            filePath,
            ...metadata
        });
    }
    /**
     * Create a directory node
     */
    createDirectoryNode(dirPath, metadata = {}) {
        const dirName = dirPath.split('/').pop() || dirPath;
        return new Node(this.generateId('dir'), NodeType.DIRECTORY, dirName, {
            filePath: dirPath,
            ...metadata
        });
    }
    /**
     * Create a class node
     */
    createClassNode(className, filePath, metadata = {}) {
        return new Node(this.generateId('class'), NodeType.CLASS, className, {
            filePath,
            ...metadata
        });
    }
    /**
     * Create a function node
     */
    createFunctionNode(functionName, filePath, metadata = {}) {
        return new Node(this.generateId('func'), NodeType.FUNCTION, functionName, {
            filePath,
            ...metadata
        });
    }
    /**
     * Generate unique node ID
     */
    generateId(prefix) {
        return `${prefix}-${this.nodeCounter++}-${Date.now()}`;
    }
    /**
     * Reset counter (useful for testing)
     */
    reset() {
        this.nodeCounter = 0;
    }
}
//# sourceMappingURL=NodeFactory.js.map