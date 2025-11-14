/**
 * FilesystemParser - Basic filesystem structure parser
 */
import { Parser, ParseResult } from '../../domain/ports/Parser.js';
import { FileInfo } from '../../domain/entities/FileInfo.js';
export declare class FilesystemParser implements Parser {
    parse(source: string, fileInfo: FileInfo): Promise<ParseResult>;
    supports(fileInfo: FileInfo): boolean;
    getName(): string;
    getSupportedExtensions(): string[];
}
//# sourceMappingURL=FilesystemParser.d.ts.map