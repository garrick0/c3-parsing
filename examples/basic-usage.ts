/**
 * Basic Usage Example
 *
 * Demonstrates how to parse a single TypeScript file
 */

import {
  TypeScriptParserImpl,
  ConsoleLogger,
  NodeFactory,
  EdgeDetector,
  FileInfo,
  Language
} from '../dist/index.js';

async function main() {
  // Create dependencies
  const logger = new ConsoleLogger();
  const nodeFactory = new NodeFactory();
  const edgeDetector = new EdgeDetector();

  // Create parser
  const parser = new TypeScriptParserImpl(
    logger,
    nodeFactory,
    edgeDetector
  );

  // Sample TypeScript code to parse
  const source = `
    export interface User {
      id: string;
      name: string;
      email: string;
    }

    export class UserService {
      private users: Map<string, User> = new Map();

      constructor() {}

      addUser(user: User): void {
        this.users.set(user.id, user);
      }

      getUser(id: string): User | undefined {
        return this.users.get(id);
      }

      getAllUsers(): User[] {
        return Array.from(this.users.values());
      }
    }
  `;

  // Create file info
  const fileInfo = new FileInfo(
    'example-1',
    'UserService.ts',
    '.ts',
    source.length,
    Language.TYPESCRIPT,
    new Date()
  );

  // Parse the code
  console.log('Parsing TypeScript code...\n');
  const result = await parser.parse(source, fileInfo);

  // Display results
  console.log('=== Parse Results ===\n');
  console.log(`Total Nodes: ${result.nodes.length}`);
  console.log(`Total Edges: ${result.edges.length}\n`);

  // Show nodes
  console.log('Nodes:');
  result.nodes.forEach(node => {
    console.log(`  - ${node.type}: ${node.name}`);
  });

  console.log('\nEdges:');
  result.edges.slice(0, 10).forEach(edge => {
    console.log(`  - ${edge.type}: ${edge.fromNodeId} → ${edge.toNodeId}`);
  });

  // Show metadata
  console.log('\nMetadata:');
  console.log(`  Language: ${result.metadata.language}`);
  console.log(`  Parse Time: ${result.metadata.parseTime?.toFixed(2)}ms`);
  console.log(`  Transform Time: ${result.metadata.transformTime?.toFixed(2)}ms`);
  console.log(`  Convert Time: ${result.metadata.convertTime?.toFixed(2)}ms`);
  console.log(`  Total Time: ${result.metadata.totalTime?.toFixed(2)}ms`);

  // Clean up (important in v1.1.0+)
  parser.dispose();
  console.log('\n✅ Parser disposed');
}

main().catch(console.error);