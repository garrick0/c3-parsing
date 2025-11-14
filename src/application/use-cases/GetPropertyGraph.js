/**
 * GetPropertyGraph - Use case for retrieving parsed graph
 */
export class GetPropertyGraphUseCase {
    parsingService;
    logger;
    constructor(parsingService, logger) {
        this.parsingService = parsingService;
        this.logger = logger;
    }
    async execute(codebaseId) {
        this.logger.info('Executing GetPropertyGraph use case', { codebaseId });
        return this.parsingService.getCachedGraph(codebaseId);
    }
}
//# sourceMappingURL=GetPropertyGraph.js.map