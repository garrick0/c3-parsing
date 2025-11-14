/**
 * InMemoryGraphRepository - In-memory implementation of GraphRepository
 */
export class InMemoryGraphRepository {
    graphs = new Map();
    async save(graph) {
        this.graphs.set(graph.id, graph);
    }
    async findById(id) {
        return this.graphs.get(id);
    }
    async findByCodebaseId(codebaseId) {
        return Array.from(this.graphs.values()).find(g => g.metadata.codebaseId === codebaseId);
    }
    async delete(id) {
        this.graphs.delete(id);
    }
    async list() {
        return Array.from(this.graphs.values());
    }
    async exists(id) {
        return this.graphs.has(id);
    }
    // Utility methods for testing
    clear() {
        this.graphs.clear();
    }
    size() {
        return this.graphs.size;
    }
}
//# sourceMappingURL=InMemoryGraphRepository.js.map