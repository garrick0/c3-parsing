/**
 * Node - Represents a code element in the property graph
 */

import { Entity } from '../../infrastructure/mocks/c3-shared.js';
import { NodeType } from '../value-objects/NodeType.js';

export interface NodeMetadata {
  filePath: string;
  startLine?: number;
  endLine?: number;
  size?: number;
  [key: string]: any;
}

export class Node extends Entity<string> {
  constructor(
    id: string,
    public readonly type: NodeType,
    public readonly name: string,
    public readonly metadata: NodeMetadata
  ) {
    super(id);
  }

  /**
   * Get file path
   */
  getFilePath(): string {
    return this.metadata.filePath;
  }

  /**
   * Get line range
   */
  getLineRange(): { start?: number; end?: number } {
    return {
      start: this.metadata.startLine,
      end: this.metadata.endLine
    };
  }

  /**
   * Check if node represents a file
   */
  isFile(): boolean {
    return this.type === NodeType.FILE;
  }

  /**
   * Check if node represents a directory
   */
  isDirectory(): boolean {
    return this.type === NodeType.DIRECTORY;
  }

  /**
   * Check if node represents a module
   */
  isModule(): boolean {
    return this.type === NodeType.MODULE;
  }

  /**
   * Check if node represents a class
   */
  isClass(): boolean {
    return this.type === NodeType.CLASS;
  }

  /**
   * Check if node represents a function
   */
  isFunction(): boolean {
    return this.type === NodeType.FUNCTION;
  }

  /**
   * Get display name
   */
  getDisplayName(): string {
    return `${this.type}:${this.name}`;
  }
}
