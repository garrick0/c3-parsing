/**
 * ASTNormalizer - Normalizes and cleans AST for processing
 */

import { UnifiedAST } from '../../entities/ast/UnifiedAST.js';
import { ASTNode, ASTNodeKind } from '../../entities/ast/ASTNode.js';

export interface NormalizationOptions {
  removeComments?: boolean;
  removeWhitespace?: boolean;
  flattenBlocks?: boolean;
  simplifyExpressions?: boolean;
  removeDecorators?: boolean;
}

export class ASTNormalizer {
  constructor(
    private options: NormalizationOptions = {}
  ) {}

  /**
   * Normalize a unified AST
   */
  normalize(ast: UnifiedAST): UnifiedAST {
    const normalizedRoot = this.normalizeNode(ast.root);

    return {
      ...ast,
      root: normalizedRoot
    };
  }

  /**
   * Normalize a single node and its children
   */
  private normalizeNode(node: ASTNode): ASTNode {
    // Create a copy of the node
    const normalizedNode: ASTNode = {
      ...node,
      children: [],
      metadata: { ...node.metadata }
    };

    // Remove comments if requested
    if (this.options.removeComments) {
      delete normalizedNode.metadata.leadingComments;
      delete normalizedNode.metadata.trailingComments;
    }

    // Remove decorators if requested
    if (this.options.removeDecorators) {
      delete normalizedNode.metadata.decorators;
    }

    // Process children
    for (const child of node.children) {
      const normalizedChild = this.normalizeNode(child);

      // Skip empty block statements if flattening
      if (this.options.flattenBlocks &&
          child.kind === ASTNodeKind.BLOCK_STATEMENT &&
          child.children.length === 1) {
        // Flatten single-child blocks
        normalizedNode.children.push(...normalizedChild.children);
      } else if (this.shouldIncludeNode(normalizedChild)) {
        normalizedNode.children.push(normalizedChild);
      }
    }

    return normalizedNode;
  }

  /**
   * Determine if a node should be included in the normalized AST
   */
  private shouldIncludeNode(node: ASTNode): boolean {
    // Skip error nodes if they have no useful information
    if (node.kind === ASTNodeKind.ERROR && !node.text && node.children.length === 0) {
      return false;
    }

    // Always include other nodes
    return true;
  }

  /**
   * Remove redundant nodes from the AST
   */
  removeRedundantNodes(ast: UnifiedAST): UnifiedAST {
    const processedRoot = this.removeRedundantFromNode(ast.root);

    return {
      ...ast,
      root: processedRoot
    };
  }

  /**
   * Remove redundant nodes from a subtree
   */
  private removeRedundantFromNode(node: ASTNode): ASTNode {
    const processed: ASTNode = {
      ...node,
      children: node.children
        .map(child => this.removeRedundantFromNode(child))
        .filter(child => !this.isRedundant(child))
    };

    return processed;
  }

  /**
   * Check if a node is redundant
   */
  private isRedundant(node: ASTNode): boolean {
    // Empty expression statements are redundant
    if (node.kind === ASTNodeKind.EXPRESSION_STATEMENT &&
        node.children.length === 0 &&
        !node.text) {
      return true;
    }

    return false;
  }

  /**
   * Simplify the AST structure
   */
  simplify(ast: UnifiedAST): UnifiedAST {
    const simplifiedRoot = this.simplifyNode(ast.root);

    return {
      ...ast,
      root: simplifiedRoot
    };
  }

  /**
   * Simplify a node and its children
   */
  private simplifyNode(node: ASTNode): ASTNode {
    const simplified: ASTNode = {
      ...node,
      children: node.children.map(child => this.simplifyNode(child))
    };

    // Simplify specific patterns
    if (this.options.simplifyExpressions) {
      // Simplify nested expressions
      if (simplified.kind === ASTNodeKind.EXPRESSION_STATEMENT &&
          simplified.children.length === 1 &&
          simplified.children[0].kind === ASTNodeKind.EXPRESSION_STATEMENT) {
        return simplified.children[0];
      }
    }

    return simplified;
  }
}