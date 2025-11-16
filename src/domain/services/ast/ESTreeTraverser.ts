/**
 * ESTreeTraverser - Utility for traversing ESTree AST
 * 
 * Based on typescript-eslint's simpleTraverse utility
 */

import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import { visitorKeys } from '@typescript-eslint/visitor-keys';

export type Visitor<TNode extends TSESTree.Node = TSESTree.Node> = (
  node: TNode,
  parent: TSESTree.Node | null
) => void | false; // Return false to skip children

/**
 * Traverse ESTree AST with visitor pattern
 * 
 * This is similar to typescript-eslint's simpleTraverse
 */
export function traverseESTree(
  node: TSESTree.Node,
  visitor: Visitor,
  parent: TSESTree.Node | null = null
): void {
  // Call visitor
  const result = visitor(node, parent);
  
  // If visitor returns false, skip children
  if (result === false) {
    return;
  }

  // Get child keys for this node type
  const keys = visitorKeys[node.type];
  
  if (!keys) {
    return;
  }

  // Visit children
  for (const key of keys) {
    const child = (node as any)[key];
    
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object' && 'type' in item) {
          traverseESTree(item, visitor, node);
        }
      }
    } else if (child && typeof child === 'object' && 'type' in child) {
      traverseESTree(child, visitor, node);
    }
  }
}

/**
 * Find all nodes of a specific type
 */
export function findNodesByType<T extends TSESTree.Node>(
  ast: TSESTree.Program,
  nodeType: AST_NODE_TYPES
): T[] {
  const nodes: T[] = [];
  
  traverseESTree(ast, (node) => {
    if (node.type === nodeType) {
      nodes.push(node as T);
    }
  });
  
  return nodes;
}

/**
 * Find first node matching predicate
 */
export function findNode(
  ast: TSESTree.Program,
  predicate: (node: TSESTree.Node) => boolean
): TSESTree.Node | null {
  let found: TSESTree.Node | null = null;
  
  traverseESTree(ast, (node) => {
    if (predicate(node)) {
      found = node;
      return false; // Stop traversal
    }
  });
  
  return found;
}

/**
 * Get all identifiers in the AST
 */
export function getAllIdentifiers(ast: TSESTree.Program): TSESTree.Identifier[] {
  return findNodesByType<TSESTree.Identifier>(ast, AST_NODE_TYPES.Identifier);
}

/**
 * Get all class declarations
 */
export function getAllClasses(ast: TSESTree.Program): TSESTree.ClassDeclaration[] {
  return findNodesByType<TSESTree.ClassDeclaration>(ast, AST_NODE_TYPES.ClassDeclaration);
}

/**
 * Get all function declarations
 */
export function getAllFunctions(ast: TSESTree.Program): TSESTree.FunctionDeclaration[] {
  return findNodesByType<TSESTree.FunctionDeclaration>(ast, AST_NODE_TYPES.FunctionDeclaration);
}

/**
 * Get all interface declarations (TypeScript-specific)
 */
export function getAllInterfaces(ast: TSESTree.Program): TSESTree.TSInterfaceDeclaration[] {
  return findNodesByType<TSESTree.TSInterfaceDeclaration>(ast, AST_NODE_TYPES.TSInterfaceDeclaration);
}

