/**
 * EdgeType - Types of edges in the property graph
 */

export enum EdgeType {
  // Code relationships (existing)
  DEPENDS_ON = 'depends_on',
  IMPORTS = 'imports',
  EXPORTS = 'exports',
  CONTAINS = 'contains',
  CALLS = 'calls',
  EXTENDS = 'extends',
  IMPLEMENTS = 'implements',
  REFERENCES = 'references',
  
  // Git relationships
  AUTHORED_BY = 'authored_by',
  COMMITTED_BY = 'committed_by',
  MODIFIED_IN = 'modified_in',
  CHANGED_IN = 'changed_in',
  
  // Filesystem relationships
  PARENT_OF = 'parent_of',
  LINKS_TO = 'links_to',
  
  // Testing relationships
  TESTS = 'tests',
  COVERS = 'covers',
  TESTED_BY = 'tested_by',
  
  // CI/CD relationships
  BUILT_FROM = 'built_from',
  DEPLOYS = 'deploys',
  TRIGGERS = 'triggers',
  
  // Documentation relationships
  DOCUMENTS = 'documents',
  DOCUMENTED_IN = 'documented_in',
  
  // Ownership relationships
  OWNS = 'owns',
  OWNED_BY = 'owned_by'
}

/**
 * Helper: Check if edge type is code-related
 */
export function isCodeEdgeType(type: EdgeType): boolean {
  return [
    EdgeType.DEPENDS_ON,
    EdgeType.IMPORTS,
    EdgeType.EXPORTS,
    EdgeType.CONTAINS,
    EdgeType.CALLS,
    EdgeType.EXTENDS,
    EdgeType.IMPLEMENTS,
    EdgeType.REFERENCES
  ].includes(type);
}

/**
 * Helper: Check if edge type is git-related
 */
export function isGitEdgeType(type: EdgeType): boolean {
  return [
    EdgeType.AUTHORED_BY,
    EdgeType.COMMITTED_BY,
    EdgeType.MODIFIED_IN,
    EdgeType.CHANGED_IN
  ].includes(type);
}

/**
 * Helper: Get domain for edge type
 */
export function getEdgeTypeDomain(type: EdgeType): string {
  if (isCodeEdgeType(type)) return 'code';
  if (isGitEdgeType(type)) return 'git';
  
  if (type === EdgeType.PARENT_OF || type === EdgeType.LINKS_TO) {
    return 'filesystem';
  }
  
  if (type === EdgeType.TESTS || type === EdgeType.COVERS || type === EdgeType.TESTED_BY) {
    return 'testing';
  }
  
  if (type === EdgeType.BUILT_FROM || type === EdgeType.DEPLOYS || type === EdgeType.TRIGGERS) {
    return 'cicd';
  }
  
  if (type === EdgeType.DOCUMENTS || type === EdgeType.DOCUMENTED_IN) {
    return 'documentation';
  }
  
  if (type === EdgeType.OWNS || type === EdgeType.OWNED_BY) {
    return 'ownership';
  }
  
  return 'unknown';
}
