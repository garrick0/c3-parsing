/**
 * TSEdgeDetector - Detects relationships between TypeScript elements
 *
 * REFACTORED: Now uses native TypeScript API instead of ts-morph
 * Pattern: Uses TypeChecker for cross-file edge detection
 *
 * With shared Programs, we can now detect edges across files!
 */

import * as ts from 'typescript';
import { Edge } from '../../../domain/entities/Edge.js';
import { EdgeType } from '../../../domain/value-objects/EdgeType.js';
import * as helpers from './helpers/nodeHelpers.js';

/**
 * Detects edges/relationships between TypeScript elements
 */
export class TSEdgeDetector {
  /**
   * Detect all edges in a source file
   *
   * @param sourceFile - Native TypeScript SourceFile
   * @param program - TypeScript Program (provides TypeChecker)
   */
  async detectEdges(
    sourceFile: ts.SourceFile,
    program: ts.Program
  ): Promise<Edge[]> {
    const typeChecker = program.getTypeChecker();
    const edges: Edge[] = [];

    // Detect import edges
    this.detectImportEdges(sourceFile, edges);

    // Detect inheritance edges (extends/implements)
    this.detectInheritanceEdges(sourceFile, typeChecker, edges);

    // Detect call edges (function calls)
    this.detectCallEdges(sourceFile, typeChecker, edges);

    // Detect reference edges
    this.detectReferenceEdges(sourceFile, typeChecker, edges);

    // Detect containment edges
    this.detectContainmentEdges(sourceFile, edges);

    return edges;
  }

  /**
   * Detect import edges
   */
  private detectImportEdges(
    sourceFile: ts.SourceFile,
    edges: Edge[]
  ): void {
    const imports = helpers.getImportDeclarations(sourceFile);

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.moduleSpecifier;

      if (ts.isStringLiteral(moduleSpecifier)) {
        edges.push(new Edge(
          this.generateEdgeId(),
          EdgeType.IMPORTS,
          sourceFile.fileName,
          moduleSpecifier.text,
          {
            isTypeOnly: (importDecl as any).isTypeOnly,
          }
        ));
      }
    }
  }

  /**
   * Detect inheritance edges (extends/implements)
   */
  private detectInheritanceEdges(
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
    edges: Edge[]
  ): void {
    const classes = helpers.getClasses(sourceFile);

    for (const cls of classes) {
      if (!cls.name) continue;

      const className = cls.name.getText(sourceFile);

      // Detect extends edges
      const extendsClause = helpers.getExtendsClause(cls);
      if (extendsClause) {
        for (const type of extendsClause.types) {
          const baseClassName = type.expression.getText(sourceFile);

          edges.push(new Edge(
            this.generateEdgeId(),
            EdgeType.EXTENDS,
            className,
            baseClassName,
            {
              kind: 'class-extends',
            }
          ));
        }
      }

      // Detect implements edges
      const implementsClause = helpers.getImplementsClause(cls);
      if (implementsClause) {
        for (const type of implementsClause.types) {
          const interfaceName = type.expression.getText(sourceFile);

          edges.push(new Edge(
            this.generateEdgeId(),
            EdgeType.IMPLEMENTS,
            className,
            interfaceName,
            {
              kind: 'class-implements',
            }
          ));
        }
      }
    }

    // Detect interface extends
    const interfaces = helpers.getInterfaces(sourceFile);

    for (const iface of interfaces) {
      const interfaceName = iface.name.getText(sourceFile);

      const extendsClause = helpers.getExtendsClause(iface);
      if (extendsClause) {
        for (const type of extendsClause.types) {
          const baseInterfaceName = type.expression.getText(sourceFile);

          edges.push(new Edge(
            this.generateEdgeId(),
            EdgeType.EXTENDS,
            interfaceName,
            baseInterfaceName,
            {
              kind: 'interface-extends',
            }
          ));
        }
      }
    }
  }

  /**
   * Detect call edges (function/method calls)
   *
   * With TypeChecker, we can now resolve cross-file calls!
   */
  private detectCallEdges(
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
    edges: Edge[]
  ): void {
    helpers.visitAllNodes(sourceFile, node => {
      if (ts.isCallExpression(node)) {
        // Try to resolve the call target
        const signature = typeChecker.getResolvedSignature(node);

        if (signature && signature.declaration) {
          const declaration = signature.declaration;

          // Get source (caller)
          let source: string | undefined;
          let currentNode: ts.Node | undefined = node;
          while (currentNode) {
            if (ts.isFunctionDeclaration(currentNode) ||
                ts.isMethodDeclaration(currentNode)) {
              source = currentNode.name?.getText(sourceFile);
              break;
            }
            currentNode = currentNode.parent;
          }

          // Get target (callee) - check if declaration has name property
          let target: string | undefined;
          if ('name' in declaration && declaration.name) {
            target = declaration.name.getText();
          }

          if (source && target) {
            edges.push(new Edge(
              this.generateEdgeId(),
              EdgeType.CALLS,
              source,
              target,
              {
                kind: 'function-call',
              }
            ));
          }
        }
      }
    });
  }

  /**
   * Detect reference edges
   */
  private detectReferenceEdges(
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
    edges: Edge[]
  ): void {
    helpers.visitAllNodes(sourceFile, node => {
      if (ts.isIdentifier(node)) {
        const symbol = typeChecker.getSymbolAtLocation(node);

        if (symbol && symbol.declarations) {
          for (const declaration of symbol.declarations) {
            // Check if declaration is in a different file
            if (declaration.getSourceFile() !== sourceFile) {
              const targetFile = declaration.getSourceFile().fileName;

              edges.push(new Edge(
                this.generateEdgeId(),
                EdgeType.REFERENCES,
                sourceFile.fileName,
                targetFile,
                {
                  symbol: node.getText(sourceFile),
                  kind: 'cross-file-reference',
                }
              ));
            }
          }
        }
      }
    });
  }

  /**
   * Detect containment edges (class contains method, etc.)
   */
  private detectContainmentEdges(
    sourceFile: ts.SourceFile,
    edges: Edge[]
  ): void {
    // Process classes
    const classes = helpers.getClasses(sourceFile);

    for (const cls of classes) {
      if (!cls.name) continue;

      const className = cls.name.getText(sourceFile);

      // Class contains methods
      const methods = helpers.getMethods(cls);
      for (const method of methods) {
        const methodName = method.name.getText(sourceFile);

        edges.push(new Edge(
          this.generateEdgeId(),
          EdgeType.CONTAINS,
          className,
          methodName,
          {
            kind: 'class-contains-method',
          }
        ));
      }

      // Class contains properties
      const properties = helpers.getProperties(cls);
      for (const prop of properties) {
        const propName = prop.name.getText(sourceFile);

        edges.push(new Edge(
          this.generateEdgeId(),
          EdgeType.CONTAINS,
          className,
          propName,
          {
            kind: 'class-contains-property',
          }
        ));
      }
    }

    // Process interfaces
    const interfaces = helpers.getInterfaces(sourceFile);

    for (const iface of interfaces) {
      const interfaceName = iface.name.getText(sourceFile);

      // Interface contains members
      for (const member of iface.members) {
        if (ts.isPropertySignature(member) || ts.isMethodSignature(member)) {
          const memberName = member.name?.getText(sourceFile);

          if (memberName) {
            edges.push(new Edge(
              this.generateEdgeId(),
              EdgeType.CONTAINS,
              interfaceName,
              memberName,
              {
                kind: 'interface-contains-member',
              }
            ));
          }
        }
      }
    }
  }

  /**
   * Generate unique edge ID
   */
  private generateEdgeId(): string {
    return `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
