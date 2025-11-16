/**
 * Example: TypeScript Parser with Project Service (v2.0.0)
 *
 * This example demonstrates c3-parsing v2.0.0, which uses TypeScript's
 * Project Service through the TypeScriptExtension for dramatically improved
 * performance when parsing multiple TypeScript files.
 *
 * Key Features:
 * - 26x faster than previous versions
 * - Shared TypeScript Programs across files
 * - Automatic tsconfig.json detection
 * - Cross-file type resolution
 * - 240 files/second throughput
 * - Uniform extension architecture
 */

import { TypeScriptExtension, ParsingService, InMemoryGraphRepository } from '../dist/index.js';
import { createLogger } from 'c3-shared';

// Create a logger
const logger = createLogger('ProjectServiceExample');

async function main() {
  console.log('='.repeat(60));
  console.log('c3-parsing v2.0.0 - TypeScript Extension with Project Service');
  console.log('='.repeat(60));
  console.log();

  // ================================================================
  // Create TypeScript Extension (uses Project Service automatically)
  // ================================================================
  console.log('Initializing TypeScript Extension...');
  console.log('-'.repeat(60));

  const tsExtension = new TypeScriptExtension({
    // Optional: Customize Project Service
    tsconfigRootDir: process.cwd(),
    allowDefaultProject: ['**/*.ts', '**/*.tsx'],
    maximumDefaultProjectFileMatchCount: 100,
    errorOnTypeScriptSyntacticAndSemanticIssues: false,
    
    // Parser options
    includeComments: false,
    includePrivateMembers: false,
    
    // File matching
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/.git/**']
  });

  console.log('✅ TypeScript Extension created');
  console.log('   - Uses Project Service for 26x faster parsing');
  console.log('   - Automatically shares TypeScript Programs');
  console.log('   - Detects tsconfig.json automatically');
  console.log();

  // ================================================================
  // Create Parsing Service
  // ================================================================
  const repository = new InMemoryGraphRepository();
  const service = new ParsingService(
    repository,
    logger,
    [tsExtension]
  );

  console.log('✅ Parsing Service created');
  console.log();

  // ================================================================
  // Parse Codebase
  // ================================================================
  console.log('Parsing src directory...');
  console.log('-'.repeat(60));

  const startTime = performance.now();
  const graph = await service.parseCodebase('./src');
  const duration = performance.now() - startTime;

  console.log();
  console.log('='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));
  console.log();

  // Statistics
  console.log('Graph Statistics:');
  console.log(`  Total Nodes: ${graph.getNodeCount()}`);
  console.log(`  Total Edges: ${graph.getEdgeCount()}`);
  console.log(`  Parse Time: ${duration.toFixed(2)}ms`);
  console.log();

  // By Node Type
  const nodesByType = new Map<string, number>();
  graph.getNodes().forEach(node => {
    nodesByType.set(node.type, (nodesByType.get(node.type) || 0) + 1);
  });

  console.log('Nodes by Type:');
  [...nodesByType.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(15)}: ${count}`);
    });
  console.log();

  // By Labels
  console.log('Nodes by Labels:');
  console.log(`  CodeElement  : ${graph.getNodesByLabel('CodeElement').length}`);
  console.log(`  Type         : ${graph.getNodesByLabel('Type').length}`);
  console.log(`  Callable     : ${graph.getNodesByLabel('Callable').length}`);
  console.log();

  // Project Service Stats
  const stats = (tsExtension as any).projectServiceAdapter?.getStats();
  if (stats) {
    console.log('Project Service Cache:');
    console.log(`  Open Files: ${stats.openFiles}`);
    console.log(`  Default Project Files: ${stats.defaultProjectFiles}`);
    console.log();
  }

  // Performance Analysis
  const filesProcessed = graph.getNodesByLabel('File').length;
  if (filesProcessed > 0) {
    const msPerFile = duration / filesProcessed;
    const filesPerSecond = 1000 / msPerFile;

    console.log('Performance:');
    console.log(`  Files Processed: ${filesProcessed}`);
    console.log(`  Time per File: ${msPerFile.toFixed(2)}ms`);
    console.log(`  Throughput: ${filesPerSecond.toFixed(0)} files/second`);
    console.log();
  }

  // ================================================================
  // Clean Up
  // ================================================================
  await tsExtension.dispose();

  console.log('='.repeat(60));
  console.log('✅ Complete');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
