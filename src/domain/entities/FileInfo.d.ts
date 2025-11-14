/**
 * FileInfo - Metadata about a file in the codebase
 */
import { Entity } from 'c3-shared';
import { Language } from '../value-objects/Language.js';
export declare class FileInfo extends Entity<string> {
    readonly path: string;
    readonly extension: string;
    readonly size: number;
    readonly language: Language;
    readonly lastModified: Date;
    constructor(id: string, path: string, extension: string, size: number, language: Language, lastModified: Date);
    /**
     * Get file name
     */
    getFileName(): string;
    /**
     * Get directory path
     */
    getDirectory(): string;
    /**
     * Check if file should be analyzed
     */
    shouldAnalyze(): boolean;
    /**
     * Get relative path from base
     */
    getRelativePath(base: string): string;
    /**
     * Check if file is too large
     */
    isTooLarge(maxSize?: number): boolean;
}
//# sourceMappingURL=FileInfo.d.ts.map