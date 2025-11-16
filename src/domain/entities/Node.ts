/**
 * Node - Represents a code element in the property graph
 */

import { Entity } from 'c3-shared';
import { NodeType } from '../value-objects/NodeType.js';

export interface NodeMetadata {
  filePath: string;
  startLine?: number;
  endLine?: number;
  size?: number;
  [key: string]: any;
}

/**
 * SourceMetadata - Tracks which extension/parser created this node
 */
export interface SourceMetadata {
  domain: string;      // 'code', 'git', 'filesystem', 'testing', etc.
  extension: string;   // Extension identifier
  version: string;     // Extension version
  timestamp?: Date;    // Creation timestamp
}

export class Node extends Entity<string> {
  constructor(
    id: string,
    public readonly type: NodeType,
    public readonly name: string,
    public readonly metadata: NodeMetadata,
    public readonly labels?: Set<string>,      // Multi-classification labels
    public readonly source?: SourceMetadata    // Source tracking
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

  /**
   * Get source domain
   */
  getSourceDomain(): string | undefined {
    return this.source?.domain;
  }

  /**
   * Get source extension
   */
  getSourceExtension(): string | undefined {
    return this.source?.extension;
  }

  /**
   * Check if node was created by specific domain
   */
  isFromDomain(domain: string): boolean {
    return this.source?.domain === domain;
  }

  /**
   * Check if node has a specific label
   */
  hasLabel(label: string): boolean {
    return this.labels?.has(label) ?? false;
  }

  /**
   * Get all labels as array
   */
  getLabels(): string[] {
    return this.labels ? Array.from(this.labels) : [];
  }

  /**
   * Check if node has any of the given labels
   */
  hasAnyLabel(labels: string[]): boolean {
    if (!this.labels) return false;
    return labels.some(label => this.labels!.has(label));
  }

  /**
   * Check if node has all of the given labels
   */
  hasAllLabels(labels: string[]): boolean {
    if (!this.labels) return false;
    return labels.every(label => this.labels!.has(label));
  }
}
