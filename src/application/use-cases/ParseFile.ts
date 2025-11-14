/**
 * ParseFile - Use case for parsing single file
 */

import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from 'c3-shared';

export class ParseFileUseCase {
  constructor(
    private parsingService: ParsingService,
    private logger: Logger
  ) {}

  async execute(filePath: string): Promise<void> {
    this.logger.info('Executing ParseFile use case', { filePath });

    try {
      await this.parsingService.parseFile(filePath);
    } catch (error) {
      this.logger.error('Failed to parse file', error as Error);
      throw error;
    }
  }
}
