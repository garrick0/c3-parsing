/**
 * FileSystem - Interface for file system operations
 */
import { FileInfo } from '../entities/FileInfo.js';
export interface FileSystem {
    /**
     * Read file contents
     */
    readFile(path: string): Promise<string>;
    /**
     * Check if file exists
     */
    exists(path: string): Promise<boolean>;
    /**
     * List files in directory
     */
    listFiles(dirPath: string, recursive?: boolean): Promise<FileInfo[]>;
    /**
     * Get file metadata
     */
    getFileInfo(path: string): Promise<FileInfo>;
    /**
     * Check if path is directory
     */
    isDirectory(path: string): Promise<boolean>;
    /**
     * Get file size
     */
    getSize(path: string): Promise<number>;
}
//# sourceMappingURL=FileSystem.d.ts.map