/**
 * UpdateGraph - Use case for incremental graph updates
 */

import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from 'c3-shared';

export class UpdateGraphUseCase {
  constructor(
    private parsingService: ParsingService,
    private logger: Logger
  ) {}

  async execute(graphId: string, changedFiles: string[]): Promise<void> {
    this.logger.info('Executing UpdateGraph use case', { graphId, fileCount: changedFiles.length });

    for (const file of changedFiles) {
      await this.parsingService.parseFile(file);
    }
  }
}
