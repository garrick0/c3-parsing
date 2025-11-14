/**
 * ParseFile - Use case for parsing single file
 */
export class ParseFileUseCase {
    parsingService;
    logger;
    constructor(parsingService, logger) {
        this.parsingService = parsingService;
        this.logger = logger;
    }
    async execute(filePath) {
        this.logger.info('Executing ParseFile use case', { filePath });
        try {
            await this.parsingService.parseFile(filePath);
        }
        catch (error) {
            this.logger.error('Failed to parse file', error);
            throw error;
        }
    }
}
//# sourceMappingURL=ParseFile.js.map