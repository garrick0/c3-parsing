/**
 * UpdateGraph - Use case for incremental graph updates (v2.0.0)
 * 
 * Note: v2.0.0 re-parses the entire codebase for updates.
 * Extensions handle their own incremental parsing internally
 * (e.g., TypeScript Project Service caches Programs).
 */

import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from '@garrick0/c3-shared';

export class UpdateGraphUseCase {
  constructor(
    private parsingService: ParsingService,
    private logger: Logger
  ) {}

  async execute(graphId: string, rootPath: string): Promise<void> {
    this.logger.info('Executing UpdateGraph use case (v2.0.0)', { 
      graphId, 
      rootPath 
    });

    try {
      // In v2.0.0, we re-parse the codebase
      // Extensions internally cache (e.g., Project Service caches Programs)
      await this.parsingService.parseCodebase(rootPath);
      
      this.logger.info('Graph updated successfully');
    } catch (error) {
      this.logger.error('Failed to update graph', error as Error);
      throw error;
    }
  }
}
