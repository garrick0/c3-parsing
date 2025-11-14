/**
 * FileInfo - Metadata about a file in the codebase
 */
import { Entity } from '@c3/shared';
export class FileInfo extends Entity {
    path;
    extension;
    size;
    language;
    lastModified;
    constructor(id, path, extension, size, language, lastModified) {
        super(id);
        this.path = path;
        this.extension = extension;
        this.size = size;
        this.language = language;
        this.lastModified = lastModified;
    }
    /**
     * Get file name
     */
    getFileName() {
        return this.path.split('/').pop() || '';
    }
    /**
     * Get directory path
     */
    getDirectory() {
        const parts = this.path.split('/');
        parts.pop();
        return parts.join('/');
    }
    /**
     * Check if file should be analyzed
     */
    shouldAnalyze() {
        const excludePatterns = ['node_modules', 'dist', 'coverage', '.git'];
        return !excludePatterns.some(pattern => this.path.includes(pattern));
    }
    /**
     * Get relative path from base
     */
    getRelativePath(base) {
        return this.path.replace(base, '').replace(/^\//, '');
    }
    /**
     * Check if file is too large
     */
    isTooLarge(maxSize = 1024 * 1024) {
        return this.size > maxSize;
    }
}
//# sourceMappingURL=FileInfo.js.map