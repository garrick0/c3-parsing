/**
 * ParseFile - Use case for parsing single file
 */
import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from 'c3-shared';
export declare class ParseFileUseCase {
    private parsingService;
    private logger;
    constructor(parsingService: ParsingService, logger: Logger);
    execute(filePath: string): Promise<void>;
}
//# sourceMappingURL=ParseFile.d.ts.map