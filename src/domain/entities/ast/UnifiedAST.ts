/**
 * UnifiedAST - Language-agnostic AST representation
 */

import { ASTNode } from './ASTNode.js';
import { Language } from '../../value-objects/Language.js';

export interface UnifiedAST {
  root: ASTNode;
  language: Language;
  sourceFile: string;
  version: string;
  diagnostics: Diagnostic[];
  symbols: Map<string, Symbol>;
  imports: ImportInfo[];
  exports: ExportInfo[];
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
}

export interface Symbol {
  id: string;
  name: string;
  kind: SymbolKind;
  nodeId: string;
  visibility?: 'public' | 'private' | 'protected';
  isExported?: boolean;
  type?: string;
}

export enum SymbolKind {
  CLASS = 'class',
  INTERFACE = 'interface',
  FUNCTION = 'function',
  VARIABLE = 'variable',
  CONSTANT = 'constant',
  ENUM = 'enum',
  TYPE = 'type',
  METHOD = 'method',
  PROPERTY = 'property',
  PARAMETER = 'parameter',
  CONSTRUCTOR = 'constructor',
  GETTER = 'getter',
  SETTER = 'setter'
}

export interface ImportInfo {
  source: string;
  specifiers: ImportSpecifier[];
  isTypeOnly?: boolean;
}

export interface ImportSpecifier {
  imported: string;
  local?: string;
  isDefault?: boolean;
  isNamespace?: boolean;
}

export interface ExportInfo {
  name: string;
  localName?: string;
  isDefault?: boolean;
  isTypeOnly?: boolean;
  source?: string; // For re-exports
}

/**
 * Create a unified AST
 */
export function createUnifiedAST(
  root: ASTNode,
  language: Language,
  sourceFile: string
): UnifiedAST {
  return {
    root,
    language,
    sourceFile,
    version: '1.0.0',
    diagnostics: [],
    symbols: new Map(),
    imports: [],
    exports: []
  };
}

/**
 * Add a diagnostic to the AST
 */
export function addDiagnostic(
  ast: UnifiedAST,
  diagnostic: Diagnostic
): void {
  ast.diagnostics.push(diagnostic);
}

/**
 * Register a symbol in the AST
 */
export function registerSymbol(
  ast: UnifiedAST,
  symbol: Symbol
): void {
  ast.symbols.set(symbol.name, symbol);
}

/**
 * Add import information
 */
export function addImport(
  ast: UnifiedAST,
  importInfo: ImportInfo
): void {
  ast.imports.push(importInfo);
}

/**
 * Add export information
 */
export function addExport(
  ast: UnifiedAST,
  exportInfo: ExportInfo
): void {
  ast.exports.push(exportInfo);
}

/**
 * Get all symbols of a specific kind
 */
export function getSymbolsByKind(
  ast: UnifiedAST,
  kind: SymbolKind
): Symbol[] {
  return Array.from(ast.symbols.values()).filter(s => s.kind === kind);
}

/**
 * Check if AST has errors
 */
export function hasErrors(ast: UnifiedAST): boolean {
  return ast.diagnostics.some(d => d.severity === 'error');
}

/**
 * Get error diagnostics
 */
export function getErrors(ast: UnifiedAST): Diagnostic[] {
  return ast.diagnostics.filter(d => d.severity === 'error');
}

/**
 * Count total nodes in AST
 */
export function countNodes(ast: UnifiedAST): number {
  let count = 0;

  function traverse(node: ASTNode): void {
    count++;
    node.children.forEach(traverse);
  }

  traverse(ast.root);
  return count;
}