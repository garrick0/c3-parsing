/**
 * InMemoryGraphRepository - In-memory implementation of GraphRepository
 */
import { GraphRepository } from '../../domain/ports/GraphRepository.js';
import { PropertyGraph } from '../../domain/entities/PropertyGraph.js';
export declare class InMemoryGraphRepository implements GraphRepository {
    private graphs;
    save(graph: PropertyGraph): Promise<void>;
    findById(id: string): Promise<PropertyGraph | undefined>;
    findByCodebaseId(codebaseId: string): Promise<PropertyGraph | undefined>;
    delete(id: string): Promise<void>;
    list(): Promise<PropertyGraph[]>;
    exists(id: string): Promise<boolean>;
    clear(): void;
    size(): number;
}
//# sourceMappingURL=InMemoryGraphRepository.d.ts.map