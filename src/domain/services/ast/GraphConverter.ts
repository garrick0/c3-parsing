/**
 * GraphConverter - Converts unified AST to property graph elements
 */

import { UnifiedAST, Symbol, SymbolKind } from '../../entities/ast/UnifiedAST.js';
import { ASTNode, ASTNodeKind, findNodesByKind, getNodeName } from '../../entities/ast/ASTNode.js';
import { Node } from '../../entities/Node.js';
import { Edge } from '../../entities/Edge.js';
import { NodeType } from '../../value-objects/NodeType.js';
import { EdgeType } from '../../value-objects/EdgeType.js';
import { NodeFactory } from '../NodeFactory.js';
import { EdgeDetector } from '../EdgeDetector.js';
import { FileInfo } from '../../entities/FileInfo.js';
import { ParseResult } from '../../ports/Parser.js';

export interface GraphConversionOptions {
  includeComments?: boolean;
  includeImports?: boolean;
  includeExports?: boolean;
  includePrivateMembers?: boolean;
}

export class GraphConverter {
  private nodeMap: Map<string, Node> = new Map();
  private edges: Edge[] = [];

  constructor(
    private nodeFactory: NodeFactory,
    private edgeDetector: EdgeDetector,
    private options: GraphConversionOptions = {}
  ) {}

  /**
   * Convert unified AST to property graph elements
   */
  async convert(
    ast: UnifiedAST,
    fileInfo: FileInfo
  ): Promise<ParseResult> {
    // Reset state
    this.nodeMap.clear();
    this.edges = [];

    // Create file node
    const fileNode = this.nodeFactory.createFileNode(fileInfo.path, {
      size: fileInfo.size,
      language: fileInfo.language,
      lastModified: fileInfo.lastModified
    });
    this.nodeMap.set(fileNode.id, fileNode);

    // Process AST nodes
    this.processASTNode(ast.root, fileNode);

    // Process symbols
    this.processSymbols(ast.symbols, fileNode);

    // Process imports
    if (this.options.includeImports !== false) {
      this.processImports(ast, fileNode);
    }

    // Process exports
    if (this.options.includeExports !== false) {
      this.processExports(ast, fileNode);
    }

    // Create result
    const result: ParseResult = {
      nodes: Array.from(this.nodeMap.values()),
      edges: this.edges,
      metadata: {
        language: ast.language,
        version: ast.version,
        diagnostics: ast.diagnostics
      }
    };

    return result;
  }

  /**
   * Process an AST node and its children
   */
  private processASTNode(astNode: ASTNode, parentGraphNode: Node): void {
    // Convert AST node to graph node
    const graphNode = this.astNodeToGraphNode(astNode, parentGraphNode);

    if (graphNode) {
      this.nodeMap.set(graphNode.id, graphNode);

      // Create containment edge
      const containsEdge = this.edgeDetector.createContainsEdge(
        parentGraphNode.id,
        graphNode.id
      );
      this.edges.push(containsEdge);

      // Process children with this node as parent
      for (const child of astNode.children) {
        this.processASTNode(child, graphNode);
      }
    } else {
      // If no graph node created, process children with same parent
      for (const child of astNode.children) {
        this.processASTNode(child, parentGraphNode);
      }
    }
  }

  /**
   * Convert AST node to graph node
   */
  private astNodeToGraphNode(astNode: ASTNode, parent: Node): Node | null {
    const name = getNodeName(astNode);

    if (!name && !this.shouldCreateUnnamedNode(astNode)) {
      return null;
    }

    const metadata = {
      filePath: astNode.location.file,
      startLine: astNode.location.start.line,
      endLine: astNode.location.end.line,
      ...astNode.metadata
    };

    switch (astNode.kind) {
      case ASTNodeKind.CLASS_DECLARATION:
        return this.nodeFactory.createClassNode(
          name || 'AnonymousClass',
          astNode.location.file,
          metadata
        );

      case ASTNodeKind.INTERFACE_DECLARATION:
        return new Node(
          `interface-${Date.now()}`,
          NodeType.INTERFACE,
          name || 'AnonymousInterface',
          metadata
        );

      case ASTNodeKind.FUNCTION_DECLARATION:
        return this.nodeFactory.createFunctionNode(
          name || 'AnonymousFunction',
          astNode.location.file,
          metadata
        );

      case ASTNodeKind.METHOD:
        return new Node(
          `method-${Date.now()}`,
          NodeType.METHOD,
          name || 'AnonymousMethod',
          metadata
        );

      case ASTNodeKind.VARIABLE_DECLARATION:
        return new Node(
          `variable-${Date.now()}`,
          NodeType.VARIABLE,
          name || 'AnonymousVariable',
          metadata
        );

      case ASTNodeKind.TYPE_ALIAS:
        return new Node(
          `type-${Date.now()}`,
          NodeType.TYPE,
          name || 'AnonymousType',
          metadata
        );

      case ASTNodeKind.ENUM_DECLARATION:
        return new Node(
          `enum-${Date.now()}`,
          NodeType.ENUM,
          name || 'AnonymousEnum',
          metadata
        );

      case ASTNodeKind.IMPORT_DECLARATION:
        if (this.options.includeImports !== false) {
          return new Node(
            `import-${Date.now()}`,
            NodeType.IMPORT,
            astNode.metadata.moduleSpecifier || 'unknown',
            metadata
          );
        }
        return null;

      case ASTNodeKind.EXPORT_DECLARATION:
        if (this.options.includeExports !== false) {
          return new Node(
            `export-${Date.now()}`,
            NodeType.EXPORT,
            name || 'default',
            metadata
          );
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Check if unnamed node should be created
   */
  private shouldCreateUnnamedNode(astNode: ASTNode): boolean {
    // Always create nodes for certain kinds even without names
    const alwaysCreate = [
      ASTNodeKind.IMPORT_DECLARATION,
      ASTNodeKind.EXPORT_DECLARATION
    ];

    return alwaysCreate.includes(astNode.kind);
  }

  /**
   * Process symbols from the AST
   */
  private processSymbols(symbols: Map<string, Symbol>, fileNode: Node): void {
    for (const symbol of symbols.values()) {
      // Find or create node for symbol
      const symbolNode = this.findOrCreateSymbolNode(symbol, fileNode);

      if (symbolNode && !this.nodeMap.has(symbolNode.id)) {
        this.nodeMap.set(symbolNode.id, symbolNode);

        // Create containment edge if not already connected
        const containsEdge = this.edgeDetector.createContainsEdge(
          fileNode.id,
          symbolNode.id
        );
        this.edges.push(containsEdge);
      }
    }
  }

  /**
   * Find or create a node for a symbol
   */
  private findOrCreateSymbolNode(symbol: Symbol, fileNode: Node): Node | null {
    // Check if node already exists
    for (const node of this.nodeMap.values()) {
      if (node.name === symbol.name && node.getFilePath() === fileNode.getFilePath()) {
        return node;
      }
    }

    // Create new node based on symbol kind
    const metadata = {
      filePath: fileNode.getFilePath(),
      visibility: symbol.visibility,
      isExported: symbol.isExported,
      type: symbol.type
    };

    switch (symbol.kind) {
      case SymbolKind.CLASS:
        return this.nodeFactory.createClassNode(symbol.name, fileNode.getFilePath(), metadata);
      case SymbolKind.FUNCTION:
        return this.nodeFactory.createFunctionNode(symbol.name, fileNode.getFilePath(), metadata);
      case SymbolKind.INTERFACE:
        return new Node(
          `interface-${Date.now()}`,
          NodeType.INTERFACE,
          symbol.name,
          metadata
        );
      default:
        return null;
    }
  }

  /**
   * Process import declarations
   */
  private processImports(ast: UnifiedAST, fileNode: Node): void {
    for (const importInfo of ast.imports) {
      // Create edge for import dependency
      const importEdge = this.edgeDetector.createImportEdge(
        fileNode.id,
        importInfo.source
      );
      this.edges.push(importEdge);

      // Create dependency edge
      const dependsEdge = this.edgeDetector.createDependencyEdge(
        fileNode.id,
        importInfo.source
      );
      this.edges.push(dependsEdge);
    }
  }

  /**
   * Process export declarations
   */
  private processExports(ast: UnifiedAST, fileNode: Node): void {
    for (const exportInfo of ast.exports) {
      // Create edges for re-exports
      if (exportInfo.source) {
        const reExportEdge = new Edge(
          `edge-reexport-${Date.now()}`,
          EdgeType.EXPORTS,
          fileNode.id,
          exportInfo.source,
          { name: exportInfo.name, isDefault: exportInfo.isDefault }
        );
        this.edges.push(reExportEdge);
      }
    }
  }
}