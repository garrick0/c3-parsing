/**
 * Caching Example
 *
 * Demonstrates how to use the parser with caching for better performance
 */

import {
  TypeScriptParserImpl,
  NodeFactory,
  EdgeDetector,
  FileInfo,
  Language
} from '../dist/index.js';
import { CacheManager } from '../dist/infrastructure/adapters/cache/CacheManager.js';
import { ParsingService } from '../dist/domain/services/ParsingService.js';
import { InMemoryGraphRepository } from '../dist/infrastructure/persistence/InMemoryGraphRepository.js';
import { createLogger } from 'c3-shared';

async function main() {
  console.log('=== Parser with Caching Example ===\n');

  // Create dependencies
  const logger = createLogger('CachingExample');
  const nodeFactory = new NodeFactory();
  const edgeDetector = new EdgeDetector();

  // Create cache manager with both memory and file cache
  const cache = new CacheManager(
    {
      memory: {
        maxSize: 50 * 1024 * 1024, // 50MB
        maxItems: 500,
        ttl: 3600000 // 1 hour
      },
      file: {
        directory: '.c3-cache',
        maxSize: 500 * 1024 * 1024 // 500MB
      },
      enableFileCache: true
    },
    logger
  );

  // Create parser
  const parser = new TypeScriptParserImpl(
    logger,
    nodeFactory,
    edgeDetector
  );

  // Create parsing service
  const parsingService = new ParsingService(
    [parser],
    new InMemoryGraphRepository(),
    {} as any, // FileSystem not used in this example
    logger,
    cache
  );

  // Sample code to parse
  const source = `
    export class Calculator {
      add(a: number, b: number): number {
        return a + b;
      }

      subtract(a: number, b: number): number {
        return a - b;
      }

      multiply(a: number, b: number): number {
        return a * b;
      }

      divide(a: number, b: number): number {
        if (b === 0) throw new Error('Division by zero');
        return a / b;
      }
    }
  `;

  const fileInfo = new FileInfo(
    'calc-1',
    'Calculator.ts',
    '.ts',
    source.length,
    Language.TYPESCRIPT,
    new Date()
  );

  // First parse (cache miss)
  console.log('First parse (no cache)...');
  const start1 = performance.now();
  const result1 = await parser.parse(source, fileInfo);
  const duration1 = performance.now() - start1;

  console.log(`  Duration: ${duration1.toFixed(2)}ms`);
  console.log(`  Nodes: ${result1.nodes.length}`);
  console.log(`  Edges: ${result1.edges.length}\n`);

  // Cache the result manually
  const cacheKey = cache.generateKey(fileInfo.path, cache.hashContent(source));
  await cache.set(cacheKey, result1);

  // Second parse (cache hit)
  console.log('Second parse (with cache)...');
  const start2 = performance.now();
  const cachedResult = await cache.get(cacheKey);
  const duration2 = performance.now() - start2;

  console.log(`  Duration: ${duration2.toFixed(2)}ms`);
  console.log(`  Nodes: ${cachedResult?.nodes.length}`);
  console.log(`  Edges: ${cachedResult?.edges.length}`);
  console.log(`  Speedup: ${(duration1 / duration2).toFixed(2)}x\n`);

  // Show cache stats
  const stats = cache.getStats();
  console.log('Cache Statistics:');
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`  Memory Size: ${(stats.memorySize / 1024).toFixed(2)} KB`);
  console.log(`  Memory Items: ${stats.memoryItems}`);

  // Clean up
  await cache.clear();
  parser.dispose();
  console.log('\nCache cleared and parser disposed.');
}

main().catch(console.error);