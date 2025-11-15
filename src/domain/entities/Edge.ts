/**
 * Edge - Represents a relationship between nodes
 */

import { Entity } from '../../infrastructure/mocks/c3-shared.js';
import { EdgeType } from '../value-objects/EdgeType.js';

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
    public readonly metadata: EdgeMetadata = {}
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
}
