/**
 * Basic Usage Example (v2.0.0)
 *
 * Demonstrates how to parse a TypeScript codebase using extensions
 */

import {
  TypeScriptExtension,
  ParsingService,
  InMemoryGraphRepository
} from '../dist/index.js';
import { createLogger } from 'c3-shared';

async function main() {
  const logger = createLogger('BasicUsage');

  // Create TypeScript extension
  const tsExtension = new TypeScriptExtension({
    tsconfigRootDir: process.cwd(),
    includePrivateMembers: false
  });

  // Create parsing service with extension
  const repository = new InMemoryGraphRepository();
  const service = new ParsingService(
    repository,
    logger,
    [tsExtension] // All data sources are extensions!
  );

  // Parse the src directory
  console.log('Parsing TypeScript code...\n');
  const graph = await service.parseCodebase('./src');

  // Display results
  console.log('=== Parse Results ===\n');
  console.log(`Total Nodes: ${graph.getNodeCount()}`);
  console.log(`Total Edges: ${graph.getEdgeCount()}\n`);

  // Query by domain
  const codeNodes = graph.getNodesByDomain('code');
  console.log(`Code Nodes: ${codeNodes.length}`);

  // Query by labels
  const classes = graph.getNodesByLabel('Class');
  const functions = graph.getNodesByLabel('Function');
  const interfaces = graph.getNodesByLabel('Interface');

  console.log(`\nBy Type:`);
  console.log(`  Classes: ${classes.length}`);
  console.log(`  Functions: ${functions.length}`);
  console.log(`  Interfaces: ${interfaces.length}`);

  // Show sample nodes
  console.log('\nSample Nodes:');
  graph.getNodes().slice(0, 10).forEach(node => {
    const labels = node.getLabels().join(', ');
    console.log(`  - ${node.type}: ${node.name} [${labels}]`);
  });

  // Show sample edges
  console.log('\nSample Edges:');
  graph.getEdges().slice(0, 10).forEach(edge => {
    console.log(`  - ${edge.type}: ${edge.fromNodeId} → ${edge.toNodeId}`);
  });

  // Show domains
  console.log('\nDomains in graph:');
  graph.getAllDomains().forEach(domain => {
    console.log(`  - ${domain}`);
  });

  // Clean up
  await tsExtension.dispose();
  console.log('\n✅ Extension disposed');
}

main().catch(console.error);