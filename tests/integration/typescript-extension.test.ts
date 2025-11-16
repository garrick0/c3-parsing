/**
 * TypeScriptExtension Integration Tests
 * 
 * Tests TypeScript parsing as a GraphExtension (v2.0.0)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TypeScriptExtension } from '../../src/infrastructure/extensions/typescript/TypeScriptExtension.js';
import { ExtensionContext } from '../../src/domain/ports/GraphExtension.js';
import { NodeType } from '../../src/domain/value-objects/NodeType.js';
import { EdgeType } from '../../src/domain/value-objects/EdgeType.js';
import { createLogger } from '@garrick0/c3-shared';
import { join } from 'path';

describe('TypeScriptExtension', () => {
  let extension: TypeScriptExtension;
  let logger: any;
  
  beforeAll(() => {
    logger = createLogger('TypeScriptExtensionTest');
    extension = new TypeScriptExtension({
      tsconfigRootDir: process.cwd(),
      includePrivateMembers: false
    });
  });
  
  afterAll(async () => {
    await extension.dispose();
  });
  
  describe('Metadata', () => {
    it('should have correct extension metadata', () => {
      expect(extension.name).toBe('typescript');
      expect(extension.version).toBe('2.0.0');
      expect(extension.domain).toBe('code');
    });
    
    it('should define node types', () => {
      expect(extension.nodeTypes.length).toBeGreaterThan(0);
      
      const classType = extension.nodeTypes.find(t => t.type === 'class');
      expect(classType).toBeDefined();
      expect(classType?.labels).toContain('CodeElement');
      expect(classType?.labels).toContain('Type');
    });
    
    it('should define edge types', () => {
      expect(extension.edgeTypes.length).toBeGreaterThan(0);
      
      const importsType = extension.edgeTypes.find(t => t.type === 'imports');
      expect(importsType).toBeDefined();
    });
  });
  
  describe('Parse', () => {
    it('should parse TypeScript files', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures', 'typescript'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      
      // Should have nodes
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Should have edges
      expect(result.edges.length).toBeGreaterThan(0);
      
      // Check for code node types
      const fileNodes = result.nodes.filter(n => n.type === NodeType.FILE);
      const classNodes = result.nodes.filter(n => n.type === NodeType.CLASS);
      
      expect(fileNodes.length).toBeGreaterThan(0);
      expect(classNodes.length).toBeGreaterThan(0);
    });
    
    it('should set source metadata on all nodes', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures', 'typescript'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      
      for (const node of result.nodes) {
        expect(node.source).toBeDefined();
        expect(node.source?.domain).toBe('code');
        expect(node.source?.extension).toBe('typescript');
        expect(node.source?.version).toBe('2.0.0');
      }
    });
    
    it('should set labels on nodes', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures', 'typescript'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      
      const classNode = result.nodes.find(n => n.type === NodeType.CLASS);
      expect(classNode).toBeDefined();
      expect(classNode!.hasLabel('CodeElement')).toBe(true);
      expect(classNode!.hasLabel('Type')).toBe(true);
      
      const functionNode = result.nodes.find(n => n.type === NodeType.FUNCTION);
      if (functionNode) {
        expect(functionNode.hasLabel('CodeElement')).toBe(true);
        expect(functionNode.hasLabel('Callable')).toBe(true);
      }
    });
    
    it('should parse classes', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures', 'typescript'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      const classNodes = result.nodes.filter(n => n.type === NodeType.CLASS);
      
      expect(classNodes.length).toBeGreaterThan(0);
      
      const classNode = classNodes[0];
      expect(classNode.name).toBeDefined();
      expect(classNode.metadata.filePath).toBeDefined();
    });
    
    it('should parse functions', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures', 'typescript'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      const functionNodes = result.nodes.filter(n => n.type === NodeType.FUNCTION);
      
      expect(functionNodes.length).toBeGreaterThan(0);
    });
    
    it('should detect imports', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures', 'typescript'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      const importEdges = result.edges.filter(e => e.type === EdgeType.IMPORTS);
      
      expect(importEdges.length).toBeGreaterThan(0);
    });
    
    it('should detect containment relationships', async () => {
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures', 'typescript'),
        logger,
        config: {}
      };
      
      const result = await extension.parse(context);
      const containsEdges = result.edges.filter(e => e.type === EdgeType.CONTAINS);
      
      expect(containsEdges.length).toBeGreaterThan(0);
    });
    
    it('should respect exclude patterns', async () => {
      const extensionWithExcludes = new TypeScriptExtension({
        tsconfigRootDir: process.cwd(),
        excludePatterns: ['**/node_modules/**', '**/test*.ts']
      });
      
      const context: ExtensionContext = {
        rootPath: join(process.cwd(), 'tests', 'fixtures'),
        logger,
        config: {}
      };
      
      const result = await extensionWithExcludes.parse(context);
      
      // Should not include test files
      const testFiles = result.nodes.filter(n => 
        n.type === NodeType.FILE && n.name.includes('test')
      );
      
      expect(testFiles).toHaveLength(0);
      
      await extensionWithExcludes.dispose();
    });
  });
  
  describe('Link', () => {
    it('should return empty array (no cross-linking yet)', async () => {
      const edges = await extension.link({
        allNodes: new Map(),
        query: {
          findByType: () => [],
          findByLabel: () => [],
          findByDomain: () => [],
          find: () => [],
          findOne: () => undefined
        },
        logger
      });
      
      expect(edges).toEqual([]);
    });
  });
  
  describe('Dispose', () => {
    it('should dispose resources cleanly', async () => {
      const ext = new TypeScriptExtension();
      
      // Should not throw
      await expect(ext.dispose()).resolves.not.toThrow();
    });
  });
});

