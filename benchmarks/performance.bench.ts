/**
 * Performance Benchmark - Validate 24x Improvement
 *
 * This benchmark verifies that the native TypeScript API + Project Service
 * implementation actually delivers the promised performance improvement.
 */

import { TypeScriptParserImpl } from '../src/infrastructure/adapters/parsers/typescript/TypeScriptParserImpl.js';
import { NodeFactory } from '../src/domain/services/NodeFactory.js';
import { EdgeDetector } from '../src/domain/services/EdgeDetector.js';
import { ConsoleLogger } from '../src/infrastructure/mocks/c3-shared.js';
import { FileInfo } from '../src/domain/entities/FileInfo.js';
import { Language } from '../src/domain/value-objects/Language.js';

// Simple logger that doesn't spam output
const logger = {
  info: () => {},
  debug: () => {},
  warn: () => {},
  error: (msg: string, err?: Error) => console.error(msg, err),
};

/**
 * Generate test source code
 */
function generateTestSource(index: number): string {
  return `
    export class TestClass${index} {
      private value: number = ${index};

      constructor(value: number) {
        this.value = value;
      }

      getValue(): number {
        return this.value;
      }

      setValue(value: number): void {
        this.value = value;
      }

      static create(value: number): TestClass${index} {
        return new TestClass${index}(value);
      }
    }

    export interface ITest${index} {
      id: number;
      name: string;
      value: number;
    }

    export function processTest${index}(data: ITest${index}): number {
      return data.value * 2;
    }

    export const CONSTANT_${index} = ${index};
  `;
}

/**
 * Run performance benchmark
 */
async function runBenchmark() {
  console.log('='.repeat(70));
  console.log('PERFORMANCE BENCHMARK - Native TypeScript API + Project Service');
  console.log('='.repeat(70));
  console.log();

  const parser = new TypeScriptParserImpl(
    logger as any,
    new NodeFactory(logger as any),
    new EdgeDetector()
  );

  // Test with different file counts
  const fileCounts = [10, 25, 50, 100];

  console.log('File Count | Total Time | Avg/File | Throughput');
  console.log('-'.repeat(70));

  for (const count of fileCounts) {
    // Generate files
    const files: Array<{ source: string; fileInfo: FileInfo }> = [];

    for (let i = 0; i < count; i++) {
      files.push({
        source: generateTestSource(i),
        fileInfo: new FileInfo(
          `test-${i}`,
          `test-${i}.ts`,
          '.ts',
          1024,
          Language.TypeScript,
          new Date()
        )
      });
    }

    // Parse all files
    const startTime = performance.now();

    for (const { source, fileInfo } of files) {
      await parser.parse(source, fileInfo);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgPerFile = totalTime / count;
    const filesPerSecond = (1000 / avgPerFile).toFixed(1);

    console.log(
      `${count.toString().padStart(10)} | ` +
      `${totalTime.toFixed(0).padStart(10)}ms | ` +
      `${avgPerFile.toFixed(1).padStart(8)}ms | ` +
      `${filesPerSecond} files/sec`
    );
  }

  console.log();

  // Get final stats
  const stats = parser.getProjectServiceStats();
  if (stats) {
    console.log('Project Service Statistics:');
    console.log(`  - Open files: ${stats.openFiles}`);
    console.log(`  - Default project files: ${stats.defaultProjectFiles}`);
  }

  // Clean up
  parser.dispose();

  console.log();
  console.log('='.repeat(70));
  console.log('EXPECTED vs ACTUAL Performance');
  console.log('='.repeat(70));
  console.log();
  console.log('Target (from typescript-eslint benchmarks):');
  console.log('  - 100 files: ~450ms');
  console.log('  - Avg per file: ~4.5ms');
  console.log();
  console.log('Previous v1.0.0 (ts-morph):');
  console.log('  - 100 files: ~11,000ms');
  console.log('  - Avg per file: ~110ms');
  console.log();
  console.log('Expected improvement: 24x faster');
  console.log('='.repeat(70));
}

// Run benchmark
runBenchmark().catch(console.error);
