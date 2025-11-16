/**
 * Dependency Analysis Example (v2.0.0)
 *
 * Demonstrates how to analyze imports and dependencies in TypeScript code
 */

import {
  TypeScriptExtension,
  ParsingService,
  InMemoryGraphRepository,
  EdgeType
} from '../dist/index.js';
import { createLogger } from 'c3-shared';

async function main() {
  console.log('=== Dependency Analysis Example (v2.0.0) ===\n');

  // Create TypeScript extension and parsing service
  const logger = createLogger('DependencyAnalysis');
  const tsExtension = new TypeScriptExtension({
    tsconfigRootDir: process.cwd()
  });
  
  const repository = new InMemoryGraphRepository();
  const service = new ParsingService(repository, logger, [tsExtension]);

  // Parse the src directory
  console.log('Parsing codebase...\n');
  const graph = await service.parseCodebase('./src');

  // Analyze imports
  console.log('Import Dependencies:');
  const importEdges = graph.getEdges().filter(e => e.type === EdgeType.IMPORTS);
  console.log(`Found ${importEdges.length} import edges\n`);
  
  // Show sample imports
  importEdges.slice(0, 10).forEach(edge => {
    const fromNode = graph.getNode(edge.fromNodeId);
    console.log(`  ${fromNode?.name || 'file'} → ${edge.metadata.target || edge.toNodeId}`);
  });

  // Analyze dependencies
  console.log('\nAll Dependencies:');
  const dependencyEdges = graph.getEdges().filter(e => e.type === EdgeType.DEPENDS_ON);
  console.log(`Found ${dependencyEdges.length} dependency edges\n`);
  
  // Show sample dependencies
  dependencyEdges.slice(0, 10).forEach(edge => {
    const fromNode = graph.getNode(edge.fromNodeId);
    const toNode = graph.getNode(edge.toNodeId);
    console.log(`  ${fromNode?.name || edge.fromNodeId} → ${toNode?.name || edge.toNodeId}`);
  });

  // Analyze nodes by type
  console.log('\nNodes by Type:');
  const nodesByType = new Map<string, number>();
  graph.getNodes().forEach(node => {
    nodesByType.set(node.type, (nodesByType.get(node.type) || 0) + 1);
  });

  [...nodesByType.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  // Show exported symbols
  console.log('\nExported Symbols:');
  const exports = graph.getNodes().filter(node => node.metadata.isExported);
  console.log(`Found ${exports.length} exported symbols\n`);
  exports.slice(0, 10).forEach(node => {
    console.log(`  - ${node.type}: ${node.name}`);
  });

  // Show imported modules (unique)
  console.log('\nImported Modules:');
  const imports = graph.getNodes().filter(node => node.type === 'import');
  const uniqueImports = [...new Set(imports.map(n => n.name))];
  console.log(`Found ${uniqueImports.length} unique imports\n`);
  uniqueImports.slice(0, 10).forEach(name => {
    console.log(`  - ${name}`);
  });

  // Query by labels
  console.log('\nNodes by Labels:');
  console.log(`  Callable: ${graph.getNodesByLabel('Callable').length}`);
  console.log(`  Type: ${graph.getNodesByLabel('Type').length}`);
  console.log(`  CodeElement: ${graph.getNodesByLabel('CodeElement').length}`);

  // Analyze inheritance
  console.log('\nInheritance Relationships:');
  const extendsEdges = graph.getEdges().filter(e => e.type === EdgeType.EXTENDS);
  console.log(`Found ${extendsEdges.length} inheritance edges`);

  // Analyze function calls
  console.log('\nFunction Calls:');
  const callEdges = graph.getEdges().filter(e => e.type === EdgeType.CALLS);
  console.log(`Found ${callEdges.length} call edges`);

  // Statistics
  console.log('\n=== Statistics ===');
  console.log(`Total Nodes: ${graph.getNodeCount()}`);
  console.log(`Total Edges: ${graph.getEdgeCount()}`);
  console.log(`Import Edges: ${importEdges.length}`);
  console.log(`Dependency Edges: ${dependencyEdges.length}`);
  console.log(`Inheritance Edges: ${extendsEdges.length}`);
  console.log(`Call Edges: ${callEdges.length}`);
  console.log(`Domains: ${graph.getAllDomains().join(', ')}`);

  // Clean up
  await tsExtension.dispose();
  console.log('\n✅ Done');
}

main().catch(console.error);
