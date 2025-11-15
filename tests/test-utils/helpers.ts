/**
 * Test helpers and utilities
 */

import { FileInfo } from '../../src/domain/entities/FileInfo.js';
import { Language } from '../../src/domain/value-objects/Language.js';
import { Parser, ParseResult } from '../../src/domain/ports/Parser.js';
import { UnifiedAST } from '../../src/domain/entities/ast/UnifiedAST.js';
import { ASTNode, ASTNodeKind } from '../../src/domain/entities/ast/ASTNode.js';
import { createSourceLocation } from '../../src/domain/entities/ast/SourceLocation.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Create a test FileInfo object
 */
export function createTestFileInfo(
  path: string,
  extension?: string,
  language?: Language
): FileInfo {
  return new FileInfo(
    `file-test-${Date.now()}`,
    path,
    extension || '.ts',
    1024, // 1KB default size
    language || Language.TypeScript,
    new Date()
  );
}

/**
 * Read a test fixture file
 */
export async function readFixture(fixtureName: string): Promise<string> {
  const fixturePath = join(process.cwd(), 'tests', 'fixtures', fixtureName);
  return readFile(fixturePath, 'utf-8');
}

/**
 * Parse a test file with a given parser
 */
export async function parseTestFile(
  parser: Parser,
  fixtureName: string
): Promise<ParseResult> {
  const source = await readFixture(fixtureName);
  const fileInfo = createTestFileInfo(fixtureName);
  return parser.parse(source, fileInfo);
}

/**
 * Create a simple AST node for testing
 */
export function createTestASTNode(
  kind: ASTNodeKind,
  name: string,
  file: string = 'test.ts'
): ASTNode {
  return {
    id: `test-node-${Date.now()}`,
    kind,
    text: name,
    children: [],
    location: createSourceLocation(file, 1, 0, 1, 10),
    metadata: { name }
  };
}

/**
 * Create a simple unified AST for testing
 */
export function createTestUnifiedAST(
  rootKind: ASTNodeKind = ASTNodeKind.SOURCE_FILE
): UnifiedAST {
  const root = createTestASTNode(rootKind, 'test-root');

  return {
    root,
    language: Language.TypeScript,
    sourceFile: 'test.ts',
    version: '1.0.0',
    diagnostics: [],
    symbols: new Map(),
    imports: [],
    exports: []
  };
}

/**
 * Assert that a ParseResult has expected structure
 */
export function assertParseResultStructure(result: ParseResult): void {
  expect(result).toBeDefined();
  expect(result.nodes).toBeInstanceOf(Array);
  expect(result.edges).toBeInstanceOf(Array);
  expect(result.metadata).toBeInstanceOf(Object);
}

/**
 * Assert that an AST node has expected properties
 */
export function assertASTNode(
  node: ASTNode,
  expectedKind: ASTNodeKind,
  expectedName?: string
): void {
  expect(node).toBeDefined();
  expect(node.id).toBeTruthy();
  expect(node.kind).toBe(expectedKind);

  if (expectedName) {
    expect(node.metadata.name || node.text).toBe(expectedName);
  }

  expect(node.location).toBeDefined();
  expect(node.children).toBeInstanceOf(Array);
}

/**
 * Count nodes of a specific kind in an AST
 */
export function countNodesOfKind(
  root: ASTNode,
  kind: ASTNodeKind
): number {
  let count = 0;

  function traverse(node: ASTNode): void {
    if (node.kind === kind) {
      count++;
    }
    node.children.forEach(traverse);
  }

  traverse(root);
  return count;
}

/**
 * Find all nodes with a specific name
 */
export function findNodesByName(
  root: ASTNode,
  name: string
): ASTNode[] {
  const results: ASTNode[] = [];

  function traverse(node: ASTNode): void {
    if (node.metadata.name === name || node.text === name) {
      results.push(node);
    }
    node.children.forEach(traverse);
  }

  traverse(root);
  return results;
}

/**
 * Create a mock logger for testing
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that a function throws an error
 */
export async function assertThrows(
  fn: () => Promise<any>,
  errorMessage?: string
): Promise<void> {
  let error: Error | null = null;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  expect(error).toBeTruthy();

  if (errorMessage) {
    expect(error?.message).toContain(errorMessage);
  }
}

/**
 * Compare two parse results for equality (ignoring IDs and timestamps)
 */
export function compareParseResults(
  result1: ParseResult,
  result2: ParseResult
): boolean {
  // Compare node counts
  if (result1.nodes.length !== result2.nodes.length) {
    return false;
  }

  // Compare edge counts
  if (result1.edges.length !== result2.edges.length) {
    return false;
  }

  // Compare node types and names (ignoring IDs)
  const nodes1 = result1.nodes.map(n => ({ type: n.type, name: n.name }));
  const nodes2 = result2.nodes.map(n => ({ type: n.type, name: n.name }));

  nodes1.sort((a, b) => `${a.type}-${a.name}`.localeCompare(`${b.type}-${b.name}`));
  nodes2.sort((a, b) => `${a.type}-${a.name}`.localeCompare(`${b.type}-${b.name}`));

  return JSON.stringify(nodes1) === JSON.stringify(nodes2);
}

/**
 * Generate test source code
 */
export function generateTestSource(type: 'class' | 'function' | 'interface' = 'class'): string {
  switch (type) {
    case 'class':
      return `
        export class TestClass {
          constructor(private name: string) {}

          getName(): string {
            return this.name;
          }
        }
      `;

    case 'function':
      return `
        export function testFunction(param: string): number {
          return param.length;
        }

        export const arrowFunction = (x: number) => x * 2;
      `;

    case 'interface':
      return `
        export interface TestInterface {
          id: string;
          name: string;
          optional?: number;
        }

        export type TestType = string | number;
      `;

    default:
      return '';
  }
}