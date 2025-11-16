/**
 * ESTreeTransformer - Converts TypeScript AST to ESTree format
 * 
 * Based on typescript-eslint's architecture:
 * https://github.com/typescript-eslint/typescript-eslint
 * 
 * This transformer uses the shared ts.Program from Project Service
 * and converts it to ESTree while maintaining full type information.
 */

import { parseAndGenerateServices } from '@typescript-eslint/typescript-estree';
import type { TSESTree, ParserServices } from '@typescript-eslint/typescript-estree';
import * as ts from 'typescript';
import { ESTreeAST, ImportInfo, ExportInfo, Diagnostic } from '../../../../domain/entities/ast/ESTreeAST.js';
import { FileInfo } from '../../../../domain/entities/FileInfo.js';
import { Language } from '../../../../domain/value-objects/Language.js';
import { Logger } from 'c3-shared';

export interface ESTreeTransformerOptions {
  includeComments?: boolean;
  includeTokens?: boolean;
}

/**
 * Transforms TypeScript SourceFile to ESTree AST
 * 
 * Key insight: We REUSE the existing ts.Program from Project Service,
 * but let typescript-estree handle the AST conversion.
 */
export class ESTreeTransformer {
  constructor(
    private logger: Logger,
    private options: ESTreeTransformerOptions = {}
  ) {}

  /**
   * Transform TypeScript SourceFile to ESTree AST
   * 
   * This is the EXACT approach used by typescript-eslint v8:
   * 1. Get source code text from our cached SourceFile
   * 2. Use parseAndGenerateServices with our existing Program
   * 3. Get back ESTree AST + ParserServices (which has node maps!)
   * 
   * @param sourceFile - Native TypeScript SourceFile (from Project Service!)
   * @param program - TypeScript Program (provides TypeChecker)
   * @param fileInfo - File metadata
   */
  async transform(
    sourceFile: ts.SourceFile,
    program: ts.Program,
    fileInfo: FileInfo
  ): Promise<ESTreeAST> {
    this.logger.debug(`Converting ${fileInfo.path} to ESTree format`);
    
    const startTransform = performance.now();
    const diagnostics: any[] = [];

    try {
      // CRITICAL: This is the typescript-eslint approach!
      // We pass our EXISTING program to avoid re-parsing
      const result = parseAndGenerateServices(
        sourceFile.getFullText(), // Source text from our cached SourceFile
        {
          // File options
          filePath: fileInfo.path,
          
          // CRITICAL: Reuse our cached Program from Project Service!
          // This is the key to maintaining our 26x performance gain.
          programs: [program],
          
          // Preserve node maps for bidirectional mapping
          // This gives us estreeNode → tsNode mapping
          preserveNodeMaps: true,
          
          // Include helpful metadata
          loc: true,                    // Line/column locations
          range: true,                  // Character ranges
          tokens: this.options.includeTokens ?? false,
          comment: this.options.includeComments ?? false,
          
          // TypeScript-specific options
          jsx: false,                   // We don't handle JSX
          
          // Error handling - allow syntax errors
          errorOnUnknownASTType: false,  // Don't fail on unknown nodes
          errorOnTypeScriptSyntacticAndSemanticIssues: false, // Allow TS errors
        }
      );

      const transformTime = performance.now() - startTransform;
      this.logger.debug(`Converted to ESTree in ${transformTime.toFixed(2)}ms`);

      // Extract imports and exports from ESTree
      const imports = this.extractImports(result.ast);
      const exports = this.extractExports(result.ast);

      // Create our ESTreeAST wrapper
      const estreeAST: ESTreeAST = {
        root: result.ast,
        services: result.services, // ← This has the node maps!
        language: Language.TYPESCRIPT,
        sourceFile: fileInfo.path,
        version: '1.0.0',
        diagnostics, // Add any diagnostics collected
        imports,
        exports,
      };

      return estreeAST;
    } catch (error) {
      // Catch syntax errors and convert to diagnostics
      this.logger.warn(`Syntax errors in ${fileInfo.path}, continuing with partial AST`);
      
      // Add error to diagnostics
      if (error instanceof Error) {
        diagnostics.push({
          severity: 'error',
          message: error.message,
          file: fileInfo.path,
        });
      }

      // Create a minimal valid ESTree AST
      const minimalAST: ESTreeAST = {
        root: {
          type: 'Program',
          body: [],
          sourceType: 'module',
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
          range: [0, 0],
          comments: [],
          tokens: [],
        } as unknown as TSESTree.Program,
        services: {
          program,
          esTreeNodeToTSNodeMap: new WeakMap(),
          tsNodeToESTreeNodeMap: new WeakMap(),
          getSymbolAtLocation: () => undefined,
          getTypeAtLocation: () => undefined as any,
        } as unknown as ParserServices,
        language: Language.TYPESCRIPT,
        sourceFile: fileInfo.path,
        version: '1.0.0',
        diagnostics, // Include the error diagnostics
        imports: [],
        exports: [],
      };

      return minimalAST;
    }
  }

  /**
   * Extract imports from ESTree AST
   */
  private extractImports(ast: TSESTree.Program): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    for (const statement of ast.body) {
      if (statement.type === 'ImportDeclaration') {
        const source = statement.source.value as string;
        const specifiers: string[] = [];
        let isDefault = false;
        let isNamespace = false;

        for (const spec of statement.specifiers) {
          if (spec.type === 'ImportDefaultSpecifier') {
            specifiers.push(spec.local.name);
            isDefault = true;
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            specifiers.push(spec.local.name);
            isNamespace = true;
          } else if (spec.type === 'ImportSpecifier') {
            specifiers.push(spec.local.name);
          }
        }

        imports.push({ source, specifiers, isDefault, isNamespace });
      }
    }

    return imports;
  }

  /**
   * Extract exports from ESTree AST
   */
  private extractExports(ast: TSESTree.Program): ExportInfo[] {
    const exports: ExportInfo[] = [];
    
    for (const statement of ast.body) {
      if (statement.type === 'ExportNamedDeclaration') {
        if (statement.declaration) {
          // export class Foo {}
          // export function bar() {}
          const decl = statement.declaration;
          if ('id' in decl && decl.id && 'name' in decl.id) {
            exports.push({
              name: decl.id.name as string,
              isDefault: false,
            });
          }
        }
        
        if (statement.specifiers) {
          // export { foo, bar }
          for (const spec of statement.specifiers) {
            const name = spec.exported.type === 'Identifier' 
              ? spec.exported.name 
              : (spec.exported as any).value || 'unknown';
            exports.push({
              name,
              isDefault: false,
            });
          }
        }
      } else if (statement.type === 'ExportDefaultDeclaration') {
        // export default Foo
        const name = 'declaration' in statement && 
                     statement.declaration &&
                     'id' in statement.declaration &&
                     statement.declaration.id &&
                     'name' in statement.declaration.id
          ? statement.declaration.id.name as string
          : 'default';
        
        exports.push({ name, isDefault: true });
      } else if (statement.type === 'ExportAllDeclaration') {
        // export * from './foo'
        exports.push({ name: '*', isDefault: false });
      }
    }

    return exports;
  }

  /**
   * Get TypeScript node from ESTree node using ParserServices
   * 
   * This is THE KEY to maintaining type information!
   */
  getTSNode(
    estreeNode: TSESTree.Node,
    services: ParserServices
  ): ts.Node | undefined {
    // ParserServices provides the node map
    return services.esTreeNodeToTSNodeMap.get(estreeNode);
  }

  /**
   * Get ESTree node from TypeScript node using ParserServices
   * 
   * Reverse mapping (less commonly needed)
   */
  getESTreeNode(
    tsNode: ts.Node,
    services: ParserServices
  ): TSESTree.Node | undefined {
    return services.tsNodeToESTreeNodeMap.get(tsNode);
  }
}

