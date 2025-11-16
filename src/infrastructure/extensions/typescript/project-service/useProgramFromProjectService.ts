/**
 * Program Retrieval from Project Service
 *
 * Adapted from typescript-eslint v8
 * Original: https://github.com/typescript-eslint/typescript-eslint
 * License: MIT
 *
 * This module handles retrieving TypeScript Programs from the Project Service,
 * including file opening, default project handling, and reload throttling.
 */

import type { ProjectServiceAndMetadata } from './createProjectService.js';
import { minimatch } from 'minimatch';
import path from 'node:path';
import * as ts from 'typescript';
import { server as tsserver } from 'typescript/lib/tsserverlibrary.js';
import { Logger } from 'c3-shared';

// Critical constants from typescript-eslint
const RELOAD_THROTTLE_MS = 250; // Prevent excessive reloads
const DEFAULT_EXTRA_FILE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.cjs',
  '.cts',
];

// Cache for file extensions per service (prevents redundant updates)
const serviceFileExtensions = new WeakMap<
  tsserver.ProjectService,
  readonly string[]
>();

export interface ParseSettings {
  filePath: string;
  tsconfigRootDir?: string;
  extraFileExtensions?: string[];
  errorOnTypeScriptSyntacticAndSemanticIssues: boolean;
}

export interface ASTAndProgram {
  ast: ts.SourceFile;
  program: ts.Program | undefined;
}

/**
 * Main function for retrieving Programs from Project Service
 *
 * This is adapted directly from typescript-eslint's implementation.
 *
 * @param projectService - Project Service instance with metadata
 * @param parseSettings - Settings for this parse operation
 * @param hasFullTypeInformation - Whether full type information is needed
 * @param defaultProjectMatchedFiles - Set to track default project files
 * @param logger - Logger instance
 * @returns AST and Program, or undefined if parsing fails
 */
export function useProgramFromProjectService(
  projectService: ProjectServiceAndMetadata,
  parseSettings: ParseSettings,
  hasFullTypeInformation: boolean,
  defaultProjectMatchedFiles: Set<string>,
  logger: Logger
): ASTAndProgram | undefined {
  logger.debug(`Getting program from Project Service for: ${parseSettings.filePath}`);

  // Update extra file extensions if needed
  updateExtraFileExtensions(
    projectService.service,
    parseSettings.extraFileExtensions,
    logger
  );

  // Resolve to absolute path
  const filePathAbsolute = absolutify(parseSettings.filePath, projectService.service);

  // Check if file is eligible for default project
  const isDefaultProjectAllowlisted = filePathMatchedBy(
    filePathAbsolute,
    projectService.allowDefaultProject
  );

  logger.debug(
    `File ${filePathAbsolute}, default project allowed: ${isDefaultProjectAllowlisted}`
  );

  // Handle case where full type info not needed and file not allowlisted
  if (!hasFullTypeInformation && !isDefaultProjectAllowlisted) {
    logger.debug('Creating no-program result for non-typed linting');
    return createNoProgramWithProjectService(
      projectService.service,
      parseSettings,
      filePathAbsolute
    );
  }

  // Open file in project service
  const opened = openClientFileFromProjectService(
    projectService,
    parseSettings,
    filePathAbsolute,
    isDefaultProjectAllowlisted,
    logger
  );

  if (!opened) {
    return undefined;
  }

  // Track if this is a default project file
  if (opened.wasDefaultProject) {
    defaultProjectMatchedFiles.add(filePathAbsolute);
    logger.debug(`Added ${filePathAbsolute} to default project matched files`);
  }

  // Get program and AST
  const programAndAST = retrieveASTAndProgramFor(
    projectService.service,
    filePathAbsolute,
    parseSettings,
    logger
  );

  if (!programAndAST) {
    logger.warn(`Failed to retrieve program for: ${filePathAbsolute}`);
  }

  return programAndAST;
}

/**
 * Updates extra file extensions in the service if they've changed
 */
function updateExtraFileExtensions(
  service: tsserver.ProjectService,
  extraFileExtensions: string[] | undefined,
  logger: Logger
): void {
  const currentExtensions = serviceFileExtensions.get(service);
  const newExtensions = extraFileExtensions ?? DEFAULT_EXTRA_FILE_EXTENSIONS;

  // Check if extensions changed (deep equality)
  if (
    currentExtensions?.length === newExtensions.length &&
    currentExtensions.every((ext, i) => ext === newExtensions[i])
  ) {
    return; // No change
  }

  logger.debug(`Updating extra file extensions: ${newExtensions.join(', ')}`);

  const hostInfo = service.getHostFormatCodeOptions();
  service.setHostConfiguration({
    ...hostInfo,
    extraFileExtensions: newExtensions.map(extension => ({
      extension: extension.startsWith('.') ? extension.slice(1) : extension,
      isMixedContent: true,
      scriptKind: ts.ScriptKind.Deferred,
    })),
  });

  serviceFileExtensions.set(service, newExtensions);
}

/**
 * Opens a file in the Project Service
 *
 * Handles validation, default project logic, and reload throttling.
 */
function openClientFileFromProjectService(
  projectService: ProjectServiceAndMetadata,
  parseSettings: ParseSettings,
  filePathAbsolute: string,
  isDefaultProjectAllowlisted: boolean,
  logger: Logger
): { wasDefaultProject: boolean } | undefined {
  const { service } = projectService;

  logger.debug(`Opening client file: ${filePathAbsolute}`);

  try {
    // Get file content
    const fileContent = service.host.readFile(filePathAbsolute);
    if (fileContent === undefined) {
      logger.warn(`File not found: ${filePathAbsolute}`);
      return undefined;
    }

    // Open file in service
    const scriptInfo = service.openClientFile(
      filePathAbsolute,
      fileContent,
      ts.ScriptKind.Deferred,
      service.host.getCurrentDirectory()
    );

    if (!scriptInfo) {
      logger.warn(`Failed to open file in service: ${filePathAbsolute}`);
      return undefined;
    }

    // Get the project for this file
    const project = service.getDefaultProjectForFile(
      tsserver.toNormalizedPath(filePathAbsolute),
      true // ensureProject
    );

    if (!project) {
      logger.warn(`No project found for file: ${filePathAbsolute}`);
      return undefined;
    }

    // Check if this is the default inferred project
    const wasDefaultProject = project.projectKind === tsserver.ProjectKind.Inferred;

    // Validate configuration
    if (wasDefaultProject && !isDefaultProjectAllowlisted) {
      const errorMsg =
        `File ${filePathAbsolute} was not found in any tsconfig.json. ` +
        'Either add it to a tsconfig.json or enable the allowDefaultProject option.';

      if (parseSettings.errorOnTypeScriptSyntacticAndSemanticIssues) {
        throw new Error(errorMsg);
      }

      logger.warn(errorMsg);
      return undefined;
    }

    // Handle reload throttling (from typescript-eslint)
    const now = performance.now();
    if (now - projectService.lastReloadTimestamp > RELOAD_THROTTLE_MS) {
      logger.debug('Reloading projects (throttled)');
      service.reloadProjects();
      projectService.lastReloadTimestamp = now;
    }

    return { wasDefaultProject };
  } catch (error) {
    logger.error(`Error opening client file: ${filePathAbsolute}`, error as Error);

    if (parseSettings.errorOnTypeScriptSyntacticAndSemanticIssues) {
      throw error;
    }

    return undefined;
  }
}

/**
 * Creates a lightweight parse result without a full Program
 *
 * Used when full type information isn't needed.
 */
function createNoProgramWithProjectService(
  service: tsserver.ProjectService,
  parseSettings: ParseSettings,
  filePathAbsolute: string
): ASTAndProgram | undefined {
  const fileContent = service.host.readFile(filePathAbsolute);
  if (!fileContent) {
    return undefined;
  }

  const sourceFile = ts.createSourceFile(
    filePathAbsolute,
    fileContent,
    ts.ScriptTarget.Latest,
    true // setParentNodes
  );

  return {
    ast: sourceFile,
    program: undefined, // No program for non-typed linting
  };
}

/**
 * Retrieves the AST and Program from the Project Service
 *
 * This is the core function that gets the parsed SourceFile and Program.
 */
function retrieveASTAndProgramFor(
  service: tsserver.ProjectService,
  filePathAbsolute: string,
  parseSettings: ParseSettings,
  logger: Logger
): ASTAndProgram | undefined {
  logger.debug(`Retrieving program for: ${filePathAbsolute}`);

  const scriptInfo = service.getScriptInfo(filePathAbsolute);
  if (!scriptInfo) {
    logger.warn(`No script info for: ${filePathAbsolute}`);
    return undefined;
  }

  const project = service.getDefaultProjectForFile(
    scriptInfo.fileName,
    true // ensureProject
  );

  if (!project) {
    logger.warn(`No project for: ${filePathAbsolute}`);
    return undefined;
  }

  const languageService = project.getLanguageService(
    true // ensureSynchronized - critical for correctness
  );

  const program = languageService.getProgram();

  if (!program) {
    logger.warn(`No program from language service for: ${filePathAbsolute}`);
    return undefined;
  }

  const sourceFile = program.getSourceFile(filePathAbsolute);
  if (!sourceFile) {
    logger.warn(`No source file in program for: ${filePathAbsolute}`);
    return undefined;
  }

  logger.debug(`Successfully retrieved program for: ${filePathAbsolute}`);

  return {
    ast: sourceFile,
    program,
  };
}

/**
 * Converts a path to absolute
 */
function absolutify(filePath: string, service: tsserver.ProjectService): string {
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(service.host.getCurrentDirectory(), filePath);
}

/**
 * Checks if a file path matches any of the provided patterns
 */
function filePathMatchedBy(
  filePath: string,
  patterns: string[] | undefined
): boolean {
  if (!patterns || patterns.length === 0) {
    return false;
  }

  return patterns.some(pattern => minimatch(filePath, pattern));
}
