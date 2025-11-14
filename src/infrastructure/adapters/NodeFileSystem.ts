/**
 * NodeFileSystem - Node.js file system adapter
 */

import { FileSystem } from '../../domain/ports/FileSystem.js';
import { FileInfo } from '../../domain/entities/FileInfo.js';
import { Language, detectLanguage } from '../../domain/value-objects/Language.js';

export class NodeFileSystem implements FileSystem {
  async readFile(path: string): Promise<string> {
    // Stub: Would use fs.promises.readFile
    return `// Mock file content for ${path}`;
  }

  async exists(path: string): Promise<boolean> {
    // Stub: Always returns true
    return true;
  }

  async listFiles(dirPath: string, recursive: boolean = false): Promise<FileInfo[]> {
    // Stub: Return mock file list
    return [
      new FileInfo(
        'file-1',
        `${dirPath}/index.ts`,
        '.ts',
        1024,
        Language.TYPESCRIPT,
        new Date()
      )
    ];
  }

  async getFileInfo(path: string): Promise<FileInfo> {
    // Stub: Return mock file info
    const ext = '.' + path.split('.').pop();
    return new FileInfo(
      `file-${Date.now()}`,
      path,
      ext,
      1024,
      detectLanguage(ext),
      new Date()
    );
  }

  async isDirectory(path: string): Promise<boolean> {
    // Stub: Check if path ends with common dir indicators
    return !path.includes('.');
  }

  async getSize(path: string): Promise<number> {
    // Stub: Return mock size
    return 1024;
  }
}
