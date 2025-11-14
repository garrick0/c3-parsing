/**
 * ParsingService - Main orchestration service for parsing codebases
 */
import { PropertyGraph } from '../entities/PropertyGraph.js';
import { Parser } from '../ports/Parser.js';
import { GraphRepository } from '../ports/GraphRepository.js';
import { FileSystem } from '../ports/FileSystem.js';
import { Logger } from 'c3-shared';
export declare class ParsingService {
    private parsers;
    private graphRepository;
    private fileSystem;
    private logger;
    constructor(parsers: Parser[], graphRepository: GraphRepository, fileSystem: FileSystem, logger: Logger);
    /**
     * Parse entire codebase into property graph
     * Stub: Creates mock graph
     */
    parseCodebase(rootPath: string): Promise<PropertyGraph>;
    /**
     * Parse single file
     * Stub: Returns mock result
     */
    parseFile(filePath: string): Promise<void>;
    /**
     * Find parser for file
     */
    private findParser;
    /**
     * Get cached graph
     */
    getCachedGraph(codebaseId: string): Promise<PropertyGraph | undefined>;
}
//# sourceMappingURL=ParsingService.d.ts.map