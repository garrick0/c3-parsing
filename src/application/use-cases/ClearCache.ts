/**
 * ClearCache - Use case for clearing parsing cache
 */

import { GraphRepository } from '../../domain/ports/GraphRepository.js';
import { Logger } from '@garrick0/c3-shared';

export class ClearCacheUseCase {
  constructor(
    private graphRepository: GraphRepository,
    private logger: Logger
  ) {}

  async execute(): Promise<void> {
    this.logger.info('Executing ClearCache use case');
    // Stub: Would clear cache
  }
}
