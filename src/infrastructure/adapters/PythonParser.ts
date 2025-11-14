/**
 * PythonParser - Python AST parser
 */

import { Parser, ParseResult } from '../../domain/ports/Parser.js';
import { FileInfo } from '../../domain/entities/FileInfo.js';

export class PythonParser implements Parser {
  async parse(source: string, fileInfo: FileInfo): Promise<ParseResult> {
    // Stub: Would use Python AST parser
    return {
      nodes: [
        { id: 'class-1', type: 'class', name: 'MockPythonClass', metadata: {} }
      ],
      edges: [],
      metadata: { language: 'python' }
    };
  }

  supports(fileInfo: FileInfo): boolean {
    return fileInfo.extension === '.py';
  }

  getName(): string {
    return 'PythonParser';
  }

  getSupportedExtensions(): string[] {
    return ['.py'];
  }
}
