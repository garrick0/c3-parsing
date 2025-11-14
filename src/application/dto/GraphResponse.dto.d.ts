/**
 * GraphResponse DTO
 */
import { GraphMetadata } from '../../domain/entities/PropertyGraph.js';
export interface GraphResponse {
    graphId: string;
    nodeCount: number;
    edgeCount: number;
    metadata: GraphMetadata;
    success: boolean;
    error?: string;
}
//# sourceMappingURL=GraphResponse.dto.d.ts.map