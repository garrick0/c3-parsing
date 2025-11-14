/**
 * NodeFileSystem - Node.js file system adapter
 */
import { FileSystem } from '../../domain/ports/FileSystem.js';
import { FileInfo } from '../../domain/entities/FileInfo.js';
export declare class NodeFileSystem implements FileSystem {
    readFile(path: string): Promise<string>;
    exists(path: string): Promise<boolean>;
    listFiles(dirPath: string, recursive?: boolean): Promise<FileInfo[]>;
    getFileInfo(path: string): Promise<FileInfo>;
    isDirectory(path: string): Promise<boolean>;
    getSize(path: string): Promise<number>;
}
//# sourceMappingURL=NodeFileSystem.d.ts.map