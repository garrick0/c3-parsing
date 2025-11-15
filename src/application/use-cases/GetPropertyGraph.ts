/**
 * GetPropertyGraph - Use case for retrieving parsed graph
 */

import { PropertyGraph } from '../../domain/entities/PropertyGraph.js';
import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from 'c3-shared';

export class GetPropertyGraphUseCase {
  constructor(
    private parsingService: ParsingService,
    private logger: Logger
  ) {}

  async execute(codebaseId: string): Promise<PropertyGraph | undefined> {
    this.logger.info('Executing GetPropertyGraph use case', { codebaseId });

    return this.parsingService.getCachedGraph(codebaseId);
  }
}
