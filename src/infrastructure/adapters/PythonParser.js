/**
 * PythonParser - Python AST parser
 */
export class PythonParser {
    async parse(source, fileInfo) {
        // Stub: Would use Python AST parser
        return {
            nodes: [
                { id: 'class-1', type: 'class', name: 'MockPythonClass', metadata: {} }
            ],
            edges: [],
            metadata: { language: 'python' }
        };
    }
    supports(fileInfo) {
        return fileInfo.extension === '.py';
    }
    getName() {
        return 'PythonParser';
    }
    getSupportedExtensions() {
        return ['.py'];
    }
}
//# sourceMappingURL=PythonParser.js.map