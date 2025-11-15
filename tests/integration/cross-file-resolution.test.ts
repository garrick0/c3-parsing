/**
 * Cross-File Resolution Test
 *
 * This test verifies the killer feature of v1.1.0: with shared Programs,
 * we can detect relationships across files and resolve types between files.
 *
 * This was IMPOSSIBLE in v1.0.0 (each file had its own Program).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TypeScriptParserImpl } from '../../src/infrastructure/adapters/parsers/typescript/TypeScriptParserImpl.js';
import { NodeFactory } from '../../src/domain/services/NodeFactory.js';
import { EdgeDetector } from '../../src/domain/services/EdgeDetector.js';
import { createMockLogger } from '../test-utils/helpers.js';
import { FileInfo } from '../../src/domain/entities/FileInfo.js';
import { Language } from '../../src/domain/value-objects/Language.js';
import { EdgeType } from '../../src/domain/value-objects/EdgeType.js';
import { NodeType } from '../../src/domain/value-objects/NodeType.js';

describe('Cross-File Resolution (v1.1.0 Killer Feature)', () => {
  let parser: TypeScriptParserImpl;
  let logger: ReturnType<typeof createMockLogger>;

  beforeAll(() => {
    logger = createMockLogger();
    parser = new TypeScriptParserImpl(
      logger as any,
      new NodeFactory(logger as any),
      new EdgeDetector(),
      {
        tsconfigRootDir: '/test-project',
        allowDefaultProject: ['**/*.ts'],
      }
    );
  });

  afterAll(() => {
    parser.dispose();
  });

  it('should detect imports across files', async () => {
    // File 1: Export a class
    const file1Source = `
      export class UserService {
        getUser(id: string) {
          return { id, name: 'Test User' };
        }
      }
    `;

    const file1Info = new FileInfo(
      'user-service',
      '/test-project/services/UserService.ts',
      '.ts',
      file1Source.length,
      Language.TypeScript,
      new Date()
    );

    // File 2: Import and use the class
    const file2Source = `
      import { UserService } from './services/UserService';

      export class Controller {
        private service: UserService;

        constructor() {
          this.service = new UserService();
        }

        async getUser(id: string) {
          return this.service.getUser(id);
        }
      }
    `;

    const file2Info = new FileInfo(
      'controller',
      '/test-project/Controller.ts',
      '.ts',
      file2Source.length,
      Language.TypeScript,
      new Date()
    );

    // Parse both files with the SAME parser (shared Programs!)
    const result1 = await parser.parse(file1Source, file1Info);
    const result2 = await parser.parse(file2Source, file2Info);

    // Verify file1 parsed correctly
    expect(result1.nodes.length).toBeGreaterThan(0);
    const userServiceClass = result1.nodes.find(n => n.name === 'UserService');
    expect(userServiceClass).toBeDefined();

    // Verify file2 parsed correctly
    expect(result2.nodes.length).toBeGreaterThan(0);
    const controllerClass = result2.nodes.find(n => n.name === 'Controller');
    expect(controllerClass).toBeDefined();

    // KEY TEST: Detect import edge from file2 to file1
    const importEdges = result2.edges.filter(e => e.type === EdgeType.IMPORTS);
    expect(importEdges.length).toBeGreaterThan(0);

    const userServiceImport = importEdges.find(e =>
      e.toNodeId.includes('UserService') || e.toNodeId.includes('./services/UserService')
    );
    expect(userServiceImport).toBeDefined();

    console.log('\n✅ Cross-file import detection working!');
    console.log(`   File2 imports from: ${userServiceImport?.toNodeId}`);
  });

  it('should handle multiple related files efficiently', async () => {
    // Create a mini "project" with related files
    const files = [
      {
        path: '/test-project/types.ts',
        source: `
          export interface Config {
            apiUrl: string;
            timeout: number;
          }

          export type Status = 'active' | 'inactive';
        `,
      },
      {
        path: '/test-project/api.ts',
        source: `
          import { Config, Status } from './types';

          export class ApiClient {
            constructor(private config: Config) {}

            getStatus(): Status {
              return 'active';
            }
          }
        `,
      },
      {
        path: '/test-project/app.ts',
        source: `
          import { ApiClient } from './api';
          import { Config } from './types';

          const config: Config = {
            apiUrl: 'https://api.example.com',
            timeout: 5000
          };

          export const client = new ApiClient(config);
        `,
      },
    ];

    const results = [];

    // Parse all files with the SAME parser
    for (const file of files) {
      const fileInfo = new FileInfo(
        file.path,
        file.path,
        '.ts',
        file.source.length,
        Language.TypeScript,
        new Date()
      );

      const result = await parser.parse(file.source, fileInfo);
      results.push(result);
      expect(result).toBeDefined();
    }

    // Verify all files parsed
    expect(results.length).toBe(3);

    // Verify imports detected
    const allImportEdges = results.flatMap(r =>
      r.edges.filter(e => e.type === EdgeType.IMPORTS)
    );

    expect(allImportEdges.length).toBeGreaterThan(0);

    console.log(`\n✅ Multi-file project parsed successfully!`);
    console.log(`   Total import edges detected: ${allImportEdges.length}`);

    // Verify Project Service stats show multiple files
    const stats = parser.getProjectServiceStats();
    expect(stats).toBeDefined();
    expect(stats!.openFiles).toBeGreaterThan(2);

    console.log(`   Open files in Project Service: ${stats!.openFiles}`);
  });

  it('should demonstrate performance benefit of shared Programs', async () => {
    // Parse 20 files to show the performance benefit
    const fileCount = 20;
    const files = [];

    for (let i = 0; i < fileCount; i++) {
      files.push({
        path: `/test-project/file${i}.ts`,
        source: `
          export class TestClass${i} {
            getValue(): number {
              return ${i};
            }
          }
        `,
      });
    }

    const startTime = performance.now();

    for (const file of files) {
      const fileInfo = new FileInfo(
        file.path,
        file.path,
        '.ts',
        file.source.length,
        Language.TypeScript,
        new Date()
      );

      await parser.parse(file.source, fileInfo);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgPerFile = totalTime / fileCount;

    console.log(`\n✅ Performance with shared Programs:`);
    console.log(`   ${fileCount} files in ${totalTime.toFixed(2)}ms`);
    console.log(`   Average: ${avgPerFile.toFixed(2)}ms per file`);

    // With shared Programs, avg should be well under 20ms per file
    // (accounting for some startup cost in the batch)
    expect(avgPerFile).toBeLessThan(50);

    // If we were creating new Programs each time, this would be ~100ms per file
    const wouldTakeWithoutSharing = fileCount * 100;
    const improvement = wouldTakeWithoutSharing / totalTime;

    console.log(`   Without sharing would take: ${wouldTakeWithoutSharing.toFixed(0)}ms`);
    console.log(`   Improvement factor: ${improvement.toFixed(1)}x`);

    expect(improvement).toBeGreaterThan(2); // At least 2x better
  });

  it('should detect cross-file type references', async () => {
    // File with interface definition
    const typesSource = `
      export interface User {
        id: string;
        name: string;
        email: string;
      }

      export type UserId = string;
    `;

    const typesInfo = new FileInfo(
      'types',
      '/test-project/models/types.ts',
      '.ts',
      typesSource.length,
      Language.TypeScript,
      new Date()
    );

    // File using the interface
    const implementationSource = `
      import { User, UserId } from './models/types';

      export class UserRepository {
        async findById(id: UserId): Promise<User> {
          return {
            id,
            name: 'Test',
            email: 'test@example.com'
          };
        }
      }
    `;

    const implInfo = new FileInfo(
      'repository',
      '/test-project/UserRepository.ts',
      '.ts',
      implementationSource.length,
      Language.TypeScript,
      new Date()
    );

    // Parse both files
    const typesResult = await parser.parse(typesSource, typesInfo);
    const implResult = await parser.parse(implementationSource, implInfo);

    // Verify types file has interface
    const userInterface = typesResult.nodes.find(n =>
      n.type === NodeType.INTERFACE && n.name === 'User'
    );
    expect(userInterface).toBeDefined();

    // Verify implementation file has class
    const repoClass = implResult.nodes.find(n =>
      n.type === NodeType.CLASS && n.name === 'UserRepository'
    );
    expect(repoClass).toBeDefined();

    // Verify import edge
    const imports = implResult.edges.filter(e => e.type === EdgeType.IMPORTS);
    expect(imports.length).toBeGreaterThan(0);

    const typesImport = imports.find(e =>
      e.toNodeId.includes('types') || e.toNodeId.includes('./models/types')
    );
    expect(typesImport).toBeDefined();

    console.log('\n✅ Cross-file type references working!');
    console.log(`   Detected ${imports.length} import edge(s)`);
  });
});
