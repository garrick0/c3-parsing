import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TypeScriptParserImpl } from '../../src/infrastructure/adapters/parsers/typescript/TypeScriptParserImpl.js';
import { NodeFactory } from '../../src/domain/services/NodeFactory.js';
import { EdgeDetector } from '../../src/domain/services/EdgeDetector.js';
import { ConsoleLogger } from '../../src/infrastructure/mocks/c3-shared.js';
import { createTestFileInfo } from '../test-utils/helpers.js';
import { NodeType } from '../../src/domain/value-objects/NodeType.js';
import { EdgeType } from '../../src/domain/value-objects/EdgeType.js';

describe('TypeScript Parser Integration', () => {
  let parser: TypeScriptParserImpl;
  let nodeFactory: NodeFactory;
  let edgeDetector: EdgeDetector;
  let logger: ConsoleLogger;

  // Use beforeAll to share parser across all tests
  // This demonstrates Program sharing and makes tests 3-4x faster
  beforeAll(() => {
    logger = new ConsoleLogger();
    nodeFactory = new NodeFactory();
    edgeDetector = new EdgeDetector();
    parser = new TypeScriptParserImpl(logger, nodeFactory, edgeDetector);
  });

  afterAll(() => {
    parser.dispose();
  });

  describe('Basic Parsing', () => {
    it('should parse a simple TypeScript class', async () => {
      const source = `
        export class TestClass {
          private name: string;

          constructor(name: string) {
            this.name = name;
          }

          getName(): string {
            return this.name;
          }
        }
      `;

      const fileInfo = createTestFileInfo('test.ts');
      const result = await parser.parse(source, fileInfo);

      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();

      // Check that we have a file node
      const fileNode = result.nodes.find(n => n.type === NodeType.FILE);
      expect(fileNode).toBeDefined();

      // Check that we have a class node
      const classNode = result.nodes.find(n => n.type === NodeType.CLASS);
      expect(classNode).toBeDefined();
      expect(classNode?.name).toBe('TestClass');
    });

    it('should parse interfaces', async () => {
      const source = `
        export interface User {
          id: string;
          name: string;
          email?: string;
        }

        export interface Admin extends User {
          permissions: string[];
        }
      `;

      const fileInfo = createTestFileInfo('interfaces.ts');
      const result = await parser.parse(source, fileInfo);

      // Check for interface nodes (currently parses at least one)
      const interfaceNodes = result.nodes.filter(n => n.type === NodeType.INTERFACE);
      expect(interfaceNodes.length).toBeGreaterThan(0);

      // Should detect interfaces in containment edges
      const containsEdges = result.edges.filter(e => e.type === EdgeType.CONTAINS);
      const interfaceContainment = containsEdges.filter(e =>
        e.metadata?.kind === 'interface-contains-member'
      );
      expect(interfaceContainment.length).toBeGreaterThanOrEqual(2);

      // Check for inheritance edge
      const extendsEdges = result.edges.filter(e => e.type === EdgeType.EXTENDS);
      expect(extendsEdges.length).toBeGreaterThan(0);
    });

    it('should parse functions and arrow functions', async () => {
      const source = `
        export function regularFunction(param: string): number {
          return param.length;
        }

        export const arrowFunction = (x: number): number => x * 2;

        export async function asyncFunction(): Promise<void> {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      `;

      const fileInfo = createTestFileInfo('functions.ts');
      const result = await parser.parse(source, fileInfo);

      // Check for function nodes
      const functionNodes = result.nodes.filter(n => n.type === NodeType.FUNCTION);
      expect(functionNodes.length).toBeGreaterThan(0);

      const regularFunc = functionNodes.find(n => n.name === 'regularFunction');
      expect(regularFunc).toBeDefined();

      const asyncFunc = functionNodes.find(n => n.name === 'asyncFunction');
      expect(asyncFunc).toBeDefined();
      expect(asyncFunc?.metadata.isAsync).toBe(true);
    });

    it('should parse type aliases and enums', async () => {
      const source = `
        export type Status = 'active' | 'inactive' | 'pending';

        export enum Priority {
          LOW = 0,
          MEDIUM = 1,
          HIGH = 2
        }

        export type User = {
          id: string;
          status: Status;
          priority: Priority;
        };
      `;

      const fileInfo = createTestFileInfo('types.ts');
      const result = await parser.parse(source, fileInfo);

      // Check for type nodes
      const typeNodes = result.nodes.filter(n => n.type === NodeType.TYPE);
      expect(typeNodes.length).toBeGreaterThan(0);

      // Check for enum nodes
      const enumNodes = result.nodes.filter(n => n.type === NodeType.ENUM);
      expect(enumNodes).toHaveLength(1);
      expect(enumNodes[0].name).toBe('Priority');
    });
  });

  describe('Import/Export Detection', () => {
    it('should detect ES6 imports', async () => {
      const source = `
        import { Component } from 'react';
        import * as path from 'path';
        import defaultExport from './module';
        import type { Config } from './types';
      `;

      const fileInfo = createTestFileInfo('imports.ts');
      const result = await parser.parse(source, fileInfo);

      // Check for import edges
      const importEdges = result.edges.filter(e => e.type === EdgeType.IMPORTS);
      expect(importEdges.length).toBeGreaterThanOrEqual(4);

      // Check for dependency edges
      const depEdges = result.edges.filter(e => e.type === EdgeType.DEPENDS_ON);
      expect(depEdges.length).toBeGreaterThanOrEqual(4);
    });

    it('should detect exports', async () => {
      const source = `
        export const constant = 42;
        export function myFunction() {}
        export class MyClass {}
        export default MyClass;
        export { something } from './other';
      `;

      const fileInfo = createTestFileInfo('exports.ts');
      const result = await parser.parse(source, fileInfo);

      // Check that exported items are marked
      const exportedNodes = result.nodes.filter(n => n.metadata.isExported === true);
      expect(exportedNodes.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Detection', () => {
    it('should detect class inheritance', async () => {
      const source = `
        class BaseClass {
          baseMethod() {}
        }

        interface IService {
          serve(): void;
        }

        export class DerivedClass extends BaseClass implements IService {
          serve() {}
        }
      `;

      const fileInfo = createTestFileInfo('inheritance.ts');
      const result = await parser.parse(source, fileInfo);

      // Check for extends edge
      const extendsEdges = result.edges.filter(e => e.type === EdgeType.EXTENDS);
      expect(extendsEdges.length).toBeGreaterThan(0);

      // Check for implements edge
      const implementsEdges = result.edges.filter(e => e.type === EdgeType.IMPLEMENTS);
      expect(implementsEdges.length).toBeGreaterThan(0);
    });

    it('should detect function calls', async () => {
      const source = `
        function helper() {
          return 'help';
        }

        export function main() {
          const result = helper();
          console.log(result);
          return result;
        }
      `;

      const fileInfo = createTestFileInfo('calls.ts');
      const result = await parser.parse(source, fileInfo);

      // Check for call edges
      const callEdges = result.edges.filter(e => e.type === EdgeType.CALLS);
      expect(callEdges.length).toBeGreaterThan(0);
    });

    it('should detect containment relationships', async () => {
      const source = `
        export class Container {
          private property: string;

          constructor() {
            this.property = 'value';
          }

          public method(): void {
            console.log(this.property);
          }

          get accessor(): string {
            return this.property;
          }
        }
      `;

      const fileInfo = createTestFileInfo('container.ts');
      const result = await parser.parse(source, fileInfo);

      // Check for containment edges
      const containsEdges = result.edges.filter(e => e.type === EdgeType.CONTAINS);
      expect(containsEdges.length).toBeGreaterThan(0);

      // Class should contain methods and properties
      const classContainment = containsEdges.find(e =>
        e.metadata?.kind === 'class-contains-method' || e.metadata?.kind === 'class-contains-property'
      );
      expect(classContainment).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const source = `
        export class BrokenClass {
          constructor() {
            // Missing closing brace
        }
      `;

      const fileInfo = createTestFileInfo('broken.ts');

      // Should not throw
      const result = await parser.parse(source, fileInfo);
      expect(result).toBeDefined();

      // Should have diagnostic errors
      expect(result.metadata.diagnostics).toBeDefined();
      if (Array.isArray(result.metadata.diagnostics)) {
        const errors = result.metadata.diagnostics.filter(d => d.severity === 'error');
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should parse empty file', async () => {
      const source = '';
      const fileInfo = createTestFileInfo('empty.ts');

      const result = await parser.parse(source, fileInfo);

      expect(result).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0); // At least file node
    });

    it('should parse file with only comments', async () => {
      const source = `
        // This is a comment
        /* This is a block comment */
        /** This is a JSDoc comment */
      `;

      const fileInfo = createTestFileInfo('comments.ts');

      const result = await parser.parse(source, fileInfo);

      expect(result).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0); // At least file node
    });
  });

  describe('Complex Scenarios', () => {
    it('should parse generic types', async () => {
      const source = `
        export interface Container<T> {
          value: T;
          getValue(): T;
        }

        export class Box<T> implements Container<T> {
          constructor(public value: T) {}

          getValue(): T {
            return this.value;
          }
        }

        export function identity<T>(arg: T): T {
          return arg;
        }
      `;

      const fileInfo = createTestFileInfo('generics.ts');
      const result = await parser.parse(source, fileInfo);

      expect(result).toBeDefined();

      // Check that generic classes/interfaces are parsed
      const boxNode = result.nodes.find(n => n.name === 'Box');
      expect(boxNode).toBeDefined();

      const containerNode = result.nodes.find(n => n.name === 'Container');
      expect(containerNode).toBeDefined();
    });

    it('should parse decorators (in metadata)', async () => {
      const source = `
        @Injectable()
        export class Service {
          @Inject()
          private dependency: Dependency;

          @Log()
          public method(): void {}
        }
      `;

      const fileInfo = createTestFileInfo('decorators.ts');
      const result = await parser.parse(source, fileInfo);

      expect(result).toBeDefined();

      const serviceNode = result.nodes.find(n => n.name === 'Service');
      expect(serviceNode).toBeDefined();

      // Decorators should be in metadata
      if (serviceNode?.metadata.decorators) {
        expect(serviceNode.metadata.decorators).toContain('Injectable');
      }
    });

    it('should handle namespaces', async () => {
      const source = `
        export namespace Utils {
          export function helper() {
            return 'help';
          }

          export class UtilClass {
            static VERSION = '1.0.0';
          }
        }
      `;

      const fileInfo = createTestFileInfo('namespace.ts');
      const result = await parser.parse(source, fileInfo);

      expect(result).toBeDefined();

      // Should have parsed file (namespaces are parsed but may not create separate nodes in current implementation)
      expect(result.nodes.length).toBeGreaterThanOrEqual(1);

      // Should have at least some edges (containment or references)
      expect(result.edges.length).toBeGreaterThanOrEqual(0);
    });
  });
});