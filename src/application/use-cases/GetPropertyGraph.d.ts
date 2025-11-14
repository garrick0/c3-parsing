/**
 * GetPropertyGraph - Use case for retrieving parsed graph
 */
import { PropertyGraph } from '../../domain/entities/PropertyGraph.js';
import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from 'c3-shared';
export declare class GetPropertyGraphUseCase {
    private parsingService;
    private logger;
    constructor(parsingService: ParsingService, logger: Logger);
    execute(codebaseId: string): Promise<PropertyGraph | undefined>;
}
//# sourceMappingURL=GetPropertyGraph.d.ts.map