/**
 * FilesystemExtension Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FilesystemExtension } from '../../src/infrastructure/extensions/FilesystemExtension.js';
import { ExtensionContext, GraphQueryImpl } from '../../src/domain/ports/GraphExtension.js';
import { NodeType } from '../../src/domain/value-objects/NodeType.js';
import { EdgeType } from '../../src/domain/value-objects/EdgeType.js';
import { createLogger } from 'c3-shared';
import { join } from 'path';

describe('FilesystemExtension', () => {
  let extension: FilesystemExtension;
  let logger: any;
  
  beforeEach(() => {
    logger = createLogger('FilesystemExtensionTest');
    extension = new FilesystemExtension({
      includeHidden: false,
      maxDepth: 3,
      ignorePatterns: ['node_modules', '.git', 'dist']
    });
  });
  
  describe('Metadata', () => {
    it('should have correct extension metadata', () => {
      expect(extension.name).toBe('filesystem');
      expect(extension.version).toBe('1.0.0');
      expect(extension.domain).toBe('filesystem');
    });
    
    it('should define node types', () => {
      expect(extension.nodeTypes).toHaveLength(3);
      
      const fileType = extension.nodeTypes.find(t => t.type === 'fs_file');
      expect(fileType).toBeDefined();
      expect(fileType?.labels).toContain('FilesystemObject');
      expect(fileType?.labels).toContain('File');
      
      const dirType = extension.nodeTypes.find(t => t.type === 'fs_directory');
      expect(dirType).toBeDefined();
      expect(dirType?.labels).toContain('Directory');
    });
    
    it('should define edge types', () => {
      expect(extension.edgeTypes).toHaveLength(1);
      expect(extension.edgeTypes[0].type).toBe('parent_of');
    });
  });
  
  describe('Parse', () => {
    it('should parse filesystem tree', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      
      // Should have nodes
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Should have edges (parent relationships)
      expect(result.edges.length).toBeGreaterThan(0);
      
      // Check node types
      const fileNodes = result.nodes.filter(n => n.type === NodeType.FS_FILE);
      const dirNodes = result.nodes.filter(n => n.type === NodeType.FS_DIRECTORY);
      
      expect(fileNodes.length).toBeGreaterThan(0);
      expect(dirNodes.length).toBeGreaterThan(0);
    });
    
    it('should set correct metadata on nodes', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      const fileNode = result.nodes.find(n => n.type === NodeType.FS_FILE);
      
      expect(fileNode).toBeDefined();
      expect(fileNode!.metadata.path).toBeDefined();
      expect(fileNode!.metadata.size).toBeGreaterThanOrEqual(0);
      expect(fileNode!.metadata.modified).toBeInstanceOf(Date);
      expect(fileNode!.metadata.created).toBeInstanceOf(Date);
    });
    
    it('should set source metadata on all nodes', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      
      for (const node of result.nodes) {
        expect(node.source).toBeDefined();
        expect(node.source?.domain).toBe('filesystem');
        expect(node.source?.extension).toBe('filesystem');
        expect(node.source?.version).toBe('1.0.0');
      }
    });
    
    it('should set labels on nodes', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      
      const fileNode = result.nodes.find(n => n.type === NodeType.FS_FILE);
      expect(fileNode).toBeDefined();
      expect(fileNode!.hasLabel('FilesystemObject')).toBe(true);
      expect(fileNode!.hasLabel('File')).toBe(true);
      
      const dirNode = result.nodes.find(n => n.type === NodeType.FS_DIRECTORY);
      expect(dirNode).toBeDefined();
      expect(dirNode!.hasLabel('FilesystemObject')).toBe(true);
      expect(dirNode!.hasLabel('Directory')).toBe(true);
    });
    
    it('should create parent edges', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      
      const parentEdges = result.edges.filter(e => e.type === EdgeType.PARENT_OF);
      expect(parentEdges.length).toBeGreaterThan(0);
      
      // Check edge has source metadata
      const edge = parentEdges[0];
      expect(edge.source).toBeDefined();
      expect(edge.source?.domain).toBe('filesystem');
    });
    
    it('should respect maxDepth config', async () => {
      const shallowExtension = new FilesystemExtension({
        maxDepth: 1,
        ignorePatterns: ['node_modules', '.git']
      });
      
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests'),
        logger,
        config: {}
      };
      
      const result = await shallowExtension.parse(context);
      
      // Should only get fixtures/ directory and files directly in tests/
      // Not files nested deeper
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.nodes.length).toBeLessThan(20); // Would be more if full depth
    });
    
    it('should ignore hidden files when configured', async () => {
      const noHiddenExtension = new FilesystemExtension({
        includeHidden: false
      });
      
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures'),
        logger,
        config: {}
      };
      
      const result = await noHiddenExtension.parse(context);
      
      // Should not include any files starting with .
      const hiddenFiles = result.nodes.filter(n => n.name.startsWith('.'));
      expect(hiddenFiles).toHaveLength(0);
    });
    
    it('should ignore patterns', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd()),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      
      // Should not include node_modules, .git, or dist
      const ignored = result.nodes.filter(n => 
        n.metadata.relativePath?.includes('node_modules') ||
        n.metadata.relativePath?.includes('.git') ||
        n.metadata.relativePath?.includes('dist')
      );
      
      expect(ignored).toHaveLength(0);
    });
  });
  
  describe('Link', () => {
    it('should return empty array (no cross-linking needed)', async () => {
      const nodes = new Map();
      const query = new GraphQueryImpl(nodes);
      
      const edges = await extension.link({
        allNodes: nodes,
        query,
        logger
      });
      
      expect(edges).toEqual([]);
    });
  });
  
  describe('Integration with ParsingService', () => {
    it('should work with parseCodebase', async () => {
      // This is tested in the main integration tests
      // Just verify the extension is correctly structured
      expect(extension.parse).toBeDefined();
      expect(extension.link).toBeDefined();
      expect(typeof extension.parse).toBe('function');
      expect(typeof extension.link).toBe('function');
    });
  });
});

