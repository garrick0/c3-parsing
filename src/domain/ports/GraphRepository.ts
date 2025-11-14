/**
 * GraphRepository - Interface for storing and retrieving property graphs
 */

import { PropertyGraph } from '../entities/PropertyGraph.js';

export interface GraphRepository {
  /**
   * Save a property graph
   */
  save(graph: PropertyGraph): Promise<void>;

  /**
   * Find graph by ID
   */
  findById(id: string): Promise<PropertyGraph | undefined>;

  /**
   * Find graph by codebase ID
   */
  findByCodebaseId(codebaseId: string): Promise<PropertyGraph | undefined>;

  /**
   * Delete a graph
   */
  delete(id: string): Promise<void>;

  /**
   * List all graphs
   */
  list(): Promise<PropertyGraph[]>;

  /**
   * Check if graph exists
   */
  exists(id: string): Promise<boolean>;
}
