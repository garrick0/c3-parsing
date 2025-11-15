/**
 * TSASTTransformer - Transforms TypeScript AST to Unified AST
 */

import {
  SourceFile,
  Node as TSNode,
  SyntaxKind,
  ClassDeclaration,
  InterfaceDeclaration,
  FunctionDeclaration,
  VariableStatement,
  TypeAliasDeclaration,
  EnumDeclaration,
  ImportDeclaration,
  ExportDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  ConstructorDeclaration,
  VariableDeclarationKind,
  ts
} from 'ts-morph';
import { ASTTransformer } from '../../../../domain/ports/ASTTransformer.js';
import { UnifiedAST, createUnifiedAST, addDiagnostic, addImport, addExport, Diagnostic } from '../../../../domain/entities/ast/UnifiedAST.js';
import { ASTNode, ASTNodeKind, createASTNode, addChild } from '../../../../domain/entities/ast/ASTNode.js';
import { createSourceLocation, SourceLocation } from '../../../../domain/entities/ast/SourceLocation.js';
import { FileInfo } from '../../../../domain/entities/FileInfo.js';
import { Language } from '../../../../domain/value-objects/Language.js';

export interface TransformerOptions {
  includeComments?: boolean;
  includeJSDoc?: boolean;
  includePrivateMembers?: boolean;
}

export class TSASTTransformer implements ASTTransformer<SourceFile> {
  private nodeIdCounter = 0;

  constructor(
    private options: TransformerOptions = {}
  ) {}

  /**
   * Transform TypeScript SourceFile to Unified AST
   */
  async transform(sourceFile: SourceFile, fileInfo: FileInfo): Promise<UnifiedAST> {
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
    this.addDiagnostics(sourceFile, unifiedAST);

    // Process imports and exports
    this.processImports(sourceFile, unifiedAST);
    this.processExports(sourceFile, unifiedAST);

    return unifiedAST;
  }

  /**
   * Create root node for the AST
   */
  private createRootNode(sourceFile: SourceFile, fileInfo: FileInfo): ASTNode {
    const location = this.getNodeLocation(sourceFile, fileInfo.path);

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
  private processSourceFile(sourceFile: SourceFile, rootNode: ASTNode, ast: UnifiedAST): void {
    // Process all children of the source file
    sourceFile.forEachChild(child => {
      const astNode = this.processNode(child, sourceFile);
      if (astNode) {
        addChild(rootNode, astNode);
      }
    });
  }

  /**
   * Process a TypeScript node and convert to AST node
   */
  private processNode(node: TSNode, sourceFile: SourceFile): ASTNode | null {
    const kind = node.getKind();

    switch (kind) {
      case SyntaxKind.ClassDeclaration:
        return this.processClass(node as ClassDeclaration, sourceFile);

      case SyntaxKind.InterfaceDeclaration:
        return this.processInterface(node as InterfaceDeclaration, sourceFile);

      case SyntaxKind.FunctionDeclaration:
        return this.processFunction(node as FunctionDeclaration, sourceFile);

      case SyntaxKind.VariableStatement:
        return this.processVariableStatement(node as VariableStatement, sourceFile);

      case SyntaxKind.TypeAliasDeclaration:
        return this.processTypeAlias(node as TypeAliasDeclaration, sourceFile);

      case SyntaxKind.EnumDeclaration:
        return this.processEnum(node as EnumDeclaration, sourceFile);

      case SyntaxKind.ImportDeclaration:
        return this.processImportDeclaration(node as ImportDeclaration, sourceFile);

      case SyntaxKind.ExportDeclaration:
        return this.processExportDeclaration(node as ExportDeclaration, sourceFile);

      case SyntaxKind.ExportAssignment:
        return this.processExportAssignment(node, sourceFile);

      default:
        // For other node types, we might want to process them recursively
        // or ignore them depending on the requirements
        return null;
    }
  }

  /**
   * Process class declaration
   */
  private processClass(node: ClassDeclaration, sourceFile: SourceFile): ASTNode {
    const className = node.getName() || 'AnonymousClass';
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    const classNode = createASTNode(
      this.generateNodeId('class'),
      ASTNodeKind.CLASS_DECLARATION,
      location,
      {
        name: className,
        modifiers: this.getModifiers(node),
        isAbstract: node.isAbstract(),
        isExported: node.isExported(),
        extends: node.getExtends() ? [node.getExtends()!.getText()] : undefined,
        implements: node.getImplements().map(i => i.getText()),
        decorators: node.getDecorators().map(d => d.getName())
      }
    );

    // Process class members
    node.getMembers().forEach(member => {
      const memberNode = this.processClassMember(member, sourceFile);
      if (memberNode && this.shouldIncludeMember(member)) {
        addChild(classNode, memberNode);
      }
    });

    return classNode;
  }

  /**
   * Process interface declaration
   */
  private processInterface(node: InterfaceDeclaration, sourceFile: SourceFile): ASTNode {
    const interfaceName = node.getName();
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    const interfaceNode = createASTNode(
      this.generateNodeId('interface'),
      ASTNodeKind.INTERFACE_DECLARATION,
      location,
      {
        name: interfaceName,
        modifiers: this.getModifiers(node),
        isExported: node.isExported(),
        extends: node.getExtends().map(e => e.getText())
      }
    );

    // Process interface members
    node.getMembers().forEach(member => {
      const memberNode = this.processInterfaceMember(member, sourceFile);
      if (memberNode) {
        addChild(interfaceNode, memberNode);
      }
    });

    return interfaceNode;
  }

  /**
   * Process function declaration
   */
  private processFunction(node: FunctionDeclaration, sourceFile: SourceFile): ASTNode {
    const functionName = node.getName() || 'AnonymousFunction';
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('function'),
      ASTNodeKind.FUNCTION_DECLARATION,
      location,
      {
        name: functionName,
        modifiers: this.getModifiers(node),
        isExported: node.isExported(),
        isAsync: node.isAsync(),
        isGenerator: node.isGenerator(),
        parameters: this.getParameters(node),
        returnType: node.getReturnType().getText()
      }
    );
  }

  /**
   * Process variable statement
   */
  private processVariableStatement(node: VariableStatement, sourceFile: SourceFile): ASTNode | null {
    const declarations = node.getDeclarations();
    if (declarations.length === 0) return null;

    // For simplicity, process the first declaration
    const firstDecl = declarations[0];
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('variable'),
      ASTNodeKind.VARIABLE_DECLARATION,
      location,
      {
        name: firstDecl.getName(),
        modifiers: this.getModifiers(node),
        isExported: node.isExported(),
        isConst: node.getDeclarationKind() === VariableDeclarationKind.Const,
        isLet: node.getDeclarationKind() === VariableDeclarationKind.Let,
        type: firstDecl.getType().getText(),
        initializer: firstDecl.getInitializer()?.getText()
      }
    );
  }

  /**
   * Process type alias declaration
   */
  private processTypeAlias(node: TypeAliasDeclaration, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('type'),
      ASTNodeKind.TYPE_ALIAS,
      location,
      {
        name: node.getName(),
        modifiers: this.getModifiers(node),
        isExported: node.isExported(),
        type: node.getTypeNode()?.getText()
      }
    );
  }

  /**
   * Process enum declaration
   */
  private processEnum(node: EnumDeclaration, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    const enumNode = createASTNode(
      this.generateNodeId('enum'),
      ASTNodeKind.ENUM_DECLARATION,
      location,
      {
        name: node.getName(),
        modifiers: this.getModifiers(node),
        isExported: node.isExported(),
        isConst: node.isConstEnum()
      }
    );

    // Add enum members as children
    node.getMembers().forEach(member => {
      const memberLocation = this.getNodeLocation(member, sourceFile.getFilePath());
      const memberNode = createASTNode(
        this.generateNodeId('enum-member'),
        ASTNodeKind.PROPERTY,
        memberLocation,
        {
          name: member.getName(),
          value: member.getValue()
        }
      );
      addChild(enumNode, memberNode);
    });

    return enumNode;
  }

  /**
   * Process import declaration
   */
  private processImportDeclaration(node: ImportDeclaration, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('import'),
      ASTNodeKind.IMPORT_DECLARATION,
      location,
      {
        moduleSpecifier: node.getModuleSpecifierValue(),
        isTypeOnly: node.isTypeOnly(),
        defaultImport: node.getDefaultImport()?.getText(),
        namespaceImport: node.getNamespaceImport()?.getText(),
        namedImports: node.getNamedImports().map(i => ({
          name: i.getName(),
          alias: i.getAliasNode()?.getText()
        }))
      }
    );
  }

  /**
   * Process export declaration
   */
  private processExportDeclaration(node: ExportDeclaration, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('export'),
      ASTNodeKind.EXPORT_DECLARATION,
      location,
      {
        moduleSpecifier: node.getModuleSpecifier()?.getText(),
        isTypeOnly: node.isTypeOnly(),
        namedExports: node.getNamedExports().map(e => ({
          name: e.getName(),
          alias: e.getAliasNode()?.getText()
        }))
      }
    );
  }

  /**
   * Process export assignment (default export)
   */
  private processExportAssignment(node: TSNode, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('export-default'),
      ASTNodeKind.EXPORT_DECLARATION,
      location,
      {
        isDefault: true,
        expression: node.getText()
      }
    );
  }

  /**
   * Process class member
   */
  private processClassMember(member: TSNode, sourceFile: SourceFile): ASTNode | null {
    const kind = member.getKind();

    switch (kind) {
      case SyntaxKind.Constructor:
        return this.processConstructor(member as ConstructorDeclaration, sourceFile);

      case SyntaxKind.MethodDeclaration:
        return this.processMethod(member as MethodDeclaration, sourceFile);

      case SyntaxKind.PropertyDeclaration:
        return this.processProperty(member as PropertyDeclaration, sourceFile);

      case SyntaxKind.GetAccessor:
      case SyntaxKind.SetAccessor:
        return this.processAccessor(member, sourceFile);

      default:
        return null;
    }
  }

  /**
   * Process interface member
   */
  private processInterfaceMember(member: TSNode, sourceFile: SourceFile): ASTNode | null {
    const location = this.getNodeLocation(member, sourceFile.getFilePath());
    const kind = member.getKind();

    if (kind === SyntaxKind.PropertySignature) {
      return createASTNode(
        this.generateNodeId('property'),
        ASTNodeKind.PROPERTY,
        location,
        {
          name: member.getSymbol()?.getName(),
          type: member.getType().getText()
        }
      );
    } else if (kind === SyntaxKind.MethodSignature) {
      return createASTNode(
        this.generateNodeId('method'),
        ASTNodeKind.METHOD,
        location,
        {
          name: member.getSymbol()?.getName(),
          returnType: member.getType().getText()
        }
      );
    }

    return null;
  }

  /**
   * Process constructor
   */
  private processConstructor(node: ConstructorDeclaration, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('constructor'),
      ASTNodeKind.CONSTRUCTOR,
      location,
      {
        name: 'constructor',
        modifiers: this.getModifiers(node),
        parameters: this.getParameters(node)
      }
    );
  }

  /**
   * Process method
   */
  private processMethod(node: MethodDeclaration, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('method'),
      ASTNodeKind.METHOD,
      location,
      {
        name: node.getName(),
        modifiers: this.getModifiers(node),
        isAsync: node.isAsync(),
        isGenerator: node.isGenerator(),
        parameters: this.getParameters(node),
        returnType: node.getReturnType().getText()
      }
    );
  }

  /**
   * Process property
   */
  private processProperty(node: PropertyDeclaration, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());

    return createASTNode(
      this.generateNodeId('property'),
      ASTNodeKind.PROPERTY,
      location,
      {
        name: node.getName(),
        modifiers: this.getModifiers(node),
        type: node.getType().getText(),
        initializer: node.getInitializer()?.getText()
      }
    );
  }

  /**
   * Process accessor (getter/setter)
   */
  private processAccessor(node: TSNode, sourceFile: SourceFile): ASTNode {
    const location = this.getNodeLocation(node, sourceFile.getFilePath());
    const kind = node.getKind() === SyntaxKind.GetAccessor ? ASTNodeKind.GETTER : ASTNodeKind.SETTER;

    return createASTNode(
      this.generateNodeId(kind === ASTNodeKind.GETTER ? 'getter' : 'setter'),
      kind,
      location,
      {
        name: node.getSymbol()?.getName(),
        modifiers: this.getModifiers(node)
      }
    );
  }

  /**
   * Check if member should be included
   */
  private shouldIncludeMember(member: TSNode): boolean {
    if (this.options.includePrivateMembers === false) {
      const modifiers = this.getModifiers(member);
      if (modifiers.includes('private')) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get modifiers for a node
   */
  private getModifiers(node: TSNode): string[] {
    const modifiers: string[] = [];

    if ('isExported' in node && (node as any).isExported?.()) {
      modifiers.push('export');
    }
    if ('isDefaultExport' in node && (node as any).isDefaultExport?.()) {
      modifiers.push('default');
    }
    if ('isAsync' in node && (node as any).isAsync?.()) {
      modifiers.push('async');
    }
    if ('isStatic' in node && (node as any).isStatic?.()) {
      modifiers.push('static');
    }
    if ('isReadonly' in node && (node as any).isReadonly?.()) {
      modifiers.push('readonly');
    }
    if ('isAbstract' in node && (node as any).isAbstract?.()) {
      modifiers.push('abstract');
    }

    // Get visibility modifiers
    if ('getScope' in node) {
      const scope = (node as any).getScope();
      if (scope) modifiers.push(scope);
    }

    return modifiers;
  }

  /**
   * Get parameters for a function/method
   */
  private getParameters(node: TSNode): any[] {
    if ('getParameters' in node) {
      return (node as any).getParameters().map((param: any) => ({
        name: param.getName(),
        type: param.getType().getText(),
        isOptional: param.isOptional(),
        isRest: param.isRestParameter(),
        defaultValue: param.getInitializer()?.getText()
      }));
    }
    return [];
  }

  /**
   * Get source location for a node
   */
  private getNodeLocation(node: TSNode, filePath: string): SourceLocation {
    const start = node.getStart();
    const end = node.getEnd();
    const sourceFile = node.getSourceFile();

    const startPos = sourceFile.getLineAndColumnAtPos(start);
    const endPos = sourceFile.getLineAndColumnAtPos(end);

    return createSourceLocation(
      filePath,
      startPos.line,
      startPos.column,
      endPos.line,
      endPos.column,
      start,
      end
    );
  }

  /**
   * Process imports and add to AST
   */
  private processImports(sourceFile: SourceFile, ast: UnifiedAST): void {
    sourceFile.getImportDeclarations().forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const namedImports = importDecl.getNamedImports().map(n => ({
        imported: n.getName(),
        local: n.getAliasNode()?.getText()
      }));

      addImport(ast, {
        source: moduleSpecifier,
        specifiers: [
          ...namedImports,
          ...(importDecl.getDefaultImport() ? [{
            imported: 'default',
            local: importDecl.getDefaultImport()!.getText(),
            isDefault: true
          }] : []),
          ...(importDecl.getNamespaceImport() ? [{
            imported: '*',
            local: importDecl.getNamespaceImport()!.getText(),
            isNamespace: true
          }] : [])
        ],
        isTypeOnly: importDecl.isTypeOnly()
      });
    });
  }

  /**
   * Process exports and add to AST
   */
  private processExports(sourceFile: SourceFile, ast: UnifiedAST): void {
    // Process named exports
    sourceFile.getExportDeclarations().forEach(exportDecl => {
      const namedExports = exportDecl.getNamedExports();

      namedExports.forEach(namedExport => {
        addExport(ast, {
          name: namedExport.getName(),
          localName: namedExport.getAliasNode()?.getText(),
          isTypeOnly: exportDecl.isTypeOnly(),
          source: exportDecl.getModuleSpecifier()?.getText()
        });
      });
    });

    // Process default exports
    sourceFile.getExportAssignments().forEach(exportAssignment => {
      if (exportAssignment.isExportEquals()) {
        addExport(ast, {
          name: 'default',
          isDefault: true
        });
      }
    });

    // Process exported declarations
    sourceFile.forEachChild(node => {
      if ('isExported' in node && (node as any).isExported()) {
        const name = 'getName' in node ? (node as any).getName() : undefined;
        if (name) {
          addExport(ast, {
            name,
            isDefault: 'isDefaultExport' in node && (node as any).isDefaultExport()
          });
        }
      }
    });
  }

  /**
   * Add TypeScript diagnostics to AST
   */
  private addDiagnostics(sourceFile: SourceFile, ast: UnifiedAST): void {
    const diagnostics = sourceFile.getPreEmitDiagnostics();

    diagnostics.forEach(diagnostic => {
      const severity = this.getDiagnosticSeverity(diagnostic.getCategory());
      const location = diagnostic.getSourceFile()?.getLineAndColumnAtPos(diagnostic.getStart() || 0);

      const diag: Diagnostic = {
        severity,
        message: diagnostic.getMessageText().toString(),
        code: diagnostic.getCode()?.toString(),
        location: location ? {
          file: sourceFile.getFilePath(),
          line: location.line,
          column: location.column
        } : undefined
      };

      addDiagnostic(ast, diag);
    });
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
      default:
        return 'info';
    }
  }

  /**
   * Generate unique node ID
   */
  private generateNodeId(prefix: string): string {
    return `${prefix}-${this.nodeIdCounter++}-${Date.now()}`;
  }

  getName(): string {
    return 'TSASTTransformer';
  }

  getSupportedLanguage(): string {
    return 'typescript';
  }
}