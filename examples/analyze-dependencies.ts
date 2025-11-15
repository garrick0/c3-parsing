/**
 * Dependency Analysis Example
 *
 * Demonstrates how to analyze imports and dependencies in TypeScript code
 */

import {
  TypeScriptParserImpl,
  NodeFactory,
  EdgeDetector,
  FileInfo,
  Language,
  EdgeType
} from '../dist/index.js';
import { createLogger } from 'c3-shared';

async function main() {
  console.log('=== Dependency Analysis Example ===\n');

  // Create parser
  const logger = createLogger('DependencyAnalysis');
  const parser = new TypeScriptParserImpl(
    logger,
    new NodeFactory(),
    new EdgeDetector()
  );

  // Sample code with various imports
  const source = `
    import { Entity } from 'c3-shared';
    import * as path from 'path';
    import type { Config } from './config';
    import Logger from './logger';

    export class DataService extends Entity {
      constructor(
        private config: Config,
        private logger: Logger
      ) {
        super('data-service');
      }

      async load(filePath: string): Promise<void> {
        const resolved = path.resolve(filePath);
        this.logger.info('Loading data from: ' + resolved);
      }
    }

    export { Config } from './config';
    export default DataService;
  `;

  const fileInfo = new FileInfo(
    'deps-1',
    'DataService.ts',
    '.ts',
    source.length,
    Language.TYPESCRIPT,
    new Date()
  );

  // Parse the code
  const result = await parser.parse(source, fileInfo);

  // Analyze imports
  console.log('Import Dependencies:');
  const importEdges = result.edges.filter(e => e.type === EdgeType.IMPORTS);

  importEdges.forEach(edge => {
    console.log(`  ${edge.toNodeId}`);
    if (edge.metadata?.importedSymbols) {
      console.log(`    Imports: ${edge.metadata.importedSymbols.join(', ')}`);
    }
    if (edge.metadata?.isTypeOnly) {
      console.log(`    Type-only: Yes`);
    }
  });

  // Analyze exports
  console.log('\nExported Symbols:');
  const exportedNodes = result.nodes.filter(n => n.metadata.isExported);

  exportedNodes.forEach(node => {
    console.log(`  ${node.type}: ${node.name}`);
  });

  // Analyze inheritance
  console.log('\nInheritance Relationships:');
  const extendsEdges = result.edges.filter(e => e.type === EdgeType.EXTENDS);

  extendsEdges.forEach(edge => {
    console.log(`  ${edge.fromNodeId} extends ${edge.toNodeId}`);
  });

  // Analyze function calls
  console.log('\nFunction Calls:');
  const callEdges = result.edges.filter(e => e.type === EdgeType.CALLS);

  callEdges.forEach(edge => {
    console.log(`  ${edge.fromNodeId} calls ${edge.toNodeId}`);
  });

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total Import Dependencies: ${importEdges.length}`);
  console.log(`Total Exported Symbols: ${exportedNodes.length}`);
  console.log(`Total Inheritance Relationships: ${extendsEdges.length}`);
  console.log(`Total Function Calls: ${callEdges.length}`);
  console.log(`Total Dependencies: ${importEdges.length + extendsEdges.length}`);

  // Clean up (important in v1.1.0+)
  parser.dispose();
  console.log('\n✅ Parser disposed');
}

main().catch(console.error);