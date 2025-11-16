/**
 * FilesystemExtension - Adds filesystem metadata to the property graph
 * 
 * This extension walks the filesystem tree and creates nodes for files and directories,
 * capturing metadata like size, permissions, and modification times.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  GraphExtension,
  NodeTypeDefinition,
  EdgeTypeDefinition,
  ExtensionContext,
  LinkContext,
  ExtensionResult
} from '../../../domain/ports/GraphExtension.js';
import { Node, type SourceMetadata } from '../../../domain/entities/Node.js';
import { Edge } from '../../../domain/entities/Edge.js';
import { NodeType } from '../../../domain/value-objects/NodeType.js';
import { EdgeType } from '../../../domain/value-objects/EdgeType.js';

export interface FilesystemExtensionConfig {
  includeHidden?: boolean;
  maxDepth?: number;
  ignorePatterns?: string[];
  followSymlinks?: boolean;
}

interface FileEntry {
  path: string;
  relativePath: string;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  modified: Date;
  created: Date;
  permissions: number;
  parentPath?: string;
}

/**
 * FilesystemExtension - First extension implementation
 */
export class FilesystemExtension implements GraphExtension {
  readonly name = 'filesystem';
  readonly version = '1.0.0';
  readonly domain = 'filesystem';
  
  readonly nodeTypes: NodeTypeDefinition[] = [
    {
      type: 'fs_file',
      displayName: 'File',
      labels: ['FilesystemObject', 'File']
    },
    {
      type: 'fs_directory',
      displayName: 'Directory',
      labels: ['FilesystemObject', 'Directory']
    },
    {
      type: 'fs_symlink',
      displayName: 'Symbolic Link',
      labels: ['FilesystemObject', 'Symlink']
    }
  ];
  
  readonly edgeTypes: EdgeTypeDefinition[] = [
    {
      type: 'parent_of',
      displayName: 'Parent Of'
    }
  ];
  
  private sourceMetadata: SourceMetadata;
  
  constructor(private config: FilesystemExtensionConfig = {}) {
    this.sourceMetadata = {
      domain: this.domain,
      extension: this.name,
      version: this.version,
      timestamp: new Date()
    };
  }
  
  async parse(context: ExtensionContext): Promise<ExtensionResult> {
    context.logger.info('Parsing filesystem', {
      rootPath: context.rootPath,
      includeHidden: this.config.includeHidden ?? false,
      maxDepth: this.config.maxDepth ?? 10
    });
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    try {
      // Walk directory tree
      const entries = await this.walkDirectory(
        context.rootPath,
        context.rootPath,
        0,
        context.logger
      );
      
      context.logger.debug(`Found ${entries.length} filesystem entries`);
      
      // Create nodes for each entry
      for (const entry of entries) {
        const node = this.createNodeFromEntry(entry);
        nodes.push(node);
        
        // Create parent edge if applicable
        if (entry.parentPath) {
          const parentId = this.getNodeId(entry.parentPath);
          const childId = this.getNodeId(entry.path);
          
          edges.push(new Edge(
            `edge-parent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            EdgeType.PARENT_OF,
            parentId,
            childId,
            {},
            this.sourceMetadata
          ));
        }
      }
      
      context.logger.info('Filesystem parsing complete', {
        nodes: nodes.length,
        edges: edges.length
      });
      
      return { nodes, edges };
      
    } catch (error) {
      context.logger.error('Failed to parse filesystem', error as Error);
      throw error;
    }
  }
  
  async link(context: LinkContext): Promise<Edge[]> {
    // Filesystem doesn't need cross-extension linking for now
    // Could link fs_file -> file (code) nodes in the future
    context.logger.debug('Filesystem extension: no cross-linking needed');
    return [];
  }
  
  /**
   * Walk directory tree recursively
   */
  private async walkDirectory(
    dirPath: string,
    rootPath: string,
    depth: number,
    logger: any
  ): Promise<FileEntry[]> {
    const entries: FileEntry[] = [];
    const maxDepth = this.config.maxDepth ?? 10;
    
    if (depth > maxDepth) {
      logger.warn(`Max depth ${maxDepth} reached at ${dirPath}`);
      return entries;
    }
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const relativePath = path.relative(rootPath, itemPath);
        
        // Skip hidden files if configured
        if (!this.config.includeHidden && item.name.startsWith('.')) {
          continue;
        }
        
        // Skip ignored patterns
        if (this.shouldIgnore(relativePath)) {
          continue;
        }
        
        try {
          const stats = await fs.lstat(itemPath);
          
          const entry: FileEntry = {
            path: itemPath,
            relativePath,
            isDirectory: item.isDirectory(),
            isSymlink: item.isSymbolicLink(),
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
            permissions: stats.mode,
            parentPath: dirPath === rootPath ? undefined : dirPath
          };
          
          entries.push(entry);
          
          // Recurse into directories
          if (item.isDirectory()) {
            const subEntries = await this.walkDirectory(
              itemPath,
              rootPath,
              depth + 1,
              logger
            );
            entries.push(...subEntries);
          }
          
          // Follow symlinks if configured
          if (item.isSymbolicLink() && this.config.followSymlinks) {
            const realPath = await fs.realpath(itemPath);
            const realStats = await fs.stat(realPath);
            
            if (realStats.isDirectory()) {
              const subEntries = await this.walkDirectory(
                realPath,
                rootPath,
                depth + 1,
                logger
              );
              entries.push(...subEntries);
            }
          }
          
        } catch (error: any) {
          // Skip files we can't access
          logger.warn(`Failed to stat ${itemPath}: ${error.message}`);
        }
      }
      
    } catch (error: any) {
      logger.error(`Failed to read directory ${dirPath}: ${error.message}`);
    }
    
    return entries;
  }
  
  /**
   * Check if path should be ignored
   */
  private shouldIgnore(relativePath: string): boolean {
    if (!this.config.ignorePatterns) {
      return false;
    }
    
    for (const pattern of this.config.ignorePatterns) {
      // Simple pattern matching (could use minimatch for better patterns)
      if (relativePath.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Create node from file entry
   */
  private createNodeFromEntry(entry: FileEntry): Node {
    let nodeType: NodeType;
    const labels = new Set(['FilesystemObject']);
    
    if (entry.isSymlink) {
      nodeType = NodeType.FS_SYMLINK;
      labels.add('Symlink');
    } else if (entry.isDirectory) {
      nodeType = NodeType.FS_DIRECTORY;
      labels.add('Directory');
    } else {
      nodeType = NodeType.FS_FILE;
      labels.add('File');
    }
    
    return new Node(
      this.getNodeId(entry.path),
      nodeType,
      path.basename(entry.path),
      {
        filePath: entry.path,
        relativePath: entry.relativePath,
        path: entry.path,
        size: entry.size,
        modified: entry.modified,
        created: entry.created,
        permissions: entry.permissions,
        isDirectory: entry.isDirectory,
        isSymlink: entry.isSymlink
      },
      labels,
      this.sourceMetadata
    );
  }
  
  /**
   * Generate consistent node ID from path
   */
  private getNodeId(filePath: string): string {
    // Use consistent ID format for easy lookup
    return `fs-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }
}

