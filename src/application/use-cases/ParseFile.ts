/**
 * ParseFile - Use case for parsing codebase (v2.0.0)
 * 
 * Note: v2.0.0 no longer supports parsing single files directly.
 * Extensions parse entire directories. This use-case now parses
 * the directory containing the file.
 */

import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from 'c3-shared';
import * as path from 'path';

export class ParseFileUseCase {
  constructor(
    private parsingService: ParsingService,
    private logger: Logger
  ) {}

  async execute(filePath: string): Promise<void> {
    this.logger.info('Executing ParseFile use case (v2.0.0)', { filePath });

    try {
      // In v2.0.0, we parse the directory containing the file
      const directory = path.dirname(filePath);
      await this.parsingService.parseCodebase(directory);
      
      this.logger.info('Parsed directory containing file', { directory, filePath });
    } catch (error) {
      this.logger.error('Failed to parse codebase', error as Error);
      throw error;
    }
  }
}
