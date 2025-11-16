/**
 * Edge - Represents a relationship between nodes
 */

import { Entity } from '@garrick0/c3-shared';
import { EdgeType } from '../value-objects/EdgeType.js';
import type { SourceMetadata } from './Node.js';

export interface EdgeMetadata {
  weight?: number;
  [key: string]: any;
}

export class Edge extends Entity<string> {
  constructor(
    id: string,
    public readonly type: EdgeType,
    public readonly fromNodeId: string,
    public readonly toNodeId: string,
    public readonly metadata: EdgeMetadata = {},
    public readonly source?: SourceMetadata    // Source tracking
  ) {
    super(id);
  }

  /**
   * Get edge weight
   */
  getWeight(): number {
    return this.metadata.weight ?? 1;
  }

  /**
   * Check if edge represents a dependency
   */
  isDependency(): boolean {
    return this.type === EdgeType.DEPENDS_ON;
  }

  /**
   * Check if edge represents an import
   */
  isImport(): boolean {
    return this.type === EdgeType.IMPORTS;
  }

  /**
   * Check if edge represents containment
   */
  isContains(): boolean {
    return this.type === EdgeType.CONTAINS;
  }

  /**
   * Check if edge represents a call
   */
  isCalls(): boolean {
    return this.type === EdgeType.CALLS;
  }

  /**
   * Get display label
   */
  getDisplayLabel(): string {
    return this.type;
  }

  /**
   * Check if edge was created by specific domain
   */
  isFromDomain(domain: string): boolean {
    return this.source?.domain === domain;
  }

  /**
   * Get source domain
   */
  getSourceDomain(): string | undefined {
    return this.source?.domain;
  }
}
