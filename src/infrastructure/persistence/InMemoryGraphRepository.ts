/**
 * InMemoryGraphRepository - In-memory implementation of GraphRepository
 */

import { GraphRepository } from '../../domain/ports/GraphRepository.js';
import { PropertyGraph } from '../../domain/entities/PropertyGraph.js';

export class InMemoryGraphRepository implements GraphRepository {
  private graphs: Map<string, PropertyGraph> = new Map();

  async save(graph: PropertyGraph): Promise<void> {
    this.graphs.set(graph.id, graph);
  }

  async findById(id: string): Promise<PropertyGraph | undefined> {
    return this.graphs.get(id);
  }

  async findByCodebaseId(codebaseId: string): Promise<PropertyGraph | undefined> {
    return Array.from(this.graphs.values()).find(
      g => g.metadata.codebaseId === codebaseId
    );
  }

  async delete(id: string): Promise<void> {
    this.graphs.delete(id);
  }

  async list(): Promise<PropertyGraph[]> {
    return Array.from(this.graphs.values());
  }

  async exists(id: string): Promise<boolean> {
    return this.graphs.has(id);
  }

  // Utility methods for testing
  clear(): void {
    this.graphs.clear();
  }

  size(): number {
    return this.graphs.size;
  }
}
