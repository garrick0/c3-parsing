/**
 * NodeType - Types of nodes in the property graph
 */

export enum NodeType {
  // Code elements (existing)
  FILE = 'file',
  DIRECTORY = 'directory',
  MODULE = 'module',
  CLASS = 'class',
  INTERFACE = 'interface',
  FUNCTION = 'function',
  METHOD = 'method',
  VARIABLE = 'variable',
  CONSTANT = 'constant',
  ENUM = 'enum',
  TYPE = 'type',
  IMPORT = 'import',
  EXPORT = 'export',
  
  // Git types
  GIT_COMMIT = 'git_commit',
  GIT_AUTHOR = 'git_author',
  GIT_BRANCH = 'git_branch',
  GIT_TAG = 'git_tag',
  
  // Filesystem types (separate from code files)
  FS_FILE = 'fs_file',
  FS_DIRECTORY = 'fs_directory',
  FS_SYMLINK = 'fs_symlink',
  
  // Testing types
  TEST_SUITE = 'test_suite',
  TEST_CASE = 'test_case',
  COVERAGE_REPORT = 'coverage_report',
  
  // CI/CD types
  CI_PIPELINE = 'ci_pipeline',
  CI_JOB = 'ci_job',
  CI_BUILD = 'ci_build',
  
  // Documentation types
  DOC_PAGE = 'doc_page',
  DOC_SECTION = 'doc_section'
}

/**
 * Helper: Check if node type is code-related
 */
export function isCodeNodeType(type: NodeType): boolean {
  return [
    NodeType.FILE,
    NodeType.DIRECTORY,
    NodeType.MODULE,
    NodeType.CLASS,
    NodeType.INTERFACE,
    NodeType.FUNCTION,
    NodeType.METHOD,
    NodeType.VARIABLE,
    NodeType.CONSTANT,
    NodeType.ENUM,
    NodeType.TYPE,
    NodeType.IMPORT,
    NodeType.EXPORT
  ].includes(type);
}

/**
 * Helper: Check if node type is git-related
 */
export function isGitNodeType(type: NodeType): boolean {
  return [
    NodeType.GIT_COMMIT,
    NodeType.GIT_AUTHOR,
    NodeType.GIT_BRANCH,
    NodeType.GIT_TAG
  ].includes(type);
}

/**
 * Helper: Check if node type is filesystem-related
 */
export function isFilesystemNodeType(type: NodeType): boolean {
  return [
    NodeType.FS_FILE,
    NodeType.FS_DIRECTORY,
    NodeType.FS_SYMLINK
  ].includes(type);
}

/**
 * Helper: Check if node type is testing-related
 */
export function isTestingNodeType(type: NodeType): boolean {
  return [
    NodeType.TEST_SUITE,
    NodeType.TEST_CASE,
    NodeType.COVERAGE_REPORT
  ].includes(type);
}

/**
 * Helper: Get domain for node type
 */
export function getNodeTypeDomain(type: NodeType): string {
  if (isCodeNodeType(type)) return 'code';
  if (isGitNodeType(type)) return 'git';
  if (isFilesystemNodeType(type)) return 'filesystem';
  if (isTestingNodeType(type)) return 'testing';
  
  if (type === NodeType.CI_PIPELINE || 
      type === NodeType.CI_JOB || 
      type === NodeType.CI_BUILD) {
    return 'cicd';
  }
  
  if (type === NodeType.DOC_PAGE || 
      type === NodeType.DOC_SECTION) {
    return 'documentation';
  }
  
  return 'unknown';
}
