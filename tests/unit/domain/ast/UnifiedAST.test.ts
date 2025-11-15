import { describe, it, expect } from 'vitest';
import {
  createUnifiedAST,
  addDiagnostic,
  registerSymbol,
  addImport,
  addExport,
  getSymbolsByKind,
  hasErrors,
  getErrors,
  countNodes,
  UnifiedAST,
  SymbolKind,
  Diagnostic
} from '../../../../src/domain/entities/ast/UnifiedAST.js';
import { createTestASTNode } from '../../../test-utils/helpers.js';
import { ASTNodeKind } from '../../../../src/domain/entities/ast/ASTNode.js';
import { Language } from '../../../../src/domain/value-objects/Language.js';

describe('UnifiedAST', () => {
  describe('createUnifiedAST', () => {
    it('should create a unified AST with default values', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      expect(ast).toBeDefined();
      expect(ast.root).toBe(root);
      expect(ast.language).toBe(Language.TypeScript);
      expect(ast.sourceFile).toBe('test.ts');
      expect(ast.version).toBe('1.0.0');
      expect(ast.diagnostics).toEqual([]);
      expect(ast.symbols.size).toBe(0);
      expect(ast.imports).toEqual([]);
      expect(ast.exports).toEqual([]);
    });
  });

  describe('diagnostics', () => {
    it('should add diagnostics to the AST', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      const diagnostic: Diagnostic = {
        severity: 'error',
        message: 'Syntax error',
        code: 'TS1234',
        location: {
          file: 'test.ts',
          line: 10,
          column: 5
        }
      };

      addDiagnostic(ast, diagnostic);

      expect(ast.diagnostics).toHaveLength(1);
      expect(ast.diagnostics[0]).toEqual(diagnostic);
    });

    it('should detect if AST has errors', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      expect(hasErrors(ast)).toBe(false);

      addDiagnostic(ast, {
        severity: 'warning',
        message: 'Warning message'
      });

      expect(hasErrors(ast)).toBe(false);

      addDiagnostic(ast, {
        severity: 'error',
        message: 'Error message'
      });

      expect(hasErrors(ast)).toBe(true);
    });

    it('should get only error diagnostics', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      addDiagnostic(ast, { severity: 'info', message: 'Info' });
      addDiagnostic(ast, { severity: 'warning', message: 'Warning' });
      addDiagnostic(ast, { severity: 'error', message: 'Error 1' });
      addDiagnostic(ast, { severity: 'error', message: 'Error 2' });

      const errors = getErrors(ast);

      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('Error 1');
      expect(errors[1].message).toBe('Error 2');
    });
  });

  describe('symbols', () => {
    it('should register symbols in the AST', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      const classSymbol = {
        id: 'sym-1',
        name: 'TestClass',
        kind: SymbolKind.CLASS,
        nodeId: 'node-1',
        visibility: 'public' as const,
        isExported: true
      };

      registerSymbol(ast, classSymbol);

      expect(ast.symbols.size).toBe(1);
      expect(ast.symbols.get('TestClass')).toEqual(classSymbol);
    });

    it('should get symbols by kind', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      registerSymbol(ast, {
        id: 'sym-1',
        name: 'Class1',
        kind: SymbolKind.CLASS,
        nodeId: 'node-1'
      });

      registerSymbol(ast, {
        id: 'sym-2',
        name: 'func1',
        kind: SymbolKind.FUNCTION,
        nodeId: 'node-2'
      });

      registerSymbol(ast, {
        id: 'sym-3',
        name: 'Class2',
        kind: SymbolKind.CLASS,
        nodeId: 'node-3'
      });

      const classes = getSymbolsByKind(ast, SymbolKind.CLASS);
      const functions = getSymbolsByKind(ast, SymbolKind.FUNCTION);

      expect(classes).toHaveLength(2);
      expect(classes[0].name).toBe('Class1');
      expect(classes[1].name).toBe('Class2');

      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('func1');
    });
  });

  describe('imports and exports', () => {
    it('should add import information', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      const importInfo = {
        source: './module',
        specifiers: [
          { imported: 'Component', local: 'MyComponent' },
          { imported: 'default', isDefault: true }
        ],
        isTypeOnly: false
      };

      addImport(ast, importInfo);

      expect(ast.imports).toHaveLength(1);
      expect(ast.imports[0]).toEqual(importInfo);
    });

    it('should add export information', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      const exportInfo = {
        name: 'MyClass',
        isDefault: false,
        isTypeOnly: false
      };

      addExport(ast, exportInfo);

      expect(ast.exports).toHaveLength(1);
      expect(ast.exports[0]).toEqual(exportInfo);
    });

    it('should handle re-exports', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      const reExport = {
        name: 'Component',
        localName: 'MyComponent',
        source: './other-module',
        isDefault: false,
        isTypeOnly: false
      };

      addExport(ast, reExport);

      expect(ast.exports).toHaveLength(1);
      expect(ast.exports[0].source).toBe('./other-module');
    });
  });

  describe('node counting', () => {
    it('should count all nodes in the AST', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');

      // Add some child nodes
      const class1 = createTestASTNode(ASTNodeKind.CLASS_DECLARATION, 'Class1');
      const method1 = createTestASTNode(ASTNodeKind.METHOD, 'method1');
      const method2 = createTestASTNode(ASTNodeKind.METHOD, 'method2');

      class1.children.push(method1, method2);
      root.children.push(class1);

      const func1 = createTestASTNode(ASTNodeKind.FUNCTION_DECLARATION, 'func1');
      root.children.push(func1);

      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      const count = countNodes(ast);

      expect(count).toBe(5); // root + class1 + method1 + method2 + func1
    });

    it('should handle empty AST', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'test.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'test.ts');

      const count = countNodes(ast);

      expect(count).toBe(1); // just the root
    });
  });

  describe('complex AST operations', () => {
    it('should handle a complete AST with all features', () => {
      const root = createTestASTNode(ASTNodeKind.SOURCE_FILE, 'complex.ts');
      const ast = createUnifiedAST(root, Language.TypeScript, 'complex.ts');

      // Add various elements
      addDiagnostic(ast, {
        severity: 'warning',
        message: 'Unused variable'
      });

      registerSymbol(ast, {
        id: 'sym-1',
        name: 'MainClass',
        kind: SymbolKind.CLASS,
        nodeId: 'node-1',
        isExported: true
      });

      addImport(ast, {
        source: 'react',
        specifiers: [
          { imported: 'default', local: 'React', isDefault: true },
          { imported: 'useState' }
        ]
      });

      addExport(ast, {
        name: 'MainClass',
        isDefault: true
      });

      // Verify everything is properly stored
      expect(ast.diagnostics).toHaveLength(1);
      expect(ast.symbols.size).toBe(1);
      expect(ast.imports).toHaveLength(1);
      expect(ast.exports).toHaveLength(1);
      expect(hasErrors(ast)).toBe(false);
    });
  });
});