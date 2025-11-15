/**
 * ASTNode - Unified representation of Abstract Syntax Tree nodes
 */

import { SourceLocation } from './SourceLocation.js';

export enum ASTNodeKind {
  // File/Module level
  SOURCE_FILE = 'SourceFile',
  MODULE = 'Module',

  // Declarations
  CLASS_DECLARATION = 'ClassDeclaration',
  INTERFACE_DECLARATION = 'InterfaceDeclaration',
  FUNCTION_DECLARATION = 'FunctionDeclaration',
  VARIABLE_DECLARATION = 'VariableDeclaration',
  TYPE_ALIAS = 'TypeAlias',
  ENUM_DECLARATION = 'EnumDeclaration',

  // Class members
  CONSTRUCTOR = 'Constructor',
  METHOD = 'Method',
  PROPERTY = 'Property',
  GETTER = 'Getter',
  SETTER = 'Setter',

  // Statements
  BLOCK_STATEMENT = 'BlockStatement',
  EXPRESSION_STATEMENT = 'ExpressionStatement',
  RETURN_STATEMENT = 'ReturnStatement',
  IF_STATEMENT = 'IfStatement',
  FOR_STATEMENT = 'ForStatement',
  WHILE_STATEMENT = 'WhileStatement',

  // Expressions
  CALL_EXPRESSION = 'CallExpression',
  MEMBER_EXPRESSION = 'MemberExpression',
  IDENTIFIER = 'Identifier',
  LITERAL = 'Literal',
  BINARY_EXPRESSION = 'BinaryExpression',
  ASSIGNMENT_EXPRESSION = 'AssignmentExpression',

  // Import/Export
  IMPORT_DECLARATION = 'ImportDeclaration',
  EXPORT_DECLARATION = 'ExportDeclaration',
  IMPORT_SPECIFIER = 'ImportSpecifier',
  EXPORT_SPECIFIER = 'ExportSpecifier',

  // Types
  TYPE_REFERENCE = 'TypeReference',
  TYPE_PARAMETER = 'TypeParameter',

  // Special
  ERROR = 'Error',
  UNKNOWN = 'Unknown'
}

export interface ASTNode {
  id: string;
  kind: ASTNodeKind;
  text?: string;
  children: ASTNode[];
  location: SourceLocation;
  metadata: ASTNodeMetadata;
  parent?: ASTNode;
}

export interface ASTNodeMetadata {
  // Common metadata
  name?: string;
  modifiers?: string[];
  decorators?: string[];
  leadingComments?: Comment[];
  trailingComments?: Comment[];

  // Type information
  type?: string;
  returnType?: string;
  parameters?: Parameter[];

  // Import/Export specific
  moduleSpecifier?: string;
  isDefault?: boolean;
  isNamespace?: boolean;

  // Class/Interface specific
  extends?: string[];
  implements?: string[];
  isAbstract?: boolean;

  // Function specific
  isAsync?: boolean;
  isGenerator?: boolean;

  // Variable specific
  isConst?: boolean;
  isLet?: boolean;
  initializer?: string;

  // Additional language-specific metadata
  [key: string]: any;
}

export interface Parameter {
  name: string;
  type?: string;
  isOptional?: boolean;
  isRest?: boolean;
  defaultValue?: string;
}

export interface Comment {
  type: 'line' | 'block' | 'jsdoc';
  text: string;
  location: SourceLocation;
}

/**
 * Create an AST node
 */
export function createASTNode(
  id: string,
  kind: ASTNodeKind,
  location: SourceLocation,
  metadata: ASTNodeMetadata = {},
  text?: string
): ASTNode {
  return {
    id,
    kind,
    text,
    children: [],
    location,
    metadata
  };
}

/**
 * Add a child node to a parent
 */
export function addChild(parent: ASTNode, child: ASTNode): void {
  parent.children.push(child);
  child.parent = parent;
}

/**
 * Find nodes by kind
 */
export function findNodesByKind(
  root: ASTNode,
  kind: ASTNodeKind
): ASTNode[] {
  const results: ASTNode[] = [];

  function traverse(node: ASTNode): void {
    if (node.kind === kind) {
      results.push(node);
    }
    node.children.forEach(traverse);
  }

  traverse(root);
  return results;
}

/**
 * Get the first ancestor of a specific kind
 */
export function getAncestorOfKind(
  node: ASTNode,
  kind: ASTNodeKind
): ASTNode | undefined {
  let current = node.parent;

  while (current) {
    if (current.kind === kind) {
      return current;
    }
    current = current.parent;
  }

  return undefined;
}

/**
 * Check if node represents a declaration
 */
export function isDeclaration(node: ASTNode): boolean {
  const declarationKinds = [
    ASTNodeKind.CLASS_DECLARATION,
    ASTNodeKind.INTERFACE_DECLARATION,
    ASTNodeKind.FUNCTION_DECLARATION,
    ASTNodeKind.VARIABLE_DECLARATION,
    ASTNodeKind.TYPE_ALIAS,
    ASTNodeKind.ENUM_DECLARATION
  ];

  return declarationKinds.includes(node.kind);
}

/**
 * Get the name of a node if it has one
 */
export function getNodeName(node: ASTNode): string | undefined {
  return node.metadata.name || node.text;
}