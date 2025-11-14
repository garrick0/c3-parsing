/**
 * FileResponse DTO
 */

export interface FileResponse {
  filePath: string;
  parsed: boolean;
  nodeCount: number;
  error?: string;
}
