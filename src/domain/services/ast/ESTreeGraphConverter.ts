/**
 * ESTreeGraphConverter - Converts ESTree AST to property graph elements
 * 
 * Replaces GraphConverter.ts but uses ESTree instead of Unified AST
 */

import type { TSESTree } from '@typescript-eslint/typescript-estree';
import type { ParserServices } from '@typescript-eslint/typescript-estree';
import * as ts from 'typescript';
import { ESTreeAST } from '../../entities/ast/ESTreeAST.js';
import { Node } from '../../entities/Node.js';
import { Edge } from '../../entities/Edge.js';
import { NodeType } from '../../value-objects/NodeType.js';
import { EdgeType } from '../../value-objects/EdgeType.js';
import { NodeFactory } from '../NodeFactory.js';
import { EdgeDetector } from '../EdgeDetector.js';
import { FileInfo } from '../../entities/FileInfo.js';
import { ParseResult } from '../../ports/Parser.js';
import { traverseESTree } from './ESTreeTraverser.js';
import { Logger } from '@garrick0/c3-shared';

export interface ESTreeGraphConversionOptions {
  includeComments?: boolean;
  includeImports?: boolean;
  includeExports?: boolean;
  includePrivateMembers?: boolean;
}

export class ESTreeGraphConverter {
  private nodeMap: Map<string, Node> = new Map();
  private edges: Edge[] = [];

  constructor(
    private logger: Logger,
    private nodeFactory: NodeFactory,
    private edgeDetector: EdgeDetector,
    private options: ESTreeGraphConversionOptions = {}
  ) {}

  /**
   * Convert ESTree AST to property graph elements
   */
  async convert(
    ast: ESTreeAST,
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

    // Process ESTree nodes
    this.processESTreeNode(ast.root, fileNode, ast.services, false);

    // Process imports to create edges
    this.processImportEdges(ast, fileNode);

    // Create result
    const result: ParseResult = {
      nodes: Array.from(this.nodeMap.values()),
      edges: this.edges,
      metadata: {
        language: ast.language,
        version: ast.version,
        diagnostics: ast.diagnostics || []
      }
    };

    return result;
  }

  /**
   * Process an ESTree node and its children
   */
  private processESTreeNode(
    estreeNode: TSESTree.Node,
    parentGraphNode: Node,
    services: ParserServices,
    isExported: boolean = false
  ): void {
    // Check if this node is being exported
    const nodeIsExported = isExported || this.isNodeExported(estreeNode, parentGraphNode);

    // Convert ESTree node to graph node
    const graphNode = this.estreeNodeToGraphNode(
      estreeNode,
      parentGraphNode,
      services,
      nodeIsExported
    );

    if (graphNode) {
      this.nodeMap.set(graphNode.id, graphNode);

      // Create containment edge
      const containsEdge = this.edgeDetector.createContainsEdge(
        parentGraphNode.id,
        graphNode.id
      );
      this.edges.push(containsEdge);
    }

    // Traverse children (visitor pattern handles this)
    traverseESTree(estreeNode, (childNode) => {
      if (childNode !== estreeNode) {
        this.processESTreeNode(
          childNode,
          graphNode || parentGraphNode,
          services,
          nodeIsExported
        );
      }
    });
  }

  /**
   * Check if a node is exported
   */
  private isNodeExported(node: TSESTree.Node, parent: Node): boolean {
    // Check if node type indicates it's an export
    if (node.type === 'ExportNamedDeclaration' || 
        node.type === 'ExportDefaultDeclaration' ||
        node.type === 'ExportAllDeclaration') {
      return true;
    }
    return false;
  }

  /**
   * Convert ESTree node to graph node
   * 
   * THIS IS THE KEY MAPPING: ESTree types → Our NodeType enum
   */
  private estreeNodeToGraphNode(
    estreeNode: TSESTree.Node,
    parent: Node,
    services: ParserServices,
    isExported: boolean = false
  ): Node | null {
    // Get the original TS node for type information
    const tsNode = services.esTreeNodeToTSNodeMap.get(estreeNode);
    const typeChecker = services.program?.getTypeChecker();
    
    if (!typeChecker) {
      this.logger.warn('TypeChecker not available from ParserServices');
    }
    
    const filePath = parent.metadata.filePath;

    // Get location info from ESTree (standard format!)
    const location = estreeNode.loc
      ? {
          startLine: estreeNode.loc.start.line,
          endLine: estreeNode.loc.end.line,
          startColumn: estreeNode.loc.start.column,
          endColumn: estreeNode.loc.end.column,
        }
      : undefined;

    // Map ESTree types to our graph nodes
    // This replaces the old switch on ASTNodeKind enum
    switch (estreeNode.type) {
      // Classes
      case 'ClassDeclaration': {
        const node = estreeNode as TSESTree.ClassDeclaration;
        const name = node.id?.name || 'AnonymousClass';
        
        return this.nodeFactory.createClassNode(name, parent.metadata.filePath, {
          ...location,
          isAbstract: node.abstract ?? false,
          isExported,
          superClass: node.superClass ? this.getExpressionName(node.superClass) : undefined,
          implements: node.implements?.map(impl => this.getExpressionName(impl.expression)),
          // Store TS node for semantic analysis
          tsNode: tsNode,
        });
      }

      // Interfaces (TypeScript-specific!)
      case 'TSInterfaceDeclaration': {
        const node = estreeNode as TSESTree.TSInterfaceDeclaration;
        const name = node.id.name;
        
        return new Node(
          `interface-${name}-${Date.now()}`,
          NodeType.INTERFACE,
          name,
          {
            ...location,
            filePath,
            isExported,
            extends: node.extends?.map(e => this.getExpressionName(e.expression)),
            tsNode: tsNode,
          }
        );
      }

      // Functions
      case 'FunctionDeclaration': {
        const node = estreeNode as TSESTree.FunctionDeclaration;
        const name = node.id?.name || 'AnonymousFunction';
        
        // Get return type using TypeChecker!
        let returnType: string | undefined;
        if (tsNode && typeChecker && ts.isFunctionDeclaration(tsNode)) {
          const signature = typeChecker.getSignatureFromDeclaration(tsNode);
          if (signature) {
            const type = typeChecker.getReturnTypeOfSignature(signature);
            returnType = typeChecker.typeToString(type);
          }
        }
        
        return this.nodeFactory.createFunctionNode(name, parent.metadata.filePath, {
          ...location,
          async: node.async,
          isAsync: node.async,  // For backward compatibility
          isExported,
          generator: node.generator,
          parameters: node.params.map(p => this.getParameterInfo(p)),
          returnType,
          tsNode: tsNode,
        });
      }

      // Variables
      case 'VariableDeclaration': {
        const node = estreeNode as TSESTree.VariableDeclaration;
        
        // Variable declarations contain multiple declarators
        // We'll create a node for each
        for (const declarator of node.declarations) {
          if (declarator.id.type === 'Identifier') {
            const name = declarator.id.name;
            const isConst = node.kind === 'const';
            
            // Get type using TypeChecker!
            let varType: string | undefined;
            if (tsNode && typeChecker && ts.isVariableStatement(tsNode)) {
              const decl = tsNode.declarationList.declarations[0];
              if (decl) {
                const type = typeChecker.getTypeAtLocation(decl);
                varType = typeChecker.typeToString(type);
              }
            }
            
            const graphNode = new Node(
              `variable-${name}-${Date.now()}`,
              isConst ? NodeType.CONSTANT : NodeType.VARIABLE,
              name,
              {
                ...location,
                filePath,
                isExported,
                type: varType,
                initializer: declarator.init ? this.getExpressionName(declarator.init) : undefined,
                tsNode: tsNode,
              }
            );
            
            this.nodeMap.set(graphNode.id, graphNode);
          }
        }
        
        return null; // Already added nodes above
      }

      // Type Aliases (TypeScript-specific!)
      case 'TSTypeAliasDeclaration': {
        const node = estreeNode as TSESTree.TSTypeAliasDeclaration;
        const name = node.id.name;
        
        return new Node(
          `type-${name}-${Date.now()}`,
          NodeType.TYPE,
          name,
          {
            ...location,
            filePath,
            isExported,
            tsNode: tsNode,
          }
        );
      }

      // Enums (TypeScript-specific!)
      case 'TSEnumDeclaration': {
        const node = estreeNode as TSESTree.TSEnumDeclaration;
        const name = node.id.name;
        
        // Use body.members instead of members to avoid deprecation warning
        const members = node.body?.members || node.members || [];
        
        return new Node(
          `enum-${name}-${Date.now()}`,
          NodeType.ENUM,
          name,
          {
            ...location,
            filePath,
            isExported,
            members: members.map((m: any) => {
              if (m.id.type === 'Identifier') {
                return m.id.name;
              }
              return 'unknown';
            }),
            tsNode: tsNode,
          }
        );
      }

      // Imports
      case 'ImportDeclaration': {
        if (this.options.includeImports !== false) {
          const node = estreeNode as TSESTree.ImportDeclaration;
          const source = node.source.value as string;
          
          return new Node(
            `import-${source}-${Date.now()}`,
            NodeType.IMPORT,
            source,
            {
              ...location,
              filePath,
              specifiers: node.specifiers.map(s => {
                if (s.type === 'ImportDefaultSpecifier') {
                  return s.local.name;
                } else if (s.type === 'ImportNamespaceSpecifier') {
                  return `* as ${s.local.name}`;
                } else if (s.type === 'ImportSpecifier') {
                  return s.local.name;
                }
                return 'unknown';
              }),
              tsNode: tsNode,
            }
          );
        }
        return null;
      }

      // Export declarations - process the declaration inside
      case 'ExportNamedDeclaration': {
        const node = estreeNode as TSESTree.ExportNamedDeclaration;
        
        // If there's a declaration, process it as exported
        if (node.declaration) {
          return this.estreeNodeToGraphNode(node.declaration, parent, services, true);
        }
        
        // Otherwise, it's a re-export or export list
        if (this.options.includeExports !== false) {
          return new Node(
            `export-${Date.now()}`,
            NodeType.EXPORT,
            'export',
            {
              ...location,
              filePath,
              tsNode: tsNode,
            }
          );
        }
        return null;
      }
      
      case 'ExportDefaultDeclaration': {
        const node = estreeNode as TSESTree.ExportDefaultDeclaration;
        
        // If there's a declaration, process it as exported
        if (node.declaration && 'type' in node.declaration) {
          return this.estreeNodeToGraphNode(node.declaration as TSESTree.Node, parent, services, true);
        }
        
        return null;
      }
      
      case 'ExportAllDeclaration': {
        if (this.options.includeExports !== false) {
          return new Node(
            `export-${Date.now()}`,
            NodeType.EXPORT,
            'export',
            {
              ...location,
              filePath,
              tsNode: tsNode,
            }
          );
        }
        return null;
      }

      // Ignore other node types (expressions, statements, etc.)
      default:
        return null;
    }
  }

  /**
   * Helper: Get name from an expression
   */
  private getExpressionName(expr: TSESTree.Expression | TSESTree.PrivateIdentifier): string {
    if (expr.type === 'Identifier') {
      return expr.name;
    } else if (expr.type === 'MemberExpression') {
      const object = this.getExpressionName(expr.object as TSESTree.Expression);
      const property = expr.property.type === 'Identifier' ? expr.property.name : 'unknown';
      return `${object}.${property}`;
    }
    return 'unknown';
  }

  /**
   * Helper: Get parameter info
   */
  private getParameterInfo(param: TSESTree.Parameter): { name: string; type?: string } {
    if (param.type === 'Identifier') {
      return { name: param.name };
    } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
      return { name: param.left.name };
    }
    return { name: 'unknown' };
  }

  /**
   * Process imports to create edges
   */
  private processImportEdges(ast: ESTreeAST, fileNode: Node): void {
    // Traverse the AST to find imports
    traverseESTree(ast.root, (node) => {
      if (node.type === 'ImportDeclaration') {
        const importNode = node as TSESTree.ImportDeclaration;
        const source = importNode.source.value as string;
        
        // Create IMPORTS edge
        const importsEdge = new Edge(
          `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          EdgeType.IMPORTS,
          fileNode.id,
          source,
          {
            source: fileNode.name,
            target: source,
            isTypeOnly: (importNode as any).importKind === 'type',
          }
        );
        this.edges.push(importsEdge);
        
        // Create DEPENDS_ON edge
        const dependsOnEdge = new Edge(
          `depends-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          EdgeType.DEPENDS_ON,
          fileNode.id,
          source,
          {
            source: fileNode.name,
            target: source,
            kind: 'import',
          }
        );
        this.edges.push(dependsOnEdge);
      }
    });
  }
}

