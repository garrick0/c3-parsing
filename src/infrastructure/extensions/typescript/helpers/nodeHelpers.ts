/**
 * Native TypeScript API Helper Functions
 *
 * These helpers make working with TypeScript's native API easier,
 * providing convenience methods similar to ts-morph but without the overhead.
 *
 * Pattern: Similar to typescript-eslint's approach
 */

import * as ts from 'typescript';

/**
 * Get all class declarations from a source file
 */
export function getClasses(sourceFile: ts.SourceFile): ts.ClassDeclaration[] {
  const classes: ts.ClassDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      classes.push(statement);
    }
  }
  return classes;
}

/**
 * Get all interface declarations from a source file
 */
export function getInterfaces(sourceFile: ts.SourceFile): ts.InterfaceDeclaration[] {
  const interfaces: ts.InterfaceDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      interfaces.push(statement);
    }
  }
  return interfaces;
}

/**
 * Get all function declarations from a source file
 */
export function getFunctions(sourceFile: ts.SourceFile): ts.FunctionDeclaration[] {
  const functions: ts.FunctionDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      functions.push(statement);
    }
  }
  return functions;
}

/**
 * Get all type alias declarations from a source file
 */
export function getTypeAliases(sourceFile: ts.SourceFile): ts.TypeAliasDeclaration[] {
  const types: ts.TypeAliasDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isTypeAliasDeclaration(statement)) {
      types.push(statement);
    }
  }
  return types;
}

/**
 * Get all enum declarations from a source file
 */
export function getEnums(sourceFile: ts.SourceFile): ts.EnumDeclaration[] {
  const enums: ts.EnumDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isEnumDeclaration(statement)) {
      enums.push(statement);
    }
  }
  return enums;
}

/**
 * Get all variable statements from a source file
 */
export function getVariableStatements(sourceFile: ts.SourceFile): ts.VariableStatement[] {
  const variables: ts.VariableStatement[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      variables.push(statement);
    }
  }
  return variables;
}

/**
 * Get all import declarations from a source file
 */
export function getImportDeclarations(sourceFile: ts.SourceFile): ts.ImportDeclaration[] {
  const imports: ts.ImportDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      imports.push(statement);
    }
  }
  return imports;
}

/**
 * Get all export declarations from a source file
 */
export function getExportDeclarations(sourceFile: ts.SourceFile): ts.ExportDeclaration[] {
  const exports: ts.ExportDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      exports.push(statement);
    }
  }
  return exports;
}

/**
 * Get all export assignments from a source file
 */
export function getExportAssignments(sourceFile: ts.SourceFile): ts.ExportAssignment[] {
  const exports: ts.ExportAssignment[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      exports.push(statement);
    }
  }
  return exports;
}

/**
 * Check if a node has a specific modifier
 */
export function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  if (!ts.canHaveModifiers(node)) {
    return false;
  }
  const modifiers = ts.getModifiers(node);
  return modifiers?.some(mod => mod.kind === kind) ?? false;
}

/**
 * Check if a declaration is exported
 */
export function isExported(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

/**
 * Check if a declaration is abstract
 */
export function isAbstract(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.AbstractKeyword);
}

/**
 * Check if a declaration is static
 */
export function isStatic(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.StaticKeyword);
}

/**
 * Check if a declaration is async
 */
export function isAsync(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.AsyncKeyword);
}

/**
 * Check if a member is private
 */
export function isPrivate(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.PrivateKeyword);
}

/**
 * Check if a member is protected
 */
export function isProtected(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ProtectedKeyword);
}

/**
 * Check if a member is public
 */
export function isPublic(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.PublicKeyword);
}

/**
 * Check if a member is readonly
 */
export function isReadonly(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ReadonlyKeyword);
}

/**
 * Get the name of a named declaration
 */
export function getName(node: ts.NamedDeclaration, sourceFile: ts.SourceFile): string | undefined {
  if (!node.name) {
    return undefined;
  }
  return node.name.getText(sourceFile);
}

/**
 * Get extends clause from a class or interface
 */
export function getExtendsClause(
  node: ts.ClassDeclaration | ts.InterfaceDeclaration
): ts.HeritageClause | undefined {
  return node.heritageClauses?.find(
    clause => clause.token === ts.SyntaxKind.ExtendsKeyword
  );
}

/**
 * Get implements clause from a class
 */
export function getImplementsClause(
  node: ts.ClassDeclaration
): ts.HeritageClause | undefined {
  return node.heritageClauses?.find(
    clause => clause.token === ts.SyntaxKind.ImplementsKeyword
  );
}

/**
 * Get all methods from a class
 */
export function getMethods(node: ts.ClassDeclaration): ts.MethodDeclaration[] {
  return node.members.filter((member): member is ts.MethodDeclaration =>
    ts.isMethodDeclaration(member)
  );
}

/**
 * Get all properties from a class
 */
export function getProperties(node: ts.ClassDeclaration): ts.PropertyDeclaration[] {
  return node.members.filter((member): member is ts.PropertyDeclaration =>
    ts.isPropertyDeclaration(member)
  );
}

/**
 * Get constructors from a class
 */
export function getConstructors(node: ts.ClassDeclaration): ts.ConstructorDeclaration[] {
  return node.members.filter((member): member is ts.ConstructorDeclaration =>
    ts.isConstructorDeclaration(member)
  );
}

/**
 * Get all getters from a class
 */
export function getGetters(node: ts.ClassDeclaration): ts.GetAccessorDeclaration[] {
  return node.members.filter((member): member is ts.GetAccessorDeclaration =>
    ts.isGetAccessorDeclaration(member)
  );
}

/**
 * Get all setters from a class
 */
export function getSetters(node: ts.ClassDeclaration): ts.SetAccessorDeclaration[] {
  return node.members.filter((member): member is ts.SetAccessorDeclaration =>
    ts.isSetAccessorDeclaration(member)
  );
}

/**
 * Get variable declaration kind (const, let, var)
 */
export function getVariableDeclarationKind(
  statement: ts.VariableStatement
): 'const' | 'let' | 'var' {
  const flags = statement.declarationList.flags;

  if (flags & ts.NodeFlags.Const) {
    return 'const';
  } else if (flags & ts.NodeFlags.Let) {
    return 'let';
  } else {
    return 'var';
  }
}

/**
 * Visit all nodes in a tree (recursive traversal)
 */
export function visitAllNodes(
  node: ts.Node,
  visitor: (node: ts.Node) => void
): void {
  visitor(node);
  ts.forEachChild(node, child => visitAllNodes(child, visitor));
}

/**
 * Find all nodes of a specific kind
 */
export function findNodesOfKind<T extends ts.Node>(
  node: ts.Node,
  kind: ts.SyntaxKind,
  predicate?: (node: T) => boolean
): T[] {
  const results: T[] = [];

  visitAllNodes(node, n => {
    if (n.kind === kind) {
      const typedNode = n as T;
      if (!predicate || predicate(typedNode)) {
        results.push(typedNode);
      }
    }
  });

  return results;
}

/**
 * Check if a node is a named export
 */
export function isNamedExport(node: ts.Node): boolean {
  return ts.isExportDeclaration(node) && node.exportClause !== undefined;
}

/**
 * Check if a node is a default export
 */
export function isDefaultExport(node: ts.Node): boolean {
  return ts.isExportAssignment(node) && !node.isExportEquals;
}
