/**
 * TSASTTransformer - Transforms TypeScript AST to Unified AST
 *
 * REFACTORED: Now uses native TypeScript API instead of ts-morph
 * Pattern: Similar to typescript-eslint's ast-converter
 *
 * This allows us to work with shared Programs from Project Service
 * without re-parsing, providing true 24x performance improvement.
 */

import * as ts from 'typescript';
import { UnifiedAST, createUnifiedAST, addDiagnostic, addImport, addExport, Diagnostic } from '../../../../domain/entities/ast/UnifiedAST.js';
import { ASTNode, ASTNodeKind, createASTNode, addChild } from '../../../../domain/entities/ast/ASTNode.js';
import { createSourceLocation, SourceLocation } from '../../../../domain/entities/ast/SourceLocation.js';
import { FileInfo } from '../../../../domain/entities/FileInfo.js';
import { Language } from '../../../../domain/value-objects/Language.js';
import * as helpers from './helpers/nodeHelpers.js';

export interface TransformerOptions {
  includeComments?: boolean;
  includeJSDoc?: boolean;
  includePrivateMembers?: boolean;
}

/**
 * Transforms native TypeScript AST to our UnifiedAST format
 *
 * Similar to typescript-eslint's Converter class, but converts to
 * UnifiedAST instead of TSESTree.
 *
 * Note: Does not implement ASTTransformer port due to signature differences
 * (requires Program parameter which port doesn't support)
 */
export class TSASTTransformer {
  private nodeIdCounter = 0;
  private sourceFile!: ts.SourceFile;
  private typeChecker!: ts.TypeChecker;
  private program!: ts.Program;

  constructor(
    private options: TransformerOptions = {}
  ) {}

  /**
   * Transform TypeScript SourceFile to Unified AST
   *
   * @param sourceFile - Native TypeScript SourceFile (from shared Program!)
   * @param program - TypeScript Program (provides TypeChecker)
   * @param fileInfo - File metadata
   */
  async transform(
    sourceFile: ts.SourceFile,
    program: ts.Program,
    fileInfo: FileInfo
  ): Promise<UnifiedAST> {
    // Store for use in helper methods
    this.sourceFile = sourceFile;
    this.program = program;
    this.typeChecker = program.getTypeChecker();

    try {
      // Create root node
      const rootNode = this.createRootNode(sourceFile, fileInfo);

      // Create unified AST
      const unifiedAST = createUnifiedAST(
        rootNode,
        Language.TYPESCRIPT,
        fileInfo.path
      );

      // Process top-level declarations
      this.processSourceFile(sourceFile, rootNode, unifiedAST);

      // Add diagnostics
      this.addDiagnostics(sourceFile, program, unifiedAST);

      // Process imports and exports
      this.processImports(sourceFile, unifiedAST);
      this.processExports(sourceFile, unifiedAST);

      return unifiedAST;
    } finally {
      // Clean up references
      this.sourceFile = null as any;
      this.typeChecker = null as any;
      this.program = null as any;
    }
  }

  /**
   * Create root node for the AST
   */
  private createRootNode(sourceFile: ts.SourceFile, fileInfo: FileInfo): ASTNode {
    const end = sourceFile.getLineAndCharacterOfPosition(sourceFile.end);

    const location: SourceLocation = {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: end.line + 1, column: end.character, offset: sourceFile.end },
      file: fileInfo.path
    };

    return createASTNode(
      this.generateNodeId('root'),
      ASTNodeKind.SOURCE_FILE,
      location,
      {
        name: fileInfo.path,
        language: 'typescript'
      },
      sourceFile.getFullText()
    );
  }

  /**
   * Process source file and extract all declarations
   */
  private processSourceFile(
    sourceFile: ts.SourceFile,
    rootNode: ASTNode,
    ast: UnifiedAST
  ): void {
    // Process each statement in the source file
    for (const statement of sourceFile.statements) {
      const astNode = this.convertStatement(statement);
      if (astNode) {
        addChild(rootNode, astNode);
      }
    }
  }

  /**
   * Convert a statement to an AST node
   * Pattern from typescript-eslint's convertNode
   */
  private convertStatement(node: ts.Statement): ASTNode | null {
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
        return this.convertClass(node as ts.ClassDeclaration);

      case ts.SyntaxKind.InterfaceDeclaration:
        return this.convertInterface(node as ts.InterfaceDeclaration);

      case ts.SyntaxKind.FunctionDeclaration:
        return this.convertFunction(node as ts.FunctionDeclaration);

      case ts.SyntaxKind.VariableStatement:
        return this.convertVariableStatement(node as ts.VariableStatement);

      case ts.SyntaxKind.TypeAliasDeclaration:
        return this.convertTypeAlias(node as ts.TypeAliasDeclaration);

      case ts.SyntaxKind.EnumDeclaration:
        return this.convertEnum(node as ts.EnumDeclaration);

      case ts.SyntaxKind.ModuleDeclaration:
        return this.convertModule(node as ts.ModuleDeclaration);

      case ts.SyntaxKind.ImportDeclaration:
      case ts.SyntaxKind.ExportDeclaration:
      case ts.SyntaxKind.ExportAssignment:
        // Handled separately in processImports/processExports
        return null;

      default:
        // Unknown or unsupported statement type
        return null;
    }
  }

  /**
   * Convert class declaration
   */
  private convertClass(node: ts.ClassDeclaration): ASTNode {
    const name = helpers.getName(node, this.sourceFile) || 'AnonymousClass';
    const location = this.getNodeLocation(node);

    const classNode = createASTNode(
      this.generateNodeId('class'),
      ASTNodeKind.CLASS_DECLARATION,
      location,
      {
        name,
        isAbstract: helpers.isAbstract(node),
        isExported: helpers.isExported(node),
      },
      node.getText(this.sourceFile)
    );

    // Process heritage (extends)
    const extendsClause = helpers.getExtendsClause(node);
    if (extendsClause && extendsClause.types.length > 0) {
      classNode.metadata.extends = extendsClause.types.map(type =>
        type.expression.getText(this.sourceFile)
      );
    }

    // Process implements
    const implementsClause = helpers.getImplementsClause(node);
    if (implementsClause && implementsClause.types.length > 0) {
      classNode.metadata.implements = implementsClause.types.map(type =>
        type.expression.getText(this.sourceFile)
      );
    }

    // Process decorators
    const decorators = ts.getDecorators(node);
    if (decorators && decorators.length > 0) {
      classNode.metadata.decorators = decorators.map(d => {
        const expr = d.expression;
        // If it's a call expression like @Injectable(), get just the function name
        if (ts.isCallExpression(expr)) {
          return expr.expression.getText(this.sourceFile);
        }
        // Otherwise use the full expression
        return expr.getText(this.sourceFile);
      });
    }

    // Process type parameters
    if (node.typeParameters) {
      classNode.metadata.typeParameters = node.typeParameters.map(tp =>
        tp.getText(this.sourceFile)
      );
    }

    // Process members
    for (const member of node.members) {
      const memberNode = this.convertClassMember(member);
      if (memberNode) {
        if (this.shouldIncludeMember(member)) {
          addChild(classNode, memberNode);
        }
      }
    }

    return classNode;
  }

  /**
   * Convert class member (method, property, constructor, etc.)
   */
  private convertClassMember(member: ts.ClassElement): ASTNode | null {
    if (ts.isMethodDeclaration(member)) {
      return this.convertMethod(member);
    } else if (ts.isPropertyDeclaration(member)) {
      return this.convertProperty(member);
    } else if (ts.isConstructorDeclaration(member)) {
      return this.convertConstructor(member);
    } else if (ts.isGetAccessorDeclaration(member)) {
      return this.convertGetter(member);
    } else if (ts.isSetAccessorDeclaration(member)) {
      return this.convertSetter(member);
    }

    return null;
  }

  /**
   * Convert method declaration
   */
  private convertMethod(node: ts.MethodDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const methodNode = createASTNode(
      this.generateNodeId('method'),
      ASTNodeKind.METHOD,
      location,
      {
        name,
        isStatic: helpers.isStatic(node),
        isAsync: helpers.isAsync(node),
        isPrivate: helpers.isPrivate(node),
        isProtected: helpers.isProtected(node),
        isPublic: helpers.isPublic(node),
      },
      node.getText(this.sourceFile)
    );

    // Get type information using TypeChecker
    const signature = this.typeChecker.getSignatureFromDeclaration(node);
    if (signature) {
      const returnType = this.typeChecker.getReturnTypeOfSignature(signature);
      methodNode.metadata.returnType = this.typeChecker.typeToString(returnType);
    }

    // Process parameters
    for (const param of node.parameters) {
      const paramNode = this.convertParameter(param);
      if (paramNode) {
        addChild(methodNode, paramNode);
      }
    }

    return methodNode;
  }

  /**
   * Convert property declaration
   */
  private convertProperty(node: ts.PropertyDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const propertyNode = createASTNode(
      this.generateNodeId('property'),
      ASTNodeKind.PROPERTY,
      location,
      {
        name,
        isStatic: helpers.isStatic(node),
        isReadonly: helpers.isReadonly(node),
        isPrivate: helpers.isPrivate(node),
        isProtected: helpers.isProtected(node),
        isPublic: helpers.isPublic(node),
      },
      node.getText(this.sourceFile)
    );

    // Get type information
    if (node.type) {
      propertyNode.metadata.type = node.type.getText(this.sourceFile);
    } else {
      // Infer type using TypeChecker
      const type = this.typeChecker.getTypeAtLocation(node);
      propertyNode.metadata.type = this.typeChecker.typeToString(type);
    }

    return propertyNode;
  }

  /**
   * Convert constructor declaration
   */
  private convertConstructor(node: ts.ConstructorDeclaration): ASTNode {
    const location = this.getNodeLocation(node);

    const constructorNode = createASTNode(
      this.generateNodeId('constructor'),
      ASTNodeKind.CONSTRUCTOR,
      location,
      {
        name: 'constructor',
      },
      node.getText(this.sourceFile)
    );

    // Process parameters
    for (const param of node.parameters) {
      const paramNode = this.convertParameter(param);
      if (paramNode) {
        addChild(constructorNode, paramNode);
      }
    }

    return constructorNode;
  }

  /**
   * Convert getter declaration
   */
  private convertGetter(node: ts.GetAccessorDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const getterNode = createASTNode(
      this.generateNodeId('getter'),
      ASTNodeKind.METHOD,
      location,
      {
        name,
        isGetter: true,
        isStatic: helpers.isStatic(node),
      },
      node.getText(this.sourceFile)
    );

    // Get return type
    const signature = this.typeChecker.getSignatureFromDeclaration(node);
    if (signature) {
      const returnType = this.typeChecker.getReturnTypeOfSignature(signature);
      getterNode.metadata.returnType = this.typeChecker.typeToString(returnType);
    }

    return getterNode;
  }

  /**
   * Convert setter declaration
   */
  private convertSetter(node: ts.SetAccessorDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const setterNode = createASTNode(
      this.generateNodeId('setter'),
      ASTNodeKind.METHOD,
      location,
      {
        name,
        isSetter: true,
        isStatic: helpers.isStatic(node),
      },
      node.getText(this.sourceFile)
    );

    // Process parameter
    if (node.parameters.length > 0) {
      const paramNode = this.convertParameter(node.parameters[0]);
      if (paramNode) {
        addChild(setterNode, paramNode);
      }
    }

    return setterNode;
  }

  /**
   * Convert parameter declaration
   */
  private convertParameter(node: ts.ParameterDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const paramNode = createASTNode(
      this.generateNodeId('parameter'),
      ASTNodeKind.IDENTIFIER,
      location,
      {
        name,
        isOptional: !!node.questionToken,
        isRest: !!node.dotDotDotToken,
      },
      node.getText(this.sourceFile)
    );

    // Get type
    if (node.type) {
      paramNode.metadata.type = node.type.getText(this.sourceFile);
    } else {
      const type = this.typeChecker.getTypeAtLocation(node);
      paramNode.metadata.type = this.typeChecker.typeToString(type);
    }

    return paramNode;
  }

  /**
   * Convert interface declaration
   */
  private convertInterface(node: ts.InterfaceDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const interfaceNode = createASTNode(
      this.generateNodeId('interface'),
      ASTNodeKind.INTERFACE_DECLARATION,
      location,
      {
        name,
        isExported: helpers.isExported(node),
      },
      node.getText(this.sourceFile)
    );

    // Process extends
    const extendsClause = helpers.getExtendsClause(node);
    if (extendsClause && extendsClause.types.length > 0) {
      interfaceNode.metadata.extends = extendsClause.types.map(type =>
        type.expression.getText(this.sourceFile)
      );
    }

    // Process type parameters
    if (node.typeParameters) {
      interfaceNode.metadata.typeParameters = node.typeParameters.map(tp =>
        tp.getText(this.sourceFile)
      );
    }

    // Process members
    for (const member of node.members) {
      const memberNode = this.convertInterfaceMember(member);
      if (memberNode) {
        addChild(interfaceNode, memberNode);
      }
    }

    return interfaceNode;
  }

  /**
   * Convert interface member
   */
  private convertInterfaceMember(member: ts.TypeElement): ASTNode | null {
    if (ts.isPropertySignature(member)) {
      return this.convertPropertySignature(member);
    } else if (ts.isMethodSignature(member)) {
      return this.convertMethodSignature(member);
    }

    return null;
  }

  /**
   * Convert property signature
   */
  private convertPropertySignature(node: ts.PropertySignature): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const propNode = createASTNode(
      this.generateNodeId('property-signature'),
      ASTNodeKind.PROPERTY,
      location,
      {
        name,
        isOptional: !!node.questionToken,
        isReadonly: helpers.isReadonly(node),
      },
      node.getText(this.sourceFile)
    );

    if (node.type) {
      propNode.metadata.type = node.type.getText(this.sourceFile);
    }

    return propNode;
  }

  /**
   * Convert method signature
   */
  private convertMethodSignature(node: ts.MethodSignature): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const methodNode = createASTNode(
      this.generateNodeId('method-signature'),
      ASTNodeKind.METHOD,
      location,
      {
        name,
        isOptional: !!node.questionToken,
      },
      node.getText(this.sourceFile)
    );

    // Process parameters
    for (const param of node.parameters) {
      const paramNode = this.convertParameter(param);
      if (paramNode) {
        addChild(methodNode, paramNode);
      }
    }

    // Get return type
    if (node.type) {
      methodNode.metadata.returnType = node.type.getText(this.sourceFile);
    }

    return methodNode;
  }

  /**
   * Convert function declaration
   */
  private convertFunction(node: ts.FunctionDeclaration): ASTNode {
    const name = helpers.getName(node, this.sourceFile) || 'anonymous';
    const location = this.getNodeLocation(node);

    const functionNode = createASTNode(
      this.generateNodeId('function'),
      ASTNodeKind.FUNCTION_DECLARATION,
      location,
      {
        name,
        isAsync: helpers.isAsync(node),
        isExported: helpers.isExported(node),
      },
      node.getText(this.sourceFile)
    );

    // Get return type using TypeChecker
    const signature = this.typeChecker.getSignatureFromDeclaration(node);
    if (signature) {
      const returnType = this.typeChecker.getReturnTypeOfSignature(signature);
      functionNode.metadata.returnType = this.typeChecker.typeToString(returnType);
    }

    // Process parameters
    for (const param of node.parameters) {
      const paramNode = this.convertParameter(param);
      if (paramNode) {
        addChild(functionNode, paramNode);
      }
    }

    return functionNode;
  }

  /**
   * Convert variable statement
   */
  private convertVariableStatement(node: ts.VariableStatement): ASTNode {
    const kind = helpers.getVariableDeclarationKind(node);
    const location = this.getNodeLocation(node);

    const varNode = createASTNode(
      this.generateNodeId('variable'),
      ASTNodeKind.VARIABLE_DECLARATION,
      location,
      {
        kind,
        isExported: helpers.isExported(node),
      },
      node.getText(this.sourceFile)
    );

    // Process each variable declaration
    for (const declaration of node.declarationList.declarations) {
      const name = declaration.name.getText(this.sourceFile);
      const declLocation = this.getNodeLocation(declaration);

      const declNode = createASTNode(
        this.generateNodeId('var-decl'),
        ASTNodeKind.IDENTIFIER,
        declLocation,
        { name },
        declaration.getText(this.sourceFile)
      );

      // Get type
      if (declaration.type) {
        declNode.metadata.type = declaration.type.getText(this.sourceFile);
      } else if (declaration.initializer) {
        const type = this.typeChecker.getTypeAtLocation(declaration);
        declNode.metadata.type = this.typeChecker.typeToString(type);
      }

      addChild(varNode, declNode);
    }

    return varNode;
  }

  /**
   * Convert type alias declaration
   */
  private convertTypeAlias(node: ts.TypeAliasDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const typeNode = createASTNode(
      this.generateNodeId('type-alias'),
      ASTNodeKind.TYPE_ALIAS,
      location,
      {
        name,
        isExported: helpers.isExported(node),
        type: node.type.getText(this.sourceFile),
      },
      node.getText(this.sourceFile)
    );

    // Process type parameters
    if (node.typeParameters) {
      typeNode.metadata.typeParameters = node.typeParameters.map(tp =>
        tp.getText(this.sourceFile)
      );
    }

    return typeNode;
  }

  /**
   * Convert enum declaration
   */
  private convertEnum(node: ts.EnumDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    const enumNode = createASTNode(
      this.generateNodeId('enum'),
      ASTNodeKind.ENUM_DECLARATION,
      location,
      {
        name,
        isExported: helpers.isExported(node),
      },
      node.getText(this.sourceFile)
    );

    // Process enum members
    for (const member of node.members) {
      const memberName = member.name.getText(this.sourceFile);
      const memberLocation = this.getNodeLocation(member);

      const memberNode = createASTNode(
        this.generateNodeId('enum-member'),
        ASTNodeKind.IDENTIFIER,
        memberLocation,
        {
          name: memberName,
          value: member.initializer?.getText(this.sourceFile),
        },
        member.getText(this.sourceFile)
      );

      addChild(enumNode, memberNode);
    }

    return enumNode;
  }

  /**
   * Convert module/namespace declaration
   */
  private convertModule(node: ts.ModuleDeclaration): ASTNode {
    const name = node.name.getText(this.sourceFile);
    const location = this.getNodeLocation(node);

    return createASTNode(
      this.generateNodeId('module'),
      ASTNodeKind.MODULE,
      location,
      {
        name,
        isExported: helpers.isExported(node),
      },
      node.getText(this.sourceFile)
    );
  }

  /**
   * Add diagnostics from the program
   */
  private addDiagnostics(
    sourceFile: ts.SourceFile,
    program: ts.Program,
    ast: UnifiedAST
  ): void {
    // Get all diagnostics for this file
    const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
    const semanticDiagnostics = program.getSemanticDiagnostics(sourceFile);

    const allDiagnostics = [...syntacticDiagnostics, ...semanticDiagnostics];

    for (const diag of allDiagnostics) {
      if (diag.file === sourceFile && diag.start !== undefined) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start);

        const diagnostic: Diagnostic = {
          message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
          severity: this.getDiagnosticSeverity(diag.category),
          location: {
            file: sourceFile.fileName,
            line: line + 1,
            column: character,
          },
          code: diag.code?.toString()
        };

        addDiagnostic(ast, diagnostic);
      }
    }
  }

  /**
   * Convert TypeScript diagnostic category to our severity
   */
  private getDiagnosticSeverity(category: ts.DiagnosticCategory): 'error' | 'warning' | 'info' {
    switch (category) {
      case ts.DiagnosticCategory.Error:
        return 'error';
      case ts.DiagnosticCategory.Warning:
        return 'warning';
      case ts.DiagnosticCategory.Suggestion:
        return 'info';
      case ts.DiagnosticCategory.Message:
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Process imports
   */
  private processImports(sourceFile: ts.SourceFile, ast: UnifiedAST): void {
    const imports = helpers.getImportDeclarations(sourceFile);

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.moduleSpecifier;

      if (ts.isStringLiteral(moduleSpecifier)) {
        const specifiers: Array<{ imported: string; local?: string }> = [];

        // Process import clause
        if (importDecl.importClause) {
          // Default import
          if (importDecl.importClause.name) {
            specifiers.push({
              imported: 'default',
              local: importDecl.importClause.name.getText(this.sourceFile)
            });
          }

          // Named bindings
          const bindings = importDecl.importClause.namedBindings;
          if (bindings) {
            if (ts.isNamedImports(bindings)) {
              // Named imports
              for (const element of bindings.elements) {
                specifiers.push({
                  imported: element.propertyName?.getText(this.sourceFile) || element.name.getText(this.sourceFile),
                  local: element.name.getText(this.sourceFile),
                });
              }
            } else if (ts.isNamespaceImport(bindings)) {
              // Namespace import (import * as foo)
              specifiers.push({
                imported: '*',
                local: bindings.name.getText(this.sourceFile)
              });
            }
          }
        }

        addImport(ast, {
          source: moduleSpecifier.text,
          specifiers,
          isTypeOnly: (importDecl as any).isTypeOnly, // TypeScript may not have this on all versions
        });
      }
    }
  }

  /**
   * Process exports
   */
  private processExports(sourceFile: ts.SourceFile, ast: UnifiedAST): void {
    // Export declarations
    const exportDecls = helpers.getExportDeclarations(sourceFile);

    for (const exportDecl of exportDecls) {
      const moduleSpecifier = exportDecl.moduleSpecifier;

      if (exportDecl.exportClause && ts.isNamedExports(exportDecl.exportClause)) {
        // Named exports
        for (const element of exportDecl.exportClause.elements) {
          addExport(ast, {
            name: element.name.getText(this.sourceFile),
            localName: element.propertyName?.getText(this.sourceFile),
            isTypeOnly: (exportDecl as any).isTypeOnly,
            source: moduleSpecifier && ts.isStringLiteral(moduleSpecifier)
              ? moduleSpecifier.text
              : undefined,
          });
        }
      } else if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
        // Re-export entire module
        addExport(ast, {
          name: '*',
          source: moduleSpecifier.text,
          isTypeOnly: (exportDecl as any).isTypeOnly,
        });
      }
    }

    // Export assignments (export = ...)
    const exportAssignments = helpers.getExportAssignments(sourceFile);
    for (const assignment of exportAssignments) {
      addExport(ast, {
        name: 'default',
        isDefault: true,
      });
    }

    // Check for exported declarations (export class Foo {})
    for (const statement of sourceFile.statements) {
      if (helpers.isExported(statement)) {
        // Only try to get name if it's a named declaration
        let name: string | undefined;

        if (ts.isClassDeclaration(statement) || ts.isFunctionDeclaration(statement) ||
            ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) ||
            ts.isEnumDeclaration(statement)) {
          name = statement.name?.getText(this.sourceFile);
        }

        if (name) {
          addExport(ast, { name });
        }
      }
    }
  }

  /**
   * Get node location in source file
   */
  private getNodeLocation(node: ts.Node): SourceLocation {
    const start = node.getStart(this.sourceFile);
    const end = node.getEnd();

    const startPos = this.sourceFile.getLineAndCharacterOfPosition(start);
    const endPos = this.sourceFile.getLineAndCharacterOfPosition(end);

    return createSourceLocation(
      this.sourceFile.fileName,
      startPos.line + 1,
      startPos.character,
      endPos.line + 1,
      endPos.character,
      start,
      end
    );
  }

  /**
   * Check if a member should be included based on options
   */
  private shouldIncludeMember(member: ts.ClassElement): boolean {
    if (this.options.includePrivateMembers) {
      return true;
    }

    // Exclude private members unless explicitly included
    return !helpers.isPrivate(member);
  }

  /**
   * Get modifiers for a node (used for metadata)
   */
  private getModifiers(node: ts.Node): string[] {
    if (!ts.canHaveModifiers(node)) {
      return [];
    }

    const modifiers = ts.getModifiers(node);
    if (!modifiers) {
      return [];
    }

    return modifiers.map(mod => {
      switch (mod.kind) {
        case ts.SyntaxKind.PublicKeyword: return 'public';
        case ts.SyntaxKind.PrivateKeyword: return 'private';
        case ts.SyntaxKind.ProtectedKeyword: return 'protected';
        case ts.SyntaxKind.StaticKeyword: return 'static';
        case ts.SyntaxKind.ReadonlyKeyword: return 'readonly';
        case ts.SyntaxKind.AbstractKeyword: return 'abstract';
        case ts.SyntaxKind.AsyncKeyword: return 'async';
        case ts.SyntaxKind.ExportKeyword: return 'export';
        case ts.SyntaxKind.DefaultKeyword: return 'default';
        default: return mod.getText(this.sourceFile);
      }
    });
  }

  /**
   * Generate unique node ID
   */
  private generateNodeId(prefix: string): string {
    return `${prefix}-${this.nodeIdCounter++}`;
  }

  /**
   * Convert import declaration (for AST nodes)
   */
  private processImportDeclaration(node: ts.ImportDeclaration): ASTNode | null {
    // Imports are processed separately in processImports()
    // This is for creating AST nodes for the import statement itself
    return null;
  }

  /**
   * Convert export declaration (for AST nodes)
   */
  private processExportDeclaration(node: ts.ExportDeclaration): ASTNode | null {
    // Exports are processed separately in processExports()
    return null;
  }

  /**
   * Convert export assignment (for AST nodes)
   */
  private processExportAssignment(node: ts.ExportAssignment): ASTNode | null {
    // Export assignments are processed separately in processExports()
    return null;
  }
}
