/**
 * TSSymbolExtractor - Extracts symbols from TypeScript AST
 *
 * REFACTORED: Now uses native TypeScript API instead of ts-morph
 * Pattern: Uses TypeChecker for accurate symbol information
 *
 * This allows us to work with shared Programs from Project Service.
 */

import * as ts from 'typescript';
import { Symbol, SymbolKind } from '../../../../domain/entities/ast/UnifiedAST.js';
import { ExtractedSymbols } from '../../../../domain/ports/SymbolExtractor.js';
import * as helpers from './helpers/nodeHelpers.js';

/**
 * Extracts symbols from TypeScript source files using native API
 */
export class TSSymbolExtractor {
  /**
   * Extract all symbols from a source file
   *
   * @param sourceFile - Native TypeScript SourceFile
   * @param program - TypeScript Program (provides TypeChecker)
   */
  async extractSymbols(
    sourceFile: ts.SourceFile,
    program: ts.Program
  ): Promise<ExtractedSymbols> {
    const typeChecker = program.getTypeChecker();

    const symbols: ExtractedSymbols = {
      classes: [],
      interfaces: [],
      functions: [],
      variables: [],
      types: [],
      enums: [],
      imports: [],
      exports: [],
    };

    // Extract classes
    const classes = helpers.getClasses(sourceFile);
    for (const cls of classes) {
      const symbol = this.extractClassSymbol(cls, sourceFile, typeChecker);
      if (symbol) {
        symbols.classes.push(symbol);
      }
    }

    // Extract interfaces
    const interfaces = helpers.getInterfaces(sourceFile);
    for (const iface of interfaces) {
      const symbol = this.extractInterfaceSymbol(iface, sourceFile, typeChecker);
      if (symbol) {
        symbols.interfaces.push(symbol);
      }
    }

    // Extract functions
    const functions = helpers.getFunctions(sourceFile);
    for (const fn of functions) {
      const symbol = this.extractFunctionSymbol(fn, sourceFile, typeChecker);
      if (symbol) {
        symbols.functions.push(symbol);
      }
    }

    // Extract type aliases
    const typeAliases = helpers.getTypeAliases(sourceFile);
    for (const typeAlias of typeAliases) {
      const symbol = this.extractTypeAliasSymbol(typeAlias, sourceFile, typeChecker);
      if (symbol) {
        symbols.types.push(symbol);
      }
    }

    // Extract enums
    const enums = helpers.getEnums(sourceFile);
    for (const enumDecl of enums) {
      const symbol = this.extractEnumSymbol(enumDecl, sourceFile, typeChecker);
      if (symbol) {
        symbols.enums.push(symbol);
      }
    }

    // Extract variables
    const variables = helpers.getVariableStatements(sourceFile);
    for (const varStmt of variables) {
      const extractedVars = this.extractVariableSymbols(varStmt, sourceFile, typeChecker);
      symbols.variables.push(...extractedVars);
    }

    return symbols;
  }

  /**
   * Extract class symbol
   */
  private extractClassSymbol(
    node: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ): Symbol | null {
    if (!node.name) {
      return null;
    }

    const name = node.name.getText(sourceFile);
    const tsSymbol = typeChecker.getSymbolAtLocation(node.name);

    if (!tsSymbol) {
      return null;
    }

    const type = typeChecker.getTypeAtLocation(node);

    return {
      id: `symbol-${name}-${Date.now()}`,
      name,
      kind: SymbolKind.CLASS,
      nodeId: `node-${name}`,
      isExported: helpers.isExported(node),
      type: typeChecker.typeToString(type),
    };
  }

  /**
   * Extract interface symbol
   */
  private extractInterfaceSymbol(
    node: ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ): Symbol | null {
    const name = node.name.getText(sourceFile);
    const tsSymbol = typeChecker.getSymbolAtLocation(node.name);

    if (!tsSymbol) {
      return null;
    }

    const type = typeChecker.getTypeAtLocation(node);

    return {
      id: `symbol-${name}-${Date.now()}`,
      name,
      kind: SymbolKind.INTERFACE,
      nodeId: `node-${name}`,
      isExported: helpers.isExported(node),
      type: typeChecker.typeToString(type),
    };
  }

  /**
   * Extract function symbol
   */
  private extractFunctionSymbol(
    node: ts.FunctionDeclaration,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ): Symbol | null {
    if (!node.name) {
      return null;
    }

    const name = node.name.getText(sourceFile);
    const tsSymbol = typeChecker.getSymbolAtLocation(node.name);

    if (!tsSymbol) {
      return null;
    }

    const signature = typeChecker.getSignatureFromDeclaration(node);
    const type = signature
      ? typeChecker.getReturnTypeOfSignature(signature)
      : typeChecker.getTypeAtLocation(node);

    return {
      id: `symbol-${name}-${Date.now()}`,
      name,
      kind: SymbolKind.FUNCTION,
      nodeId: `node-${name}`,
      isExported: helpers.isExported(node),
      type: typeChecker.typeToString(type),
    };
  }

  /**
   * Extract type alias symbol
   */
  private extractTypeAliasSymbol(
    node: ts.TypeAliasDeclaration,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ): Symbol | null {
    const name = node.name.getText(sourceFile);
    const tsSymbol = typeChecker.getSymbolAtLocation(node.name);

    if (!tsSymbol) {
      return null;
    }

    const type = typeChecker.getTypeAtLocation(node);

    return {
      id: `symbol-${name}-${Date.now()}`,
      name,
      kind: SymbolKind.TYPE,
      nodeId: `node-${name}`,
      isExported: helpers.isExported(node),
      type: typeChecker.typeToString(type),
    };
  }

  /**
   * Extract enum symbol
   */
  private extractEnumSymbol(
    node: ts.EnumDeclaration,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ): Symbol | null {
    const name = node.name.getText(sourceFile);
    const tsSymbol = typeChecker.getSymbolAtLocation(node.name);

    if (!tsSymbol) {
      return null;
    }

    const type = typeChecker.getTypeAtLocation(node);

    return {
      id: `symbol-${name}-${Date.now()}`,
      name,
      kind: SymbolKind.ENUM,
      nodeId: `node-${name}`,
      isExported: helpers.isExported(node),
      type: typeChecker.typeToString(type),
    };
  }

  /**
   * Extract variable symbols
   */
  private extractVariableSymbols(
    node: ts.VariableStatement,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ): Symbol[] {
    const symbols: Symbol[] = [];

    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) {
        // Skip destructuring patterns for now
        continue;
      }

      const name = declaration.name.getText(sourceFile);
      const tsSymbol = typeChecker.getSymbolAtLocation(declaration.name);

      if (!tsSymbol) {
        continue;
      }

      const type = typeChecker.getTypeAtLocation(declaration);

      symbols.push({
        id: `symbol-${name}-${Date.now()}`,
        name,
        kind: SymbolKind.VARIABLE,
        nodeId: `node-${name}`,
        isExported: helpers.isExported(node),
        type: typeChecker.typeToString(type),
      });
    }

    return symbols;
  }

  /**
   * Get start and end positions for a node
   */
  private getPosition(
    node: ts.Node,
    sourceFile: ts.SourceFile
  ): [number, number, number, number] {
    const start = node.getStart(sourceFile);
    const end = node.getEnd();

    const startPos = sourceFile.getLineAndCharacterOfPosition(start);
    const endPos = sourceFile.getLineAndCharacterOfPosition(end);

    return [
      startPos.line + 1,
      startPos.character,
      endPos.line + 1,
      endPos.character
    ];
  }
}
