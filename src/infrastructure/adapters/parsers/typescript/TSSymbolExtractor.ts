/**
 * TSSymbolExtractor - Extracts symbols from TypeScript AST
 */

import {
  SourceFile,
  ClassDeclaration,
  InterfaceDeclaration,
  FunctionDeclaration,
  VariableDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  ImportDeclaration,
  ExportDeclaration,
  SyntaxKind,
  VariableDeclarationKind,
  Node as TSNode
} from 'ts-morph';

import {
  SymbolExtractor,
  ExtractedSymbols,
  ClassSymbol,
  InterfaceSymbol,
  FunctionSymbol,
  VariableSymbol,
  TypeSymbol,
  EnumSymbol,
  ImportSymbol,
  ExportSymbol,
  ParameterSymbol
} from '../../../../domain/ports/SymbolExtractor.js';
import { Symbol, SymbolKind } from '../../../../domain/entities/ast/UnifiedAST.js';
import { createSourceLocation } from '../../../../domain/entities/ast/SourceLocation.js';

export class TSSymbolExtractor {
  private symbolIdCounter = 0;

  /**
   * Extract all symbols from a TypeScript source file
   */
  async extractSymbols(sourceFile: SourceFile): Promise<ExtractedSymbols> {
    const symbols: ExtractedSymbols = {
      classes: [],
      interfaces: [],
      functions: [],
      variables: [],
      types: [],
      enums: [],
      imports: [],
      exports: []
    };

    // Extract classes
    sourceFile.getClasses().forEach(cls => {
      const classSymbol = this.extractClassSymbol(cls);
      if (classSymbol) {
        symbols.classes.push(classSymbol);
      }
    });

    // Extract interfaces
    sourceFile.getInterfaces().forEach(iface => {
      const interfaceSymbol = this.extractInterfaceSymbol(iface);
      if (interfaceSymbol) {
        symbols.interfaces.push(interfaceSymbol);
      }
    });

    // Extract functions
    sourceFile.getFunctions().forEach(func => {
      const functionSymbol = this.extractFunctionSymbol(func);
      if (functionSymbol) {
        symbols.functions.push(functionSymbol);
      }
    });

    // Extract variables
    sourceFile.getVariableDeclarations().forEach(varDecl => {
      const variableSymbol = this.extractVariableSymbol(varDecl);
      if (variableSymbol) {
        symbols.variables.push(variableSymbol);
      }
    });

    // Extract type aliases
    sourceFile.getTypeAliases().forEach(typeAlias => {
      const typeSymbol = this.extractTypeSymbol(typeAlias);
      if (typeSymbol) {
        symbols.types.push(typeSymbol);
      }
    });

    // Extract enums
    sourceFile.getEnums().forEach(enumDecl => {
      const enumSymbol = this.extractEnumSymbol(enumDecl);
      if (enumSymbol) {
        symbols.enums.push(enumSymbol);
      }
    });

    // Extract imports
    sourceFile.getImportDeclarations().forEach(importDecl => {
      const importSymbol = this.extractImportSymbol(importDecl);
      if (importSymbol) {
        symbols.imports.push(importSymbol);
      }
    });

    // Extract exports
    this.extractExports(sourceFile, symbols);

    return symbols;
  }

  /**
   * Extract symbols from a specific AST node
   */
  async extractFromNode(node: any): Promise<Symbol[]> {
    const symbols: Symbol[] = [];

    // Handle different node types
    if (node.getKind) {
      const kind = node.getKind();

      switch (kind) {
        case SyntaxKind.ClassDeclaration:
          const classSymbol = this.extractClassSymbol(node as ClassDeclaration);
          if (classSymbol) symbols.push(classSymbol);
          break;

        case SyntaxKind.FunctionDeclaration:
          const funcSymbol = this.extractFunctionSymbol(node as FunctionDeclaration);
          if (funcSymbol) symbols.push(funcSymbol);
          break;

        case SyntaxKind.InterfaceDeclaration:
          const ifaceSymbol = this.extractInterfaceSymbol(node as InterfaceDeclaration);
          if (ifaceSymbol) symbols.push(ifaceSymbol);
          break;

        // Add more cases as needed
      }
    }

    return symbols;
  }

  /**
   * Extract class symbol
   */
  private extractClassSymbol(cls: ClassDeclaration): ClassSymbol | null {
    const name = cls.getName();
    if (!name) return null;

    const members: Symbol[] = [];

    // Extract class members
    cls.getMembers().forEach(member => {
      const memberSymbol = this.extractClassMemberSymbol(member);
      if (memberSymbol) {
        members.push(memberSymbol);
      }
    });

    return {
      id: this.generateSymbolId('class'),
      name,
      kind: SymbolKind.CLASS,
      nodeId: `class-${name}`,
      visibility: this.getVisibility(cls),
      isExported: cls.isExported(),
      isAbstract: cls.isAbstract(),
      extends: cls.getExtends()?.getText(),
      implements: cls.getImplements().map(i => i.getText()),
      members,
      type: cls.getType().getText()
    };
  }

  /**
   * Extract interface symbol
   */
  private extractInterfaceSymbol(iface: InterfaceDeclaration): InterfaceSymbol | null {
    const name = iface.getName();

    const members: Symbol[] = [];

    // Extract interface members
    iface.getMembers().forEach(member => {
      const memberSymbol = this.extractInterfaceMemberSymbol(member);
      if (memberSymbol) {
        members.push(memberSymbol);
      }
    });

    return {
      id: this.generateSymbolId('interface'),
      name,
      kind: SymbolKind.INTERFACE,
      nodeId: `interface-${name}`,
      visibility: this.getVisibility(iface),
      isExported: iface.isExported(),
      extends: iface.getExtends().map(e => e.getText()),
      members,
      type: iface.getType().getText()
    };
  }

  /**
   * Extract function symbol
   */
  private extractFunctionSymbol(func: FunctionDeclaration): FunctionSymbol | null {
    const name = func.getName();
    if (!name) return null;

    const parameters = this.extractParameters(func);

    return {
      id: this.generateSymbolId('function'),
      name,
      kind: SymbolKind.FUNCTION,
      nodeId: `function-${name}`,
      visibility: this.getVisibility(func),
      isExported: func.isExported(),
      isAsync: func.isAsync(),
      isGenerator: func.isGenerator(),
      parameters,
      returnType: func.getReturnType().getText(),
      type: func.getType().getText()
    };
  }

  /**
   * Extract variable symbol
   */
  private extractVariableSymbol(varDecl: VariableDeclaration): VariableSymbol | null {
    const name = varDecl.getName();

    const statement = varDecl.getVariableStatement();
    const declarationKind = statement?.getDeclarationKind();
    const isConst = declarationKind === VariableDeclarationKind.Const;
    const isLet = declarationKind === VariableDeclarationKind.Let;

    return {
      id: this.generateSymbolId('variable'),
      name,
      kind: isConst ? SymbolKind.CONSTANT : SymbolKind.VARIABLE,
      nodeId: `variable-${name}`,
      visibility: statement ? this.getVisibility(statement) : 'public',
      isExported: statement?.isExported() || false,
      isConst,
      isLet,
      initializer: varDecl.getInitializer()?.getText(),
      type: varDecl.getType().getText()
    };
  }

  /**
   * Extract type alias symbol
   */
  private extractTypeSymbol(typeAlias: TypeAliasDeclaration): TypeSymbol | null {
    const name = typeAlias.getName();

    return {
      id: this.generateSymbolId('type'),
      name,
      kind: SymbolKind.TYPE,
      nodeId: `type-${name}`,
      visibility: this.getVisibility(typeAlias),
      isExported: typeAlias.isExported(),
      aliasedType: typeAlias.getTypeNode()?.getText(),
      type: typeAlias.getType().getText()
    };
  }

  /**
   * Extract enum symbol
   */
  private extractEnumSymbol(enumDecl: EnumDeclaration): EnumSymbol | null {
    const name = enumDecl.getName();

    const members = enumDecl.getMembers().map(member => ({
      name: member.getName(),
      value: member.getValue()
    }));

    return {
      id: this.generateSymbolId('enum'),
      name,
      kind: SymbolKind.ENUM,
      nodeId: `enum-${name}`,
      visibility: this.getVisibility(enumDecl),
      isExported: enumDecl.isExported(),
      members,
      type: enumDecl.getType().getText()
    };
  }

  /**
   * Extract import symbol
   */
  private extractImportSymbol(importDecl: ImportDeclaration): ImportSymbol {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    const specifiers = [
      // Named imports
      ...importDecl.getNamedImports().map(named => ({
        imported: named.getName(),
        local: named.getAliasNode()?.getText()
      })),
      // Default import
      ...(importDecl.getDefaultImport() ? [{
        imported: 'default',
        local: importDecl.getDefaultImport()!.getText(),
        isDefault: true
      }] : []),
      // Namespace import
      ...(importDecl.getNamespaceImport() ? [{
        imported: '*',
        local: importDecl.getNamespaceImport()!.getText(),
        isNamespace: true
      }] : [])
    ];

    return {
      source: moduleSpecifier,
      specifiers,
      isTypeOnly: importDecl.isTypeOnly()
    };
  }

  /**
   * Extract exports from source file
   */
  private extractExports(sourceFile: SourceFile, symbols: ExtractedSymbols): void {
    // Named exports
    sourceFile.getExportDeclarations().forEach(exportDecl => {
      exportDecl.getNamedExports().forEach(namedExport => {
        symbols.exports.push({
          name: namedExport.getName(),
          localName: namedExport.getAliasNode()?.getText(),
          isTypeOnly: exportDecl.isTypeOnly(),
          source: exportDecl.getModuleSpecifier()?.getText()
        });
      });
    });

    // Default exports
    sourceFile.getExportAssignments().forEach(exportAssignment => {
      if (exportAssignment.isExportEquals()) {
        symbols.exports.push({
          name: 'default',
          isDefault: true
        });
      }
    });

    // Exported declarations
    sourceFile.forEachChild(node => {
      if ('isExported' in node && (node as any).isExported()) {
        const name = 'getName' in node ? (node as any).getName() : undefined;
        if (name && !symbols.exports.find(e => e.name === name)) {
          symbols.exports.push({
            name,
            isDefault: 'isDefaultExport' in node && (node as any).isDefaultExport()
          });
        }
      }
    });
  }

  /**
   * Extract class member symbol
   */
  private extractClassMemberSymbol(member: TSNode): Symbol | null {
    const kind = member.getKind();

    switch (kind) {
      case SyntaxKind.Constructor:
        return {
          id: this.generateSymbolId('constructor'),
          name: 'constructor',
          kind: SymbolKind.CONSTRUCTOR,
          nodeId: 'constructor',
          visibility: this.getVisibility(member)
        };

      case SyntaxKind.MethodDeclaration:
        const method = member as MethodDeclaration;
        return {
          id: this.generateSymbolId('method'),
          name: method.getName(),
          kind: SymbolKind.METHOD,
          nodeId: `method-${method.getName()}`,
          visibility: this.getVisibility(method),
          type: method.getReturnType().getText()
        };

      case SyntaxKind.PropertyDeclaration:
        const property = member as PropertyDeclaration;
        return {
          id: this.generateSymbolId('property'),
          name: property.getName(),
          kind: SymbolKind.PROPERTY,
          nodeId: `property-${property.getName()}`,
          visibility: this.getVisibility(property),
          type: property.getType().getText()
        };

      case SyntaxKind.GetAccessor:
        return {
          id: this.generateSymbolId('getter'),
          name: member.getSymbol()?.getName() || 'getter',
          kind: SymbolKind.GETTER,
          nodeId: 'getter',
          visibility: this.getVisibility(member)
        };

      case SyntaxKind.SetAccessor:
        return {
          id: this.generateSymbolId('setter'),
          name: member.getSymbol()?.getName() || 'setter',
          kind: SymbolKind.SETTER,
          nodeId: 'setter',
          visibility: this.getVisibility(member)
        };

      default:
        return null;
    }
  }

  /**
   * Extract interface member symbol
   */
  private extractInterfaceMemberSymbol(member: TSNode): Symbol | null {
    const name = member.getSymbol()?.getName();
    if (!name) return null;

    const kind = member.getKind();

    if (kind === SyntaxKind.PropertySignature) {
      return {
        id: this.generateSymbolId('property'),
        name,
        kind: SymbolKind.PROPERTY,
        nodeId: `property-${name}`,
        type: member.getType().getText()
      };
    } else if (kind === SyntaxKind.MethodSignature) {
      return {
        id: this.generateSymbolId('method'),
        name,
        kind: SymbolKind.METHOD,
        nodeId: `method-${name}`,
        type: member.getType().getText()
      };
    }

    return null;
  }

  /**
   * Extract function/method parameters
   */
  private extractParameters(func: FunctionDeclaration | MethodDeclaration): ParameterSymbol[] {
    return func.getParameters().map(param => ({
      name: param.getName(),
      type: param.getType().getText(),
      isOptional: param.isOptional(),
      isRest: param.isRestParameter(),
      defaultValue: param.getInitializer()?.getText()
    }));
  }

  /**
   * Get visibility modifier
   */
  private getVisibility(node: TSNode): 'public' | 'private' | 'protected' {
    if ('getScope' in node) {
      const scope = (node as any).getScope();
      if (scope === 'private') return 'private';
      if (scope === 'protected') return 'protected';
    }

    // Check modifiers
    if ('getModifiers' in node) {
      const modifiers = (node as any).getModifiers();
      if (modifiers) {
        for (const mod of modifiers) {
          const text = mod.getText();
          if (text === 'private') return 'private';
          if (text === 'protected') return 'protected';
        }
      }
    }

    return 'public';
  }

  /**
   * Generate unique symbol ID
   */
  private generateSymbolId(prefix: string): string {
    return `symbol-${prefix}-${this.symbolIdCounter++}`;
  }
}