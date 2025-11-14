/**
 * FilesystemParser - Basic filesystem structure parser
 */

import { Parser, ParseResult } from '../../domain/ports/Parser.js';
import { FileInfo } from '../../domain/entities/FileInfo.js';

export class FilesystemParser implements Parser {
  async parse(source: string, fileInfo: FileInfo): Promise<ParseResult> {
    // Stub: Return mock parse result
    return {
      nodes: [
        { id: 'file-1', type: 'file', name: fileInfo.getFileName(), metadata: {} }
      ],
      edges: [],
      metadata: {}
    };
  }

  supports(fileInfo: FileInfo): boolean {
    // Supports all files for basic filesystem parsing
    return true;
  }

  getName(): string {
    return 'FilesystemParser';
  }

  getSupportedExtensions(): string[] {
    return ['*'];
  }
}
