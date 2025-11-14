/**
 * NodeFileSystem - Node.js file system adapter
 */
import { FileInfo } from '../../domain/entities/FileInfo.js';
import { Language, detectLanguage } from '../../domain/value-objects/Language.js';
export class NodeFileSystem {
    async readFile(path) {
        // Stub: Would use fs.promises.readFile
        return `// Mock file content for ${path}`;
    }
    async exists(path) {
        // Stub: Always returns true
        return true;
    }
    async listFiles(dirPath, recursive = false) {
        // Stub: Return mock file list
        return [
            new FileInfo('file-1', `${dirPath}/index.ts`, '.ts', 1024, Language.TYPESCRIPT, new Date())
        ];
    }
    async getFileInfo(path) {
        // Stub: Return mock file info
        const ext = '.' + path.split('.').pop();
        return new FileInfo(`file-${Date.now()}`, path, ext, 1024, detectLanguage(ext), new Date());
    }
    async isDirectory(path) {
        // Stub: Check if path ends with common dir indicators
        return !path.includes('.');
    }
    async getSize(path) {
        // Stub: Return mock size
        return 1024;
    }
}
//# sourceMappingURL=NodeFileSystem.js.map