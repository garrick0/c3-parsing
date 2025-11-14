/**
 * FilesystemParser - Basic filesystem structure parser
 */
export class FilesystemParser {
    async parse(source, fileInfo) {
        // Stub: Return mock parse result
        return {
            nodes: [
                { id: 'file-1', type: 'file', name: fileInfo.getFileName(), metadata: {} }
            ],
            edges: [],
            metadata: {}
        };
    }
    supports(fileInfo) {
        // Supports all files for basic filesystem parsing
        return true;
    }
    getName() {
        return 'FilesystemParser';
    }
    getSupportedExtensions() {
        return ['*'];
    }
}
//# sourceMappingURL=FilesystemParser.js.map