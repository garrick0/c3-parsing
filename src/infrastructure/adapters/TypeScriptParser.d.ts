/**
 * TypeScriptParser - TypeScript/JavaScript AST parser
 */
import { Parser, ParseResult } from '../../domain/ports/Parser.js';
import { FileInfo } from '../../domain/entities/FileInfo.js';
export declare class TypeScriptParser implements Parser {
    parse(source: string, fileInfo: FileInfo): Promise<ParseResult>;
    supports(fileInfo: FileInfo): boolean;
    getName(): string;
    getSupportedExtensions(): string[];
}
//# sourceMappingURL=TypeScriptParser.d.ts.map