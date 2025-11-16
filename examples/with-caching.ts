/**
 * Caching Example (v2.0.0)
 *
 * Note: v2.0.0 removes direct cache support from ParsingService.
 * Extensions handle their own caching internally (e.g., TypeScript Project Service).
 * This example shows the new architecture without explicit cache management.
 */

import {
  TypeScriptExtension,
  FilesystemExtension,
  ParsingService,
  InMemoryGraphRepository
} from '../dist/index.js';
import { createLogger } from 'c3-shared';

async function main() {
  console.log('=== Parser with Extension Caching (v2.0.0) ===\n');

  const logger = createLogger('CachingExample');

  // TypeScript extension uses Project Service which provides
  // automatic caching of TypeScript Programs (26x speedup)
  const tsExtension = new TypeScriptExtension({
    tsconfigRootDir: process.cwd(),
    includePrivateMembers: false
  });

  // Filesystem extension
  const fsExtension = new FilesystemExtension({
    includeHidden: false,
    maxDepth: 5,
    ignorePatterns: ['node_modules', '.git', 'dist']
  });

  // Create service with extensions
  const repository = new InMemoryGraphRepository();
  const service = new ParsingService(
    repository,
    logger,
    [tsExtension, fsExtension]
  );

  console.log('First parse (cold start)...');
  const start1 = Date.now();
  const graph1 = await service.parseCodebase('./src');
  const time1 = Date.now() - start1;

  console.log(`\nFirst parse complete:`);
  console.log(`  Time: ${time1}ms`);
  console.log(`  Nodes: ${graph1.getNodeCount()}`);
  console.log(`  Edges: ${graph1.getEdgeCount()}`);

  // Second parse - TypeScript Project Service caches Programs
  console.log('\nSecond parse (with cached Programs)...');
  const start2 = Date.now();
  const graph2 = await service.parseCodebase('./src');
  const time2 = Date.now() - start2;

  console.log(`\nSecond parse complete:`);
  console.log(`  Time: ${time2}ms`);
  console.log(`  Nodes: ${graph2.getNodeCount()}`);
  console.log(`  Edges: ${graph2.getEdgeCount()}`);
  console.log(`  Speedup: ${(time1 / time2).toFixed(2)}x faster`);

  // Project Service stats
  const stats = (tsExtension as any).projectServiceAdapter?.getStats();
  if (stats) {
    console.log('\nProject Service Cache Stats:');
    console.log(`  Open Files: ${stats.openFiles}`);
    console.log(`  Default Project Files: ${stats.defaultProjectFiles}`);
  }

  // Clean up
  await tsExtension.dispose();
  await fsExtension.dispose();

  console.log('\n✅ Done');
}

main().catch(console.error);
