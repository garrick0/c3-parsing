import { describe, it, expect } from 'vitest';
import { TypeScriptParser } from '../../src/infrastructure/adapters/TypeScriptParser.js';
import { PythonParser } from '../../src/infrastructure/adapters/PythonParser.js';
import { createTestFileInfo } from '../test-utils/helpers.js';

describe('Backward Compatibility', () => {
  describe('Stub Parsers', () => {
    it('should still have TypeScriptParser stub working', async () => {
      const parser = new TypeScriptParser();
      const fileInfo = createTestFileInfo('test.ts');
      const source = 'export class Test {}';

      const result = await parser.parse(source, fileInfo);

      expect(result).toBeDefined();
      expect(result.nodes).toBeInstanceOf(Array);
      expect(result.edges).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();

      // Verify stub behavior (returns mock data)
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].type).toBe('class');
      expect(result.nodes[0].name).toBe('MockClass');
    });

    it('should still have PythonParser stub working', async () => {
      const parser = new PythonParser();
      const fileInfo = createTestFileInfo('test.py', '.py');
      const source = 'class Test: pass';

      const result = await parser.parse(source, fileInfo);

      expect(result).toBeDefined();
      expect(result.nodes).toBeInstanceOf(Array);
      expect(result.edges).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();

      // Verify stub behavior (returns mock data)
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('class');
      expect(result.nodes[0].name).toBe('MockPythonClass');
    });

    it('should support file with supports method', () => {
      const tsParser = new TypeScriptParser();
      const pyParser = new PythonParser();

      const tsFile = createTestFileInfo('test.ts', '.ts');
      const pyFile = createTestFileInfo('test.py', '.py');
      const jsFile = createTestFileInfo('test.js', '.js');

      expect(tsParser.supports(tsFile)).toBe(true);
      expect(tsParser.supports(pyFile)).toBe(false);
      expect(tsParser.supports(jsFile)).toBe(true);

      expect(pyParser.supports(pyFile)).toBe(true);
      expect(pyParser.supports(tsFile)).toBe(false);
    });

    it('should return parser name', () => {
      const tsParser = new TypeScriptParser();
      const pyParser = new PythonParser();

      expect(tsParser.getName()).toBe('TypeScriptParser');
      expect(pyParser.getName()).toBe('PythonParser');
    });

    it('should return supported extensions', () => {
      const tsParser = new TypeScriptParser();
      const pyParser = new PythonParser();

      const tsExtensions = tsParser.getSupportedExtensions();
      expect(tsExtensions).toContain('.ts');
      expect(tsExtensions).toContain('.tsx');
      expect(tsExtensions).toContain('.js');
      expect(tsExtensions).toContain('.jsx');

      const pyExtensions = pyParser.getSupportedExtensions();
      expect(pyExtensions).toContain('.py');
    });
  });
});