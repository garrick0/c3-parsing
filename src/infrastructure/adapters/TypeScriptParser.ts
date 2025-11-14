/**
 * TypeScriptParser - TypeScript/JavaScript AST parser
 */

import { Parser, ParseResult } from '../../domain/ports/Parser.js';
import { FileInfo } from '../../domain/entities/FileInfo.js';

export class TypeScriptParser implements Parser {
  async parse(source: string, fileInfo: FileInfo): Promise<ParseResult> {
    // Stub: Would use TypeScript compiler API
    return {
      nodes: [
        { id: 'class-1', type: 'class', name: 'MockClass', metadata: {} },
        { id: 'func-1', type: 'function', name: 'mockFunction', metadata: {} }
      ],
      edges: [
        { id: 'edge-1', type: 'contains', from: 'file-1', to: 'class-1' }
      ],
      metadata: { language: 'typescript' }
    };
  }

  supports(fileInfo: FileInfo): boolean {
    const ext = fileInfo.extension;
    return ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx';
  }

  getName(): string {
    return 'TypeScriptParser';
  }

  getSupportedExtensions(): string[] {
    return ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
  }
}
