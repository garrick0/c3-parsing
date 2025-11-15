/**
 * TSEdgeDetector - Detects edges/relationships in TypeScript AST
 */

import {
  SourceFile,
  ClassDeclaration,
  InterfaceDeclaration,
  ImportDeclaration,
  ExportDeclaration,
  CallExpression,
  PropertyAccessExpression,
  Identifier,
  Node as TSNode,
  SyntaxKind,
  ts,
  MethodDeclaration,
  FunctionDeclaration,
  VariableDeclaration
} from 'ts-morph';

import { Edge } from '../../../../domain/entities/Edge.js';
import { EdgeType } from '../../../../domain/value-objects/EdgeType.js';

export interface DetectedEdge {
  type: EdgeType;
  source: string;
  target: string;
  metadata?: Record<string, any>;
}

export class TSEdgeDetector {
  private edgeIdCounter = 0;

  /**
   * Detect all edges in a source file
   */
  async detectEdges(sourceFile: SourceFile): Promise<Edge[]> {
    const edges: Edge[] = [];

    // Detect import dependencies
    this.detectImportEdges(sourceFile, edges);

    // Detect inheritance relationships
    this.detectInheritanceEdges(sourceFile, edges);

    // Detect function calls
    this.detectCallEdges(sourceFile, edges);

    // Detect property access/references
    this.detectReferenceEdges(sourceFile, edges);

    // Detect containment relationships
    this.detectContainmentEdges(sourceFile, edges);

    return edges;
  }

  /**
   * Detect import dependencies
   */
  private detectImportEdges(sourceFile: SourceFile, edges: Edge[]): void {
    const filePath = sourceFile.getFilePath();

    sourceFile.getImportDeclarations().forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      // Create import edge
      edges.push(this.createEdge(
        EdgeType.IMPORTS,
        filePath,
        moduleSpecifier,
        {
          isTypeOnly: importDecl.isTypeOnly(),
          importedSymbols: this.getImportedSymbols(importDecl)
        }
      ));

      // Create dependency edge
      edges.push(this.createEdge(
        EdgeType.DEPENDS_ON,
        filePath,
        moduleSpecifier,
        {
          dependencyType: 'import'
        }
      ));
    });

    // Also detect dynamic imports
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
      const expression = callExpr.getExpression();
      if (expression.getText() === 'import' || expression.getText() === 'require') {
        const args = callExpr.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
          const modulePath = args[0].getText().slice(1, -1); // Remove quotes

          edges.push(this.createEdge(
            EdgeType.IMPORTS,
            filePath,
            modulePath,
            {
              isDynamic: true
            }
          ));

          edges.push(this.createEdge(
            EdgeType.DEPENDS_ON,
            filePath,
            modulePath,
            {
              dependencyType: 'dynamic-import'
            }
          ));
        }
      }
    });
  }

  /**
   * Detect inheritance relationships (extends, implements)
   */
  private detectInheritanceEdges(sourceFile: SourceFile, edges: Edge[]): void {
    // Class inheritance
    sourceFile.getClasses().forEach(cls => {
      const className = cls.getName() || 'AnonymousClass';

      // Extends relationship
      const extendsExpr = cls.getExtends();
      if (extendsExpr) {
        const parentName = extendsExpr.getText();
        edges.push(this.createEdge(
          EdgeType.EXTENDS,
          className,
          parentName,
          {
            sourceType: 'class',
            targetType: 'class'
          }
        ));
      }

      // Implements relationships
      cls.getImplements().forEach(impl => {
        const interfaceName = impl.getText();
        edges.push(this.createEdge(
          EdgeType.IMPLEMENTS,
          className,
          interfaceName,
          {
            sourceType: 'class',
            targetType: 'interface'
          }
        ));
      });
    });

    // Interface inheritance
    sourceFile.getInterfaces().forEach(iface => {
      const interfaceName = iface.getName();

      iface.getExtends().forEach(ext => {
        const parentName = ext.getText();
        edges.push(this.createEdge(
          EdgeType.EXTENDS,
          interfaceName,
          parentName,
          {
            sourceType: 'interface',
            targetType: 'interface'
          }
        ));
      });
    });
  }

  /**
   * Detect function call edges
   */
  private detectCallEdges(sourceFile: SourceFile, edges: Edge[]): void {
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
      const caller = this.getContainingFunction(callExpr);
      const callee = this.getCallTarget(callExpr);

      if (caller && callee) {
        edges.push(this.createEdge(
          EdgeType.CALLS,
          caller,
          callee,
          {
            arguments: callExpr.getArguments().length,
            isAsync: this.isAsyncCall(callExpr)
          }
        ));
      }
    });
  }

  /**
   * Detect reference edges (variable references, property access)
   */
  private detectReferenceEdges(sourceFile: SourceFile, edges: Edge[]): void {
    // Detect property access
    sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach(propAccess => {
      const accessor = this.getContainingFunction(propAccess);
      const property = propAccess.getName();
      const object = propAccess.getExpression().getText();

      if (accessor && property) {
        edges.push(this.createEdge(
          EdgeType.REFERENCES,
          accessor,
          `${object}.${property}`,
          {
            referenceType: 'property'
          }
        ));
      }
    });

    // Detect identifier references
    sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach(identifier => {
      const symbol = identifier.getSymbol();
      if (symbol) {
        const declarations = symbol.getDeclarations();
        if (declarations.length > 0) {
          const accessor = this.getContainingFunction(identifier);
          const target = symbol.getName();

          if (accessor && target && !this.isDeclaration(identifier)) {
            edges.push(this.createEdge(
              EdgeType.REFERENCES,
              accessor,
              target,
              {
                referenceType: 'identifier'
              }
            ));
          }
        }
      }
    });
  }

  /**
   * Detect containment relationships
   */
  private detectContainmentEdges(sourceFile: SourceFile, edges: Edge[]): void {
    const filePath = sourceFile.getFilePath();

    // File contains classes
    sourceFile.getClasses().forEach(cls => {
      const className = cls.getName() || 'AnonymousClass';
      edges.push(this.createEdge(
        EdgeType.CONTAINS,
        filePath,
        className,
        { containedType: 'class' }
      ));

      // Class contains methods
      cls.getMethods().forEach(method => {
        edges.push(this.createEdge(
          EdgeType.CONTAINS,
          className,
          `${className}.${method.getName()}`,
          { containedType: 'method' }
        ));
      });

      // Class contains properties
      cls.getProperties().forEach(prop => {
        edges.push(this.createEdge(
          EdgeType.CONTAINS,
          className,
          `${className}.${prop.getName()}`,
          { containedType: 'property' }
        ));
      });
    });

    // File contains interfaces
    sourceFile.getInterfaces().forEach(iface => {
      const interfaceName = iface.getName();
      edges.push(this.createEdge(
        EdgeType.CONTAINS,
        filePath,
        interfaceName,
        { containedType: 'interface' }
      ));
    });

    // File contains functions
    sourceFile.getFunctions().forEach(func => {
      const functionName = func.getName() || 'AnonymousFunction';
      edges.push(this.createEdge(
        EdgeType.CONTAINS,
        filePath,
        functionName,
        { containedType: 'function' }
      ));
    });

    // File contains variables
    sourceFile.getVariableDeclarations().forEach(varDecl => {
      edges.push(this.createEdge(
        EdgeType.CONTAINS,
        filePath,
        varDecl.getName(),
        { containedType: 'variable' }
      ));
    });

    // File contains enums
    sourceFile.getEnums().forEach(enumDecl => {
      edges.push(this.createEdge(
        EdgeType.CONTAINS,
        filePath,
        enumDecl.getName(),
        { containedType: 'enum' }
      ));
    });

    // File contains type aliases
    sourceFile.getTypeAliases().forEach(typeAlias => {
      edges.push(this.createEdge(
        EdgeType.CONTAINS,
        filePath,
        typeAlias.getName(),
        { containedType: 'type' }
      ));
    });
  }

  /**
   * Get imported symbols from an import declaration
   */
  private getImportedSymbols(importDecl: ImportDeclaration): string[] {
    const symbols: string[] = [];

    // Named imports
    importDecl.getNamedImports().forEach(named => {
      symbols.push(named.getName());
    });

    // Default import
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      symbols.push(defaultImport.getText());
    }

    // Namespace import
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      symbols.push(`* as ${namespaceImport.getText()}`);
    }

    return symbols;
  }

  /**
   * Get the containing function of a node
   */
  private getContainingFunction(node: TSNode): string | null {
    let current: TSNode | undefined = node.getParent();

    while (current) {
      const kind = current.getKind();

      if (kind === SyntaxKind.FunctionDeclaration) {
        return (current as FunctionDeclaration).getName() || 'AnonymousFunction';
      }

      if (kind === SyntaxKind.MethodDeclaration) {
        const method = current as MethodDeclaration;
        const className = method.getParent()?.getSymbol()?.getName();
        return className ? `${className}.${method.getName()}` : method.getName();
      }

      if (kind === SyntaxKind.ArrowFunction || kind === SyntaxKind.FunctionExpression) {
        const parent = current.getParent();
        if (parent?.getKind() === SyntaxKind.VariableDeclaration) {
          return (parent as VariableDeclaration).getName();
        }
        return 'AnonymousFunction';
      }

      if (kind === SyntaxKind.Constructor) {
        const className = current.getParent()?.getSymbol()?.getName();
        return className ? `${className}.constructor` : 'constructor';
      }

      current = current.getParent();
    }

    // If not in a function, use the file path
    return node.getSourceFile().getFilePath();
  }

  /**
   * Get the target of a function call
   */
  private getCallTarget(callExpr: CallExpression): string | null {
    const expression = callExpr.getExpression();

    if (expression.getKind() === SyntaxKind.Identifier) {
      return expression.getText();
    }

    if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
      return expression.getText();
    }

    // For other cases (e.g., function expressions)
    return expression.getText();
  }

  /**
   * Check if a call is async
   */
  private isAsyncCall(callExpr: CallExpression): boolean {
    const parent = callExpr.getParent();
    return parent?.getKind() === SyntaxKind.AwaitExpression;
  }

  /**
   * Check if an identifier is a declaration (not a reference)
   */
  private isDeclaration(identifier: Identifier): boolean {
    const parent = identifier.getParent();
    if (!parent) return false;

    const kind = parent.getKind();

    // Check if it's part of a declaration
    if (kind === SyntaxKind.VariableDeclaration ||
        kind === SyntaxKind.FunctionDeclaration ||
        kind === SyntaxKind.ClassDeclaration ||
        kind === SyntaxKind.InterfaceDeclaration ||
        kind === SyntaxKind.TypeAliasDeclaration ||
        kind === SyntaxKind.EnumDeclaration) {

      // Check if the identifier is the name of the declaration
      if ('getName' in parent && (parent as any).getName() === identifier.getText()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create an edge
   */
  private createEdge(
    type: EdgeType,
    source: string,
    target: string,
    metadata?: Record<string, any>
  ): Edge {
    return new Edge(
      this.generateEdgeId(),
      type,
      source,
      target,
      metadata || {}
    );
  }

  /**
   * Generate unique edge ID
   */
  private generateEdgeId(): string {
    return `edge-${this.edgeIdCounter++}-${Date.now()}`;
  }
}