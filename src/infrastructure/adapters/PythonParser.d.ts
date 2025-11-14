/**
 * PythonParser - Python AST parser
 */
import { Parser, ParseResult } from '../../domain/ports/Parser.js';
import { FileInfo } from '../../domain/entities/FileInfo.js';
export declare class PythonParser implements Parser {
    parse(source: string, fileInfo: FileInfo): Promise<ParseResult>;
    supports(fileInfo: FileInfo): boolean;
    getName(): string;
    getSupportedExtensions(): string[];
}
//# sourceMappingURL=PythonParser.d.ts.map