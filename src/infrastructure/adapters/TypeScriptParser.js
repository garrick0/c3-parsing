/**
 * TypeScriptParser - TypeScript/JavaScript AST parser
 */
export class TypeScriptParser {
    async parse(source, fileInfo) {
        // Stub: Would use TypeScript compiler API
        return {
            nodes: [
                { id: 'class-1', type: 'class', name: 'MockClass', metadata: {} },
                { id: 'func-1', type: 'function', name: 'mockFunction', metadata: {} }
            ],
            edges: [
                { id: 'edge-1', type: 'contains', from: 'file-1', to: 'class-1' }
            ],
            metadata: { language: 'typescript' }
        };
    }
    supports(fileInfo) {
        const ext = fileInfo.extension;
        return ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx';
    }
    getName() {
        return 'TypeScriptParser';
    }
    getSupportedExtensions() {
        return ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
    }
}
//# sourceMappingURL=TypeScriptParser.js.map