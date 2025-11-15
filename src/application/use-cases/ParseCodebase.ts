/**
 * ParseCodebase - Use case for parsing entire codebase
 */

import { PropertyGraph } from '../../domain/entities/PropertyGraph.js';
import { ParsingService } from '../../domain/services/ParsingService.js';
import { Logger } from '../../infrastructure/mocks/c3-shared.js';
import { ParseRequest } from '../dto/ParseRequest.dto.js';
import { GraphResponse } from '../dto/GraphResponse.dto.js';

export class ParseCodebaseUseCase {
  constructor(
    private parsingService: ParsingService,
    private logger: Logger
  ) {}

  async execute(request: ParseRequest): Promise<GraphResponse> {
    this.logger.info('Executing ParseCodebase use case', { path: request.rootPath });

    try {
      const graph = await this.parsingService.parseCodebase(request.rootPath);

      return {
        graphId: graph.id,
        nodeCount: graph.getNodeCount(),
        edgeCount: graph.getEdgeCount(),
        metadata: graph.metadata,
        success: true
      };
    } catch (error) {
      this.logger.error('Failed to parse codebase', error as Error);
      throw error;
    }
  }
}
