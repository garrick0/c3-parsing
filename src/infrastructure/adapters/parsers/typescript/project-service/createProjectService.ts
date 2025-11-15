/**
 * TypeScript Project Service Creation
 *
 * Adapted from typescript-eslint v8
 * Original: https://github.com/typescript-eslint/typescript-eslint
 * License: MIT
 *
 * This implementation uses TypeScript's Project Service APIs to create and manage
 * TypeScript programs efficiently, enabling shared Programs across files and
 * automatic tsconfig.json detection.
 */

import * as ts from 'typescript';
import { server as tsserver } from 'typescript/lib/tsserverlibrary';
import { Logger } from '../../../../mocks/c3-shared.js';

export interface ProjectServiceAndMetadata {
  allowDefaultProject: string[] | undefined;
  lastReloadTimestamp: number;
  maximumDefaultProjectFileMatchCount: number;
  service: tsserver.ProjectService;
}

export interface CreateProjectServiceSettings {
  logger: Logger;
  options?: {
    defaultProject?: string;
    allowDefaultProject?: string[];
    maximumDefaultProjectFileMatchCount?: number;
  };
  jsDocParsingMode?: ts.JSDocParsingMode;
  tsconfigRootDir?: string;
  // NEW: Support for in-memory files
  fileContents?: Map<string, string>;
}

/**
 * Stub function for TypeScript APIs that don't need implementation
 */
function doNothing(): void {
  // Intentionally empty
}

/**
 * Creates a stub file watcher that prevents disk watching
 * Critical for performance - prevents infinite loops and file system thrashing
 */
function createStubFileWatcher(): ts.FileWatcher {
  return {
    close: doNothing,
  };
}

/**
 * Creates a TypeScript Project Service
 *
 * This function is adapted from typescript-eslint's implementation and creates
 * a TypeScript server ProjectService that can be used to efficiently parse
 * multiple files with shared Programs.
 *
 * Key features:
 * - Disables file watching for performance
 * - Disables plugin loading for security
 * - Configures proper logging
 * - Supports default project configuration
 *
 * @param settings - Configuration settings for the Project Service
 * @returns Project Service instance with metadata
 */
export function createProjectService(
  settings: CreateProjectServiceSettings
): ProjectServiceAndMetadata {
  const { logger, options = {}, jsDocParsingMode, tsconfigRootDir, fileContents } = settings;

  logger.info('Creating TypeScript Project Service');

  // Create custom system that prevents file watching
  // This is critical - file watching can cause infinite loops and performance issues
  const system: tsserver.ServerHost = {
    ...ts.sys,
    clearImmediate,
    clearTimeout,
    setImmediate,
    setTimeout,

    // Disable file watching - prevents disk thrashing
    watchDirectory: createStubFileWatcher,
    watchFile: createStubFileWatcher,

    // Prevent plugin loading - security and performance
    require: (): { module: undefined; error: Error } => ({
      module: undefined,
      error: new Error('c3-parsing: TypeScript plugins are disabled'),
    }),

    // Override getCurrentDirectory if tsconfigRootDir provided
    getCurrentDirectory: tsconfigRootDir
      ? () => tsconfigRootDir
      : ts.sys.getCurrentDirectory,

    // Override readFile to support in-memory files
    readFile: (path: string, encoding?: string): string | undefined => {
      // Check in-memory first
      if (fileContents && fileContents.has(path)) {
        return fileContents.get(path);
      }
      // Fall back to disk
      return ts.sys.readFile(path, encoding);
    },

    // Override fileExists to check in-memory files
    fileExists: (path: string): boolean => {
      if (fileContents && fileContents.has(path)) {
        return true;
      }
      return ts.sys.fileExists(path);
    },
  };

  // Create logger adapter for TypeScript
  const tsLogger: tsserver.Logger = {
    close: doNothing,
    endGroup: doNothing,
    getLogFileName: () => undefined,
    hasLevel: () => false,
    info(message: string): void {
      logger.debug(`[TypeScript Server] ${message}`);
    },
    loggingEnabled: () => false,
    msg: doNothing,
    perftrc: doNothing,
    startGroup: doNothing,
  };

  // Create the Project Service with our custom configuration
  const service = new tsserver.ProjectService({
    host: system,
    logger: tsLogger,
    session: undefined,
    jsDocParsingMode,
    cancellationToken: tsserver.nullCancellationToken,
    // Use inferred project per root for better multi-project support
    useSingleInferredProject: false,
    useInferredProjectPerProjectRoot: true,
    typingsInstaller: tsserver.nullTypingsInstaller,
    eventHandler: () => {
      // Event handler can be used for debugging/monitoring
    },
  });

  logger.info('TypeScript Project Service created successfully');

  // Return service with metadata
  return {
    allowDefaultProject: options.allowDefaultProject,
    lastReloadTimestamp: performance.now(),
    maximumDefaultProjectFileMatchCount: options.maximumDefaultProjectFileMatchCount ?? 8,
    service,
  };
}
