/**
 * Project Service Module
 *
 * Adapted from typescript-eslint v8
 * Original: https://github.com/typescript-eslint/typescript-eslint
 * License: MIT
 */

export {
  createProjectService,
  type ProjectServiceAndMetadata,
  type CreateProjectServiceSettings,
} from './createProjectService.js';

export {
  useProgramFromProjectService,
  type ParseSettings,
  type ASTAndProgram,
} from './useProgramFromProjectService.js';

export {
  ProjectServiceAdapter,
  type ProjectServiceOptions,
} from './ProjectServiceAdapter.js';

export {
  getCanonicalFileName,
  canonicalDirname,
  ensureAbsolutePath,
  createHash,
  type CanonicalPath,
} from './canonicalPath.js';

export {
  ExpiringCache,
  DEFAULT_TSCONFIG_CACHE_DURATION_SECONDS,
  type CacheLike,
} from './ExpiringCache.js';
