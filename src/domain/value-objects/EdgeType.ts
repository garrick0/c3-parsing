/**
 * EdgeType - Types of edges in the property graph
 */

export enum EdgeType {
  DEPENDS_ON = 'depends_on',
  IMPORTS = 'imports',
  EXPORTS = 'exports',
  CONTAINS = 'contains',
  CALLS = 'calls',
  EXTENDS = 'extends',
  IMPLEMENTS = 'implements',
  REFERENCES = 'references'
}
