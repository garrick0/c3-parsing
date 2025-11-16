/**
 * GetPropertyGraph - Use case for retrieving parsed graph (v2.0.0)
 * 
 * Note: v2.0.0 uses GraphRepository for caching, not ParsingService
 */

import { PropertyGraph } from '../../domain/entities/PropertyGraph.js';
import { GraphRepository } from '../../domain/ports/GraphRepository.js';
import { Logger } from '@garrick0/c3-shared';

export class GetPropertyGraphUseCase {
  constructor(
    private graphRepository: GraphRepository,
    private logger: Logger
  ) {}

  async execute(codebaseId: string): Promise<PropertyGraph | undefined> {
    this.logger.info('Executing GetPropertyGraph use case', { codebaseId });

    try {
      return await this.graphRepository.findById(codebaseId);
    } catch (error) {
      this.logger.error('Failed to get graph', error as Error);
      return undefined;
    }
  }
}
