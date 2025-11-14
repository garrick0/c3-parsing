/**
 * ParseCodebase - Use case for parsing entire codebase
 */
export class ParseCodebaseUseCase {
    parsingService;
    logger;
    constructor(parsingService, logger) {
        this.parsingService = parsingService;
        this.logger = logger;
    }
    async execute(request) {
        this.logger.info('Executing ParseCodebase use case', { path: request.rootPath });
        try {
            const graph = await this.parsingService.parseCodebase(request.rootPath);
            return {
                graphId: graph.id,
                nodeCount: graph.getNodeCount(),
                edgeCount: graph.getEdgeCount(),
                metadata: graph.metadata,
                success: true
            };
        }
        catch (error) {
            this.logger.error('Failed to parse codebase', error);
            throw error;
        }
    }
}
//# sourceMappingURL=ParseCodebase.js.map