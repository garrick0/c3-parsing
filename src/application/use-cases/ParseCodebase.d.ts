/**
 * ParseCodebase - Use case for parsing entire codebase
 */
import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from 'c3-shared';
import { ParseRequest } from '../dto/ParseRequest.dto.js';
import { GraphResponse } from '../dto/GraphResponse.dto.js';
export declare class ParseCodebaseUseCase {
    private parsingService;
    private logger;
    constructor(parsingService: ParsingService, logger: Logger);
    execute(request: ParseRequest): Promise<GraphResponse>;
}
//# sourceMappingURL=ParseCodebase.d.ts.map