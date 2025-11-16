/**
 * Project Service Adapter
 *
 * Adapted from typescript-eslint v8
 * Original: https://github.com/typescript-eslint/typescript-eslint
 * License: MIT
 *
 * This adapter provides a clean interface for using TypeScript's Project Service
 * within c3-parsing. It handles service lifecycle, Program retrieval, and
 * batch processing with shared Programs.
 */

import * as ts from 'typescript';
import * as path from 'node:path';
import { Logger } from 'c3-shared';
import { createProjectService, type ProjectServiceAndMetadata } from './createProjectService.js';
import { useProgramFromProjectService, type ASTAndProgram, type ParseSettings } from './useProgramFromProjectService.js';
import { FileInfo } from '../../../../domain/entities/FileInfo.js';
import { ParseResult } from '../../../../domain/ports/Parser.js';

export interface ProjectServiceOptions {
  tsconfigRootDir?: string;
  allowDefaultProject?: string[];
  maximumDefaultProjectFileMatchCount?: number;
  errorOnTypeScriptSyntacticAndSemanticIssues?: boolean;
  extraFileExtensions?: string[];
}

/**
 * Adapter for TypeScript Project Service
 *
 * This class provides a high-level interface for using the Project Service,
 * including support for batch processing and Program sharing.
 */
export class ProjectServiceAdapter {
  private projectService: ProjectServiceAndMetadata;
  private logger: Logger;
  private defaultProjectMatchedFiles = new Set<string>();
  private openFiles = new Set<string>();
  private options: ProjectServiceOptions;
  private fileContents = new Map<string, string>(); // NEW: Support in-memory files

  constructor(logger: Logger, options: ProjectServiceOptions = {}) {
    this.logger = logger;
    this.options = {
      errorOnTypeScriptSyntacticAndSemanticIssues: false,
      ...options,
    };

    this.logger.info('Initializing TypeScript Project Service');

    // Create the Project Service
    this.projectService = createProjectService({
      logger: this.logger,
      options: {
        allowDefaultProject: this.options.allowDefaultProject,
        maximumDefaultProjectFileMatchCount: this.options.maximumDefaultProjectFileMatchCount,
      },
      tsconfigRootDir: this.options.tsconfigRootDir,
      fileContents: this.fileContents, // Pass file contents map
    });

    this.logger.info('Project Service initialized successfully');
  }

  /**
   * Gets a Program for a single file
   *
   * @param filePath - Path to the file (will be made absolute)
   * @param content - File content
   * @param hasFullTypeInformation - Whether full type information is needed
   * @returns AST and Program, or undefined if parsing fails
   */
  async getProgram(
    filePath: string,
    content: string,
    hasFullTypeInformation = true
  ): Promise<ASTAndProgram | undefined> {
    // Make path absolute
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.options.tsconfigRootDir || process.cwd(), filePath);

    // Store content in memory for the host to read (at absolute path)
    this.fileContents.set(absolutePath, content);

    const parseSettings: ParseSettings = {
      filePath: absolutePath,
      tsconfigRootDir: this.options.tsconfigRootDir,
      extraFileExtensions: this.options.extraFileExtensions,
      errorOnTypeScriptSyntacticAndSemanticIssues:
        this.options.errorOnTypeScriptSyntacticAndSemanticIssues ?? false,
    };

    const result = useProgramFromProjectService(
      this.projectService,
      parseSettings,
      hasFullTypeInformation,
      this.defaultProjectMatchedFiles,
      this.logger
    );

    if (result) {
      this.openFiles.add(absolutePath);
    }

    return result;
  }

  /**
   * Parses multiple files with shared Programs
   *
   * This is the key optimization - files in the same tsconfig will
   * share the same Program instance, dramatically improving performance.
   *
   * @param files - Array of files to parse
   * @returns Map of file paths to AST/Program results
   */
  async parseFiles(
    files: Array<{ path: string; content: string }>
  ): Promise<Map<string, ASTAndProgram>> {
    this.logger.info(`Parsing ${files.length} files with Project Service`);
    const results = new Map<string, ASTAndProgram>();

    // Store all file contents in memory first (with absolute paths)
    for (const file of files) {
      const absolutePath = path.isAbsolute(file.path)
        ? file.path
        : path.join(this.options.tsconfigRootDir || process.cwd(), file.path);
      this.fileContents.set(absolutePath, file.content);
    }

    // Now parse - Project Service will handle Program sharing
    for (const file of files) {
      const result = await this.getProgram(file.path, file.content, true);

      if (result) {
        results.set(file.path, result);
      } else {
        this.logger.warn(`Failed to parse: ${file.path}`);
      }
    }

    this.logger.info(
      `Successfully parsed ${results.size}/${files.length} files`
    );

    return results;
  }

  /**
   * Gets statistics about the Project Service usage
   */
  getStats(): {
    openFiles: number;
    defaultProjectFiles: number;
    lastReloadTimestamp: number;
  } {
    return {
      openFiles: this.openFiles.size,
      defaultProjectFiles: this.defaultProjectMatchedFiles.size,
      lastReloadTimestamp: this.projectService.lastReloadTimestamp,
    };
  }

  /**
   * Clears the default project matched files
   *
   * Useful for testing or resetting state
   */
  clearDefaultProjectMatchedFiles(): void {
    this.defaultProjectMatchedFiles.clear();
    this.logger.debug('Cleared default project matched files');
  }

  /**
   * Closes a specific file
   *
   * @param filePath - Path to the file to close
   */
  closeFile(filePath: string): void {
    if (this.openFiles.has(filePath)) {
      this.projectService.service.closeClientFile(filePath);
      this.openFiles.delete(filePath);
      this.logger.debug(`Closed file: ${filePath}`);
    }
  }

  /**
   * Disposes of the Project Service and cleans up resources
   *
   * IMPORTANT: Always call this when done to prevent memory leaks
   */
  dispose(): void {
    this.logger.info('Disposing Project Service');

    // Close all open files
    for (const filePath of this.openFiles) {
      try {
        this.projectService.service.closeClientFile(filePath);
      } catch (error) {
        this.logger.warn(`Failed to close file: ${filePath}`, error as Error);
      }
    }

    this.openFiles.clear();
    this.defaultProjectMatchedFiles.clear();
    this.fileContents.clear();

    this.logger.info('Project Service disposed');
  }
}
