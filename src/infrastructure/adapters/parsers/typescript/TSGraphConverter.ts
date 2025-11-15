/**
 * TSGraphConverter - Converts TypeScript AST to Property Graph
 */

import { GraphConverter, GraphConversionOptions } from '../../../../domain/services/ast/GraphConverter.js';
import { UnifiedAST } from '../../../../domain/entities/ast/UnifiedAST.js';
import { FileInfo } from '../../../../domain/entities/FileInfo.js';
import { ParseResult } from '../../../../domain/ports/Parser.js';
import { NodeFactory } from '../../../../domain/services/NodeFactory.js';
import { EdgeDetector } from '../../../../domain/services/EdgeDetector.js';
import { Node } from '../../../../domain/entities/Node.js';
import { NodeType } from '../../../../domain/value-objects/NodeType.js';
import { ASTNode, ASTNodeKind, findNodesByKind, getNodeName } from '../../../../domain/entities/ast/ASTNode.js';

export interface TSGraphConversionOptions extends GraphConversionOptions {
  includeTypeInfo?: boolean;
  includeAsync?: boolean;
  includeGenerics?: boolean;
}

export class TSGraphConverter extends GraphConverter {
  constructor(
    nodeFactory: NodeFactory,
    edgeDetector: EdgeDetector,
    private tsOptions: TSGraphConversionOptions = {}
  ) {
    super(nodeFactory, edgeDetector, tsOptions);
  }

  /**
   * Convert unified AST to property graph with TypeScript-specific handling
   */
  async convert(
    ast: UnifiedAST,
    fileInfo: FileInfo
  ): Promise<ParseResult> {
    // Use base conversion
    const result = await super.convert(ast, fileInfo);

    // Add TypeScript-specific enhancements
    this.enhanceWithTypeScriptFeatures(result, ast);

    return result;
  }

  /**
   * Enhance the graph with TypeScript-specific features
   */
  private enhanceWithTypeScriptFeatures(result: ParseResult, ast: UnifiedAST): void {
    // Add type information to nodes if requested
    if (this.tsOptions.includeTypeInfo) {
      this.addTypeInformation(result, ast);
    }

    // Add async/await information
    if (this.tsOptions.includeAsync) {
      this.addAsyncInformation(result, ast);
    }

    // Add generic type information
    if (this.tsOptions.includeGenerics) {
      this.addGenericInformation(result, ast);
    }

    // Add TypeScript-specific metadata
    this.addTypeScriptMetadata(result, ast);
  }

  /**
   * Add type information to nodes
   */
  private addTypeInformation(result: ParseResult, ast: UnifiedAST): void {
    // Add type information from symbols
    for (const [name, symbol] of ast.symbols) {
      const node = result.nodes.find(n => n.name === name);
      if (node && symbol.type) {
        node.metadata.type = symbol.type;
      }
    }

    // Add type information from AST nodes
    const typeNodes = findNodesByKind(ast.root, ASTNodeKind.TYPE_ALIAS);
    for (const typeNode of typeNodes) {
      const name = getNodeName(typeNode);
      if (name) {
        const node = result.nodes.find(n => n.name === name);
        if (node) {
          node.metadata.aliasedType = typeNode.metadata.type;
        }
      }
    }
  }

  /**
   * Add async/await information
   */
  private addAsyncInformation(result: ParseResult, ast: UnifiedAST): void {
    // Find all async functions
    const asyncFunctions = this.findAsyncFunctions(ast.root);

    for (const asyncFunc of asyncFunctions) {
      const name = getNodeName(asyncFunc);
      if (name) {
        const node = result.nodes.find(n => n.name === name);
        if (node) {
          node.metadata.isAsync = true;
        }
      }
    }
  }

  /**
   * Add generic type information
   */
  private addGenericInformation(result: ParseResult, ast: UnifiedAST): void {
    // Find nodes with type parameters
    const nodesWithGenerics = this.findNodesWithGenerics(ast.root);

    for (const genericNode of nodesWithGenerics) {
      const name = getNodeName(genericNode);
      if (name) {
        const node = result.nodes.find(n => n.name === name);
        if (node && genericNode.metadata.typeParameters) {
          node.metadata.typeParameters = genericNode.metadata.typeParameters;
        }
      }
    }
  }

  /**
   * Add TypeScript-specific metadata to the result
   */
  private addTypeScriptMetadata(result: ParseResult, ast: UnifiedAST): void {
    // Add language version
    result.metadata.languageVersion = 'TypeScript';

    // Add module type (CommonJS vs ES Modules)
    result.metadata.moduleType = this.detectModuleType(ast);

    // Add strict mode information
    result.metadata.strictMode = this.detectStrictMode(ast);

    // Add statistics
    result.metadata.statistics = {
      classes: findNodesByKind(ast.root, ASTNodeKind.CLASS_DECLARATION).length,
      interfaces: findNodesByKind(ast.root, ASTNodeKind.INTERFACE_DECLARATION).length,
      functions: findNodesByKind(ast.root, ASTNodeKind.FUNCTION_DECLARATION).length,
      types: findNodesByKind(ast.root, ASTNodeKind.TYPE_ALIAS).length,
      enums: findNodesByKind(ast.root, ASTNodeKind.ENUM_DECLARATION).length,
      imports: ast.imports.length,
      exports: ast.exports.length,
      symbols: ast.symbols.size,
      errors: ast.diagnostics.filter(d => d.severity === 'error').length,
      warnings: ast.diagnostics.filter(d => d.severity === 'warning').length
    };
  }

  /**
   * Find all async functions in the AST
   */
  private findAsyncFunctions(root: ASTNode): ASTNode[] {
    const asyncFunctions: ASTNode[] = [];

    function traverse(node: ASTNode): void {
      if ((node.kind === ASTNodeKind.FUNCTION_DECLARATION ||
           node.kind === ASTNodeKind.METHOD) &&
          node.metadata.isAsync) {
        asyncFunctions.push(node);
      }
      node.children.forEach(traverse);
    }

    traverse(root);
    return asyncFunctions;
  }

  /**
   * Find nodes with generic type parameters
   */
  private findNodesWithGenerics(root: ASTNode): ASTNode[] {
    const nodesWithGenerics: ASTNode[] = [];

    function traverse(node: ASTNode): void {
      if (node.metadata.typeParameters) {
        nodesWithGenerics.push(node);
      }
      node.children.forEach(traverse);
    }

    traverse(root);
    return nodesWithGenerics;
  }

  /**
   * Detect module type (CommonJS vs ES Modules)
   */
  private detectModuleType(ast: UnifiedAST): 'commonjs' | 'esmodule' | 'mixed' {
    const hasImports = ast.imports.length > 0;
    const hasExports = ast.exports.length > 0;

    // Check for CommonJS patterns in the AST
    let hasRequire = false;
    let hasModuleExports = false;

    function checkForCommonJS(node: ASTNode): void {
      if (node.text?.includes('require(') || node.text?.includes('require.resolve(')) {
        hasRequire = true;
      }
      if (node.text?.includes('module.exports') || node.text?.includes('exports.')) {
        hasModuleExports = true;
      }
      node.children.forEach(checkForCommonJS);
    }

    checkForCommonJS(ast.root);

    if ((hasImports || hasExports) && (hasRequire || hasModuleExports)) {
      return 'mixed';
    } else if (hasImports || hasExports) {
      return 'esmodule';
    } else if (hasRequire || hasModuleExports) {
      return 'commonjs';
    }

    return 'esmodule'; // Default to ES modules
  }

  /**
   * Detect if strict mode is enabled
   */
  private detectStrictMode(ast: UnifiedAST): boolean {
    // Check for "use strict" directive
    const sourceText = ast.root.text;
    if (sourceText) {
      return sourceText.includes('"use strict"') || sourceText.includes("'use strict'");
    }

    // Check for strict TypeScript compiler options (would need compiler options)
    // For now, return false as default
    return false;
  }
}