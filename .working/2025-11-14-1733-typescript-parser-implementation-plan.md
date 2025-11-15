# TypeScript Parser Implementation Plan

**Generated**: 2025-11-14 17:33 PST
**Project**: c3-parsing
**Scope**: TypeScript/JavaScript AST Parsing
**Timeline**: 3 Phases (~4-6 weeks)

---

## Executive Summary

This document outlines a three-phase implementation plan to replace the stub TypeScript parser with a fully functional AST-based parser using the TypeScript Compiler API via ts-morph. The plan focuses on delivering a working TypeScript parser with full reparse capability, laying the groundwork for future incremental parsing support.

**Key Decisions**:
- **Single Language Focus**: TypeScript/JavaScript only
- **Parser Library**: ts-morph (TypeScript Compiler API wrapper)
- **Parsing Strategy**: Full reparse (incremental parsing in future release)
- **Architecture**: Maintain existing ports/adapters pattern
- **Testing**: Comprehensive test suite from Phase 1

---

## Phase 1: Foundation & Architecture

**Duration**: 1-2 weeks
**Goal**: Establish the architectural foundation for real AST parsing while maintaining backward compatibility

### Objectives
1. Create unified AST representation for TypeScript
2. Implement abstract base parser class
3. Set up testing infrastructure
4. Maintain backward compatibility with stub parser

### Filesystem Structure (End of Phase 1)

```
c3-parsing/
├── src/
│   ├── application/
│   │   ├── dto/
│   │   └── use-cases/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── PropertyGraph.ts
│   │   │   ├── Node.ts
│   │   │   ├── Edge.ts
│   │   │   ├── FileInfo.ts
│   │   │   └── ast/                           [NEW]
│   │   │       ├── UnifiedAST.ts              [NEW]
│   │   │       ├── ASTNode.ts                 [NEW]
│   │   │       └── SourceLocation.ts          [NEW]
│   │   ├── ports/
│   │   │   ├── Parser.ts                      [MODIFIED]
│   │   │   ├── ASTTransformer.ts              [NEW]
│   │   │   └── SymbolExtractor.ts             [NEW]
│   │   ├── services/
│   │   │   ├── ParsingService.ts
│   │   │   ├── GraphBuilder.ts
│   │   │   ├── NodeFactory.ts
│   │   │   ├── EdgeDetector.ts
│   │   │   └── ast/                           [NEW]
│   │   │       ├── ASTNormalizer.ts           [NEW]
│   │   │       └── GraphConverter.ts          [NEW]
│   │   └── value-objects/
│   │       ├── NodeType.ts                    [EXTENDED]
│   │       ├── EdgeType.ts
│   │       ├── Language.ts
│   │       └── SymbolKind.ts                  [NEW]
│   └── infrastructure/
│       ├── adapters/
│       │   ├── TypeScriptParser.ts            [STUB - KEPT]
│       │   ├── PythonParser.ts
│       │   ├── parsers/                       [NEW]
│       │   │   └── base/                      [NEW]
│       │   │       ├── BaseParser.ts          [NEW]
│       │   │       └── ParserFactory.ts       [NEW]
│       │   └── shared/                        [NEW]
│       │       └── FeatureFlags.ts            [NEW]
│       └── persistence/
├── tests/                                      [NEW]
│   ├── fixtures/                              [NEW]
│   │   └── typescript/                        [NEW]
│   │       ├── simple-class.ts                [NEW]
│   │       ├── complex-module.ts              [NEW]
│   │       └── edge-cases.ts                  [NEW]
│   ├── unit/                                  [NEW]
│   │   └── domain/                            [NEW]
│   │       └── ast/                           [NEW]
│   │           └── UnifiedAST.test.ts         [NEW]
│   └── test-utils/                            [NEW]
│       └── helpers.ts                         [NEW]
├── package.json                               [MODIFIED]
├── tsconfig.json
└── vitest.config.ts                           [NEW]
```

### Implementation Details

#### 1.1 Unified AST Structure
```typescript
// src/domain/entities/ast/UnifiedAST.ts
export interface UnifiedAST {
  root: ASTNode;
  language: Language;
  sourceFile: string;
  diagnostics: Diagnostic[];
  symbols: Map<string, Symbol>;
}

// src/domain/entities/ast/ASTNode.ts
export interface ASTNode {
  id: string;
  kind: ASTNodeKind;
  text?: string;
  children: ASTNode[];
  location: SourceLocation;
  metadata: Record<string, any>;
}

// src/domain/entities/ast/SourceLocation.ts
export interface SourceLocation {
  start: Position;
  end: Position;
  file: string;
}

export interface Position {
  line: number;
  column: number;
  offset: number;
}
```

#### 1.2 Base Parser Implementation
```typescript
// src/infrastructure/adapters/parsers/base/BaseParser.ts
export abstract class BaseParser<TLanguageAST> implements Parser {
  constructor(
    protected readonly logger: Logger,
    protected readonly nodeFactory: NodeFactory,
    protected readonly edgeDetector: EdgeDetector
  ) {}

  async parse(source: string, fileInfo: FileInfo): Promise<ParseResult> {
    try {
      // Step 1: Parse to language-specific AST
      const languageAST = await this.parseToLanguageAST(source, fileInfo);

      // Step 2: Transform to unified AST
      const unifiedAST = await this.transformToUnified(languageAST, fileInfo);

      // Step 3: Convert to graph elements
      const graphElements = await this.convertToGraph(unifiedAST, fileInfo);

      return graphElements;
    } catch (error) {
      this.logger.error('Parse failed', error as Error);
      throw new ParserError('Failed to parse file', fileInfo, error);
    }
  }

  protected abstract parseToLanguageAST(
    source: string,
    fileInfo: FileInfo
  ): Promise<TLanguageAST>;

  protected abstract transformToUnified(
    ast: TLanguageAST,
    fileInfo: FileInfo
  ): Promise<UnifiedAST>;

  protected abstract convertToGraph(
    ast: UnifiedAST,
    fileInfo: FileInfo
  ): Promise<ParseResult>;
}
```

#### 1.3 Feature Flags
```typescript
// src/infrastructure/adapters/shared/FeatureFlags.ts
export interface ParserFeatureFlags {
  useRealTypeScriptParser: boolean;
  enableDiagnostics: boolean;
  includeComments: boolean;
  resolveSymbols: boolean;
}

export const DEFAULT_FLAGS: ParserFeatureFlags = {
  useRealTypeScriptParser: false, // Start with stub
  enableDiagnostics: false,
  includeComments: false,
  resolveSymbols: false
};
```

#### 1.4 Test Infrastructure
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist', 'tests']
    }
  }
});

// tests/test-utils/helpers.ts
export function createTestFileInfo(path: string): FileInfo {
  return new FileInfo(
    `file-${Date.now()}`,
    path,
    '.ts',
    100,
    Language.TypeScript,
    new Date()
  );
}

export async function parseTestFile(
  parser: Parser,
  fixtureName: string
): Promise<ParseResult> {
  const source = await readFixture(fixtureName);
  const fileInfo = createTestFileInfo(fixtureName);
  return parser.parse(source, fileInfo);
}
```

### Acceptance Criteria

✅ **Architecture**
- [ ] BaseParser abstract class implemented and tested
- [ ] UnifiedAST data structures defined with full TypeScript types
- [ ] Feature flags system operational
- [ ] Backward compatibility maintained (stub parser still works)

✅ **Testing**
- [ ] Test infrastructure set up with Vitest
- [ ] At least 5 TypeScript test fixtures created
- [ ] Unit tests for UnifiedAST operations
- [ ] Test helpers and utilities implemented

✅ **Documentation**
- [ ] API documentation for new interfaces
- [ ] Migration notes for future parser implementers
- [ ] README updated with architecture overview

✅ **Quality Gates**
- [ ] TypeScript compilation passes with strict mode
- [ ] ESLint configured and passing
- [ ] 100% test pass rate (existing functionality)
- [ ] CI pipeline updated to run new tests

### Validation Steps

1. **Code Review Checklist**
   - [ ] All new interfaces have JSDoc comments
   - [ ] No breaking changes to existing API
   - [ ] Feature flags properly control new features
   - [ ] Error handling implemented consistently

2. **Testing Validation**
   ```bash
   npm run test              # All tests pass
   npm run typecheck         # No TypeScript errors
   npm run build             # Build succeeds
   ```

3. **Integration Validation**
   - Create simple test app using the library
   - Verify stub parser still works
   - Confirm no runtime errors with existing code

### Cleanup Tasks

- [ ] Remove any experimental code not ready for commit
- [ ] Update .gitignore with new test output directories
- [ ] Document any technical debt introduced
- [ ] Create issues for known limitations

---

## Phase 2: TypeScript Parser Implementation

**Duration**: 2 weeks
**Goal**: Implement fully functional TypeScript parser using ts-morph

### Objectives
1. Implement TypeScript AST parsing with ts-morph
2. Create comprehensive symbol extraction
3. Build accurate edge detection for dependencies
4. Achieve feature parity with design requirements

### Filesystem Structure (End of Phase 2)

```
c3-parsing/
├── src/
│   ├── application/
│   │   ├── dto/
│   │   └── use-cases/
│   ├── domain/
│   │   ├── entities/
│   │   ├── ports/
│   │   ├── services/
│   │   │   ├── ParsingService.ts              [MODIFIED]
│   │   │   ├── GraphBuilder.ts
│   │   │   ├── NodeFactory.ts                 [ENHANCED]
│   │   │   ├── EdgeDetector.ts                [ENHANCED]
│   │   │   └── ast/
│   │   │       ├── ASTNormalizer.ts
│   │   │       ├── GraphConverter.ts
│   │   │       ├── SymbolResolver.ts          [NEW]
│   │   │       └── DependencyAnalyzer.ts      [NEW]
│   │   └── value-objects/
│   └── infrastructure/
│       ├── adapters/
│       │   ├── TypeScriptParser.ts            [STUB - DEPRECATED]
│       │   ├── parsers/
│       │   │   ├── base/
│       │   │   │   ├── BaseParser.ts
│       │   │   │   └── ParserFactory.ts       [MODIFIED]
│       │   │   └── typescript/                [NEW]
│       │   │       ├── TypeScriptParserImpl.ts [NEW]
│       │   │       ├── TSASTTransformer.ts    [NEW]
│       │   │       ├── TSSymbolExtractor.ts   [NEW]
│       │   │       ├── TSEdgeDetector.ts      [NEW]
│       │   │       ├── TSGraphConverter.ts    [NEW]
│       │   │       └── helpers/               [NEW]
│       │   │           ├── TSNodeUtils.ts     [NEW]
│       │   │           ├── TSTypeUtils.ts     [NEW]
│       │   │           └── TSImportResolver.ts [NEW]
│       │   └── shared/
│       │       ├── FeatureFlags.ts
│       │       └── ParserCache.ts             [NEW]
│       └── persistence/
├── tests/
│   ├── fixtures/
│   │   └── typescript/
│   │       ├── classes/                       [NEW]
│   │       ├── functions/                     [NEW]
│   │       ├── imports/                       [NEW]
│   │       └── complex/                       [NEW]
│   ├── unit/
│   │   ├── domain/
│   │   └── infrastructure/                    [NEW]
│   │       └── parsers/                       [NEW]
│   │           └── typescript/                [NEW]
│   │               ├── TypeScriptParserImpl.test.ts [NEW]
│   │               ├── TSSymbolExtractor.test.ts    [NEW]
│   │               └── TSEdgeDetector.test.ts       [NEW]
│   └── integration/                           [NEW]
│       └── typescript-parsing.test.ts         [NEW]
├── benchmarks/                                 [NEW]
│   └── parser-performance.ts                  [NEW]
├── package.json                               [MODIFIED]
└── tsconfig.json
```

### Implementation Details

#### 2.1 TypeScript Parser Implementation
```typescript
// src/infrastructure/adapters/parsers/typescript/TypeScriptParserImpl.ts
import { Project, SourceFile, Node, ts } from 'ts-morph';

export class TypeScriptParserImpl extends BaseParser<SourceFile> {
  private project: Project;
  private symbolExtractor: TSSymbolExtractor;
  private edgeDetector: TSEdgeDetector;
  private astTransformer: TSASTTransformer;

  constructor(
    logger: Logger,
    nodeFactory: NodeFactory,
    edgeDetector: EdgeDetector,
    compilerOptions?: ts.CompilerOptions
  ) {
    super(logger, nodeFactory, edgeDetector);

    this.project = new Project({
      compilerOptions: compilerOptions || {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      }
    });

    this.symbolExtractor = new TSSymbolExtractor(this.project);
    this.edgeDetector = new TSEdgeDetector();
    this.astTransformer = new TSASTTransformer();
  }

  protected async parseToLanguageAST(
    source: string,
    fileInfo: FileInfo
  ): Promise<SourceFile> {
    const sourceFile = this.project.createSourceFile(
      fileInfo.path,
      source,
      { overwrite: true }
    );

    // Get diagnostics
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    if (diagnostics.length > 0) {
      this.logger.warn('TypeScript diagnostics found', {
        file: fileInfo.path,
        count: diagnostics.length
      });
    }

    return sourceFile;
  }

  protected async transformToUnified(
    sourceFile: SourceFile,
    fileInfo: FileInfo
  ): Promise<UnifiedAST> {
    return this.astTransformer.transform(sourceFile, fileInfo);
  }

  protected async convertToGraph(
    ast: UnifiedAST,
    fileInfo: FileInfo
  ): Promise<ParseResult> {
    const converter = new TSGraphConverter(
      this.nodeFactory,
      this.edgeDetector
    );
    return converter.convert(ast, fileInfo);
  }
}
```

#### 2.2 Symbol Extraction
```typescript
// src/infrastructure/adapters/parsers/typescript/TSSymbolExtractor.ts
export class TSSymbolExtractor {
  constructor(private project: Project) {}

  extractSymbols(sourceFile: SourceFile): ExtractedSymbols {
    const symbols: ExtractedSymbols = {
      classes: [],
      interfaces: [],
      functions: [],
      variables: [],
      types: [],
      enums: [],
      imports: [],
      exports: []
    };

    // Extract classes
    sourceFile.getClasses().forEach(cls => {
      symbols.classes.push({
        name: cls.getName() || 'AnonymousClass',
        kind: SymbolKind.Class,
        location: this.getLocation(cls),
        modifiers: this.getModifiers(cls),
        members: this.extractClassMembers(cls),
        extends: cls.getExtends()?.getText(),
        implements: cls.getImplements().map(i => i.getText())
      });
    });

    // Extract interfaces
    sourceFile.getInterfaces().forEach(iface => {
      symbols.interfaces.push({
        name: iface.getName(),
        kind: SymbolKind.Interface,
        location: this.getLocation(iface),
        members: this.extractInterfaceMembers(iface),
        extends: iface.getExtends().map(e => e.getText())
      });
    });

    // Extract functions
    sourceFile.getFunctions().forEach(func => {
      symbols.functions.push({
        name: func.getName() || 'AnonymousFunction',
        kind: SymbolKind.Function,
        location: this.getLocation(func),
        parameters: this.extractParameters(func),
        returnType: func.getReturnType().getText(),
        isAsync: func.isAsync(),
        isGenerator: func.isGenerator()
      });
    });

    // Extract imports
    sourceFile.getImportDeclarations().forEach(imp => {
      symbols.imports.push({
        moduleSpecifier: imp.getModuleSpecifierValue(),
        namedImports: imp.getNamedImports().map(n => ({
          name: n.getName(),
          alias: n.getAliasNode()?.getText()
        })),
        defaultImport: imp.getDefaultImport()?.getText(),
        namespaceImport: imp.getNamespaceImport()?.getText()
      });
    });

    return symbols;
  }

  private getLocation(node: Node): SourceLocation {
    const start = node.getStartLinePos();
    const end = node.getEndLinePos();
    const sourceFile = node.getSourceFile();

    return {
      start: {
        line: sourceFile.getLineAndColumnAtPos(start).line,
        column: sourceFile.getLineAndColumnAtPos(start).column,
        offset: start
      },
      end: {
        line: sourceFile.getLineAndColumnAtPos(end).line,
        column: sourceFile.getLineAndColumnAtPos(end).column,
        offset: end
      },
      file: sourceFile.getFilePath()
    };
  }
}
```

#### 2.3 Edge Detection
```typescript
// src/infrastructure/adapters/parsers/typescript/TSEdgeDetector.ts
export class TSEdgeDetector {
  detectEdges(sourceFile: SourceFile): DetectedEdge[] {
    const edges: DetectedEdge[] = [];

    // Detect import dependencies
    sourceFile.getImportDeclarations().forEach(imp => {
      edges.push({
        type: EdgeType.IMPORTS,
        source: sourceFile.getFilePath(),
        target: this.resolveImportPath(imp),
        metadata: {
          importType: this.getImportType(imp)
        }
      });
    });

    // Detect inheritance relationships
    sourceFile.getClasses().forEach(cls => {
      const extendsExpr = cls.getExtends();
      if (extendsExpr) {
        edges.push({
          type: EdgeType.EXTENDS,
          source: cls.getName() || 'AnonymousClass',
          target: extendsExpr.getText(),
          metadata: {}
        });
      }

      cls.getImplements().forEach(impl => {
        edges.push({
          type: EdgeType.IMPLEMENTS,
          source: cls.getName() || 'AnonymousClass',
          target: impl.getText(),
          metadata: {}
        });
      });
    });

    // Detect function calls
    sourceFile.getDescendantsOfKind(ts.SyntaxKind.CallExpression).forEach(call => {
      const expression = call.getExpression();
      if (expression.getKind() === ts.SyntaxKind.Identifier) {
        edges.push({
          type: EdgeType.CALLS,
          source: this.getContainingFunction(call),
          target: expression.getText(),
          metadata: {
            arguments: call.getArguments().length
          }
        });
      }
    });

    return edges;
  }

  private resolveImportPath(imp: ImportDeclaration): string {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    // TODO: Resolve relative paths and node_modules
    return moduleSpecifier;
  }
}
```

### Acceptance Criteria

✅ **Core Functionality**
- [ ] Parse real TypeScript files without errors
- [ ] Extract all major symbol types (classes, functions, interfaces, etc.)
- [ ] Detect import/export relationships accurately
- [ ] Generate valid PropertyGraph from parsed AST

✅ **Symbol Extraction**
- [ ] Classes with members, inheritance, and interfaces
- [ ] Functions with parameters and return types
- [ ] Variables with types and initializers
- [ ] Type aliases and interfaces
- [ ] Enums and constants
- [ ] Import/export statements

✅ **Edge Detection**
- [ ] Import dependencies (ES6 and CommonJS)
- [ ] Inheritance relationships (extends)
- [ ] Interface implementations
- [ ] Function calls
- [ ] Variable references
- [ ] Type references

✅ **Performance**
- [ ] Parse 100 files < 5 seconds
- [ ] Memory usage < 500MB for 1000 files
- [ ] No memory leaks during extended parsing

✅ **Testing**
- [ ] 50+ unit tests for parser components
- [ ] 20+ integration tests for end-to-end parsing
- [ ] Test coverage > 80%
- [ ] All test fixtures parse successfully

### Validation Steps

1. **Functional Testing**
   ```bash
   # Run all tests
   npm test

   # Run integration tests specifically
   npm run test:integration

   # Check coverage
   npm run test:coverage
   ```

2. **Performance Validation**
   ```bash
   # Run benchmarks
   npm run benchmark

   # Memory profiling
   node --expose-gc benchmarks/memory-test.js
   ```

3. **Real-World Testing**
   - Parse the c3-parsing codebase itself
   - Parse a medium-sized TypeScript project (1000+ files)
   - Verify graph accuracy with manual inspection

4. **Comparison Testing**
   ```typescript
   // Compare with stub output structure
   const stubResult = await stubParser.parse(source, fileInfo);
   const realResult = await realParser.parse(source, fileInfo);

   // Verify compatible structure
   expect(realResult).toMatchStructure(stubResult);
   ```

### Cleanup Tasks

- [ ] Remove console.log statements
- [ ] Optimize import statements
- [ ] Add performance metrics logging
- [ ] Document known limitations
- [ ] Create migration guide from stub to real parser

---

## Phase 3: Integration & Production Ready

**Duration**: 1-2 weeks
**Goal**: Polish, optimize, and prepare for production use

### Objectives
1. Complete feature flag migration from stub to real parser
2. Implement caching layer for performance
3. Add comprehensive error handling and recovery
4. Update documentation and examples
5. Prepare for npm release

### Filesystem Structure (End of Phase 3)

```
c3-parsing/
├── src/
│   ├── application/
│   │   ├── dto/
│   │   └── use-cases/
│   │       ├── ParseFile.ts                   [UPDATED]
│   │       ├── ParseCodebase.ts               [UPDATED]
│   │       └── ClearCache.ts                  [UPDATED]
│   ├── domain/
│   │   ├── entities/
│   │   ├── ports/
│   │   │   ├── Parser.ts
│   │   │   ├── Cache.ts                       [IMPLEMENTED]
│   │   │   └── ErrorReporter.ts               [NEW]
│   │   ├── services/
│   │   │   ├── ParsingService.ts              [PRODUCTION]
│   │   │   └── ast/
│   │   └── value-objects/
│   └── infrastructure/
│       ├── adapters/
│       │   ├── TypeScriptParser.ts            [REMOVED]
│       │   ├── PythonParser.ts                [REMOVED]
│       │   ├── parsers/
│       │   │   ├── base/
│       │   │   ├── typescript/
│       │   │   │   ├── TypeScriptParserImpl.ts [PRODUCTION]
│       │   │   │   ├── index.ts               [NEW]
│       │   │   │   └── [all supporting files]
│       │   │   └── index.ts                   [NEW]
│       │   ├── cache/                         [NEW]
│       │   │   ├── MemoryCache.ts             [NEW]
│       │   │   ├── FileCache.ts               [NEW]
│       │   │   └── CacheManager.ts            [NEW]
│       │   └── shared/
│       │       ├── FeatureFlags.ts            [REMOVED]
│       │       ├── ErrorHandler.ts            [NEW]
│       │       └── PerformanceMonitor.ts      [NEW]
│       └── persistence/
├── tests/
│   ├── fixtures/
│   ├── unit/
│   ├── integration/
│   ├── e2e/                                   [NEW]
│   │   ├── real-projects/                     [NEW]
│   │   └── performance/                       [NEW]
│   └── snapshots/                             [NEW]
├── examples/                                   [NEW]
│   ├── basic-usage.ts                         [NEW]
│   ├── parse-project.ts                       [NEW]
│   └── analyze-dependencies.ts                [NEW]
├── docs/                                       [NEW]
│   ├── API.md                                 [NEW]
│   ├── MIGRATION.md                           [NEW]
│   └── ARCHITECTURE.md                        [NEW]
├── benchmarks/
│   ├── results/                               [NEW]
│   └── [benchmark files]
├── .github/
│   └── workflows/
│       └── ci.yml                             [UPDATED]
├── package.json                               [PRODUCTION]
├── README.md                                  [UPDATED]
├── CHANGELOG.md                               [NEW]
└── tsconfig.json
```

### Implementation Details

#### 3.1 Cache Implementation
```typescript
// src/infrastructure/adapters/cache/CacheManager.ts
export class CacheManager implements Cache {
  private memoryCache: MemoryCache;
  private fileCache?: FileCache;
  private stats: CacheStats;

  constructor(options: CacheOptions) {
    this.memoryCache = new MemoryCache({
      maxSize: options.memoryCacheSize || 100 * 1024 * 1024, // 100MB
      ttl: options.ttl || 3600000 // 1 hour
    });

    if (options.enableFileCache) {
      this.fileCache = new FileCache({
        directory: options.cacheDirectory || '.c3-cache',
        maxSize: options.fileCacheSize || 1024 * 1024 * 1024 // 1GB
      });
    }

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  async get(key: string): Promise<ParseResult | null> {
    // Try memory cache first
    let result = await this.memoryCache.get(key);
    if (result) {
      this.stats.hits++;
      return result;
    }

    // Try file cache
    if (this.fileCache) {
      result = await this.fileCache.get(key);
      if (result) {
        this.stats.hits++;
        // Promote to memory cache
        await this.memoryCache.set(key, result);
        return result;
      }
    }

    this.stats.misses++;
    return null;
  }

  async set(key: string, value: ParseResult): Promise<void> {
    await this.memoryCache.set(key, value);

    if (this.fileCache) {
      // Async write to file cache
      this.fileCache.set(key, value).catch(err => {
        this.logger.warn('Failed to write to file cache', err);
      });
    }
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses)
    };
  }
}
```

#### 3.2 Error Handling
```typescript
// src/infrastructure/adapters/shared/ErrorHandler.ts
export class ParserErrorHandler implements ErrorReporter {
  private errors: ParserError[] = [];
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy>;

  handleError(error: Error, context: ParseContext): RecoveryResult {
    const parserError = this.categorizeError(error, context);
    this.errors.push(parserError);

    const strategy = this.recoveryStrategies.get(parserError.type);
    if (strategy) {
      return strategy.recover(parserError, context);
    }

    return {
      recovered: false,
      fallbackResult: this.createFallbackResult(context)
    };
  }

  private categorizeError(error: Error, context: ParseContext): ParserError {
    if (error.message.includes('Syntax')) {
      return new SyntaxError(error, context);
    }
    if (error.message.includes('Memory')) {
      return new MemoryError(error, context);
    }
    return new UnknownParserError(error, context);
  }

  getReport(): ErrorReport {
    return {
      totalErrors: this.errors.length,
      byType: this.groupErrorsByType(),
      byFile: this.groupErrorsByFile(),
      critical: this.errors.filter(e => e.severity === 'critical')
    };
  }
}
```

#### 3.3 Production Parser Service
```typescript
// src/domain/services/ParsingService.ts
export class ParsingService {
  private parser: Parser;
  private cache: CacheManager;
  private errorHandler: ErrorHandler;
  private performanceMonitor: PerformanceMonitor;

  constructor(
    parser: Parser,
    graphRepository: GraphRepository,
    fileSystem: FileSystem,
    logger: Logger,
    options: ParsingOptions = {}
  ) {
    this.parser = parser;
    this.cache = new CacheManager(options.cache || {});
    this.errorHandler = new ErrorHandler(logger);
    this.performanceMonitor = new PerformanceMonitor();
  }

  async parseFile(filePath: string): Promise<ParseResult> {
    const cacheKey = this.getCacheKey(filePath);

    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit', { filePath });
      return cached;
    }

    // Parse with monitoring
    const startTime = performance.now();

    try {
      const source = await this.fileSystem.readFile(filePath);
      const fileInfo = await this.fileSystem.getFileInfo(filePath);

      const result = await this.parser.parse(source, fileInfo);

      // Cache successful parse
      await this.cache.set(cacheKey, result);

      // Record metrics
      this.performanceMonitor.recordParse({
        file: filePath,
        duration: performance.now() - startTime,
        nodeCount: result.nodes.length,
        edgeCount: result.edges.length
      });

      return result;
    } catch (error) {
      const recovery = this.errorHandler.handleError(error as Error, {
        file: filePath,
        stage: 'parsing'
      });

      if (recovery.recovered) {
        return recovery.fallbackResult;
      }

      throw error;
    }
  }

  async parseCodebase(rootPath: string): Promise<PropertyGraph> {
    this.logger.info('Starting codebase parse', { rootPath });

    const files = await this.fileSystem.findFiles(rootPath, {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      exclude: ['node_modules', 'dist', '.git']
    });

    const graphBuilder = new GraphBuilder();
    graphBuilder.start({
      codebaseId: rootPath,
      parsedAt: new Date(),
      language: 'typescript',
      version: '1.0.0'
    });

    // Parse files with concurrency control
    const results = await this.parseFilesWithConcurrency(files, {
      maxConcurrency: 10,
      onProgress: (current, total) => {
        this.logger.info(`Parsing progress: ${current}/${total}`);
      }
    });

    // Build graph from results
    for (const result of results) {
      for (const node of result.nodes) {
        graphBuilder.addNode(node);
      }
      for (const edge of result.edges) {
        graphBuilder.addEdge(edge);
      }
    }

    const graph = graphBuilder.build();

    // Save to repository
    await this.graphRepository.save(graph);

    // Log summary
    this.logger.info('Parsing complete', {
      files: files.length,
      nodes: graph.getNodeCount(),
      edges: graph.getEdgeCount(),
      cacheStats: this.cache.getStats(),
      performance: this.performanceMonitor.getSummary()
    });

    return graph;
  }
}
```

#### 3.4 Updated Package Configuration
```json
// package.json
{
  "name": "c3-parsing",
  "version": "1.0.0",
  "description": "TypeScript/JavaScript code parsing and property graph construction",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./typescript": {
      "types": "./dist/infrastructure/adapters/parsers/typescript/index.d.ts",
      "import": "./dist/infrastructure/adapters/parsers/typescript/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "benchmark": "tsx benchmarks/parser-performance.ts",
    "prepublishOnly": "npm run build && npm run test"
  },
  "dependencies": {
    "ts-morph": "^21.0.0",
    "lru-cache": "^10.0.0"
  },
  "peerDependencies": {
    "c3-shared": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4",
    "@vitest/coverage-v8": "^1.0.4",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "tsx": "^4.0.0"
  }
}
```

### Acceptance Criteria

✅ **Production Readiness**
- [ ] All stub code removed
- [ ] Real parser is default (no feature flags)
- [ ] Cache implementation working
- [ ] Error recovery implemented
- [ ] Performance meets targets

✅ **Quality Assurance**
- [ ] Test coverage > 90%
- [ ] No critical bugs
- [ ] Memory leaks fixed
- [ ] Performance benchmarks passing
- [ ] E2E tests with real projects

✅ **Documentation**
- [ ] README updated with real examples
- [ ] API documentation complete
- [ ] Migration guide written
- [ ] Architecture documentation
- [ ] CHANGELOG created

✅ **Release Preparation**
- [ ] Version bumped to 1.0.0
- [ ] NPM package configuration correct
- [ ] CI/CD pipeline fully green
- [ ] Security audit passed
- [ ] License verified

### Validation Steps

1. **Full System Test**
   ```bash
   # Clean build
   rm -rf dist node_modules
   npm install
   npm run build

   # Run all tests
   npm run test
   npm run test:integration
   npm run test:e2e

   # Check coverage
   npm run test:coverage
   # Should be > 90%

   # Run benchmarks
   npm run benchmark
   # Should meet performance targets
   ```

2. **Real Project Testing**
   ```typescript
   // Test with c3-parsing itself
   const parser = new TypeScriptParserImpl();
   const graph = await parser.parseCodebase('./src');

   // Verify graph completeness
   expect(graph.getNodeCount()).toBeGreaterThan(50);
   expect(graph.getEdgeCount()).toBeGreaterThan(100);
   ```

3. **Memory & Performance Validation**
   ```bash
   # Memory leak test
   node --expose-gc tests/memory/leak-test.js

   # Large project test
   npm run benchmark -- --project ../large-typescript-project

   # Stress test
   npm run test:e2e -- --stress
   ```

4. **Package Testing**
   ```bash
   # Test npm package locally
   npm pack
   cd /tmp
   mkdir test-pkg
   cd test-pkg
   npm init -y
   npm install /path/to/c3-parsing-1.0.0.tgz

   # Create test file
   echo "import { TypeScriptParser } from 'c3-parsing/typescript';" > test.js
   node test.js
   ```

5. **Security Audit**
   ```bash
   npm audit
   npm audit fix
   ```

### Cleanup & Launch Tasks

#### Pre-Launch Checklist
- [ ] Remove all TODO comments
- [ ] Remove debug console.log statements
- [ ] Optimize imports (remove unused)
- [ ] Update all dependencies to latest stable
- [ ] Run prettier/formatter on entire codebase
- [ ] Ensure all files have proper headers/licenses

#### Documentation Updates
- [ ] Update README with real examples
- [ ] Add badges (build status, coverage, npm version)
- [ ] Create GitHub releases page content
- [ ] Write announcement blog post draft
- [ ] Update main c3-platform repo references

#### Final Validation
- [ ] Manual test of all examples
- [ ] Verify all links in documentation
- [ ] Check that dist/ folder is properly built
- [ ] Ensure .npmignore excludes test/dev files
- [ ] Validate package.json metadata

#### Release Process
```bash
# 1. Ensure everything is committed
git status

# 2. Run final tests
npm run test
npm run build

# 3. Update version
npm version major  # 0.1.0 -> 1.0.0

# 4. Create git tag
git tag -a v1.0.0 -m "Release v1.0.0: TypeScript AST Parser"

# 5. Push to GitHub
git push origin main --tags

# 6. Publish to NPM
npm publish

# 7. Create GitHub release
# Upload changelog and announcement
```

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ Foundation architecture in place
- ✅ Tests running with Vitest
- ✅ No breaking changes to existing API
- ✅ Team understanding of codebase improved

### Phase 2 Success Criteria
- ✅ Real TypeScript files parsing successfully
- ✅ Accurate symbol and dependency extraction
- ✅ Performance targets met
- ✅ 80%+ test coverage achieved

### Phase 3 Success Criteria
- ✅ Production-ready code
- ✅ 90%+ test coverage
- ✅ Documentation complete
- ✅ Successfully published to NPM
- ✅ Used by at least one real project

### Long-term Success Metrics (Post-Launch)
- 📊 NPM weekly downloads > 100
- 📊 GitHub stars > 50
- 📊 Zero critical bugs in first month
- 📊 Community contributions received
- 📊 Positive user feedback

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| ts-morph performance issues | Benchmark early, optimize hot paths | Consider Babel as fallback |
| Memory leaks in large projects | Implement streaming, clear caches | Add memory limits |
| Complex TypeScript features unsupported | Document limitations clearly | Gradual feature addition |
| Breaking changes in dependencies | Lock versions, test updates | Maintain compatibility layer |

### Schedule Risks

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| Phase 2 complexity underestimated | Start with MVP features | Extend timeline by 1 week |
| Testing takes longer than expected | Write tests in parallel with code | Reduce coverage target to 80% |
| Performance optimization needed | Profile early and often | Ship with "beta" performance flag |

---

## Appendix: Key Decisions

### Why ts-morph?
- Wraps TypeScript Compiler API with friendly interface
- Provides full type information
- Actively maintained
- Good documentation
- Used by many popular tools

### Why Full Reparse Initially?
- Simpler implementation
- Fewer edge cases
- Easier testing
- Can add incremental later without breaking changes
- Most projects are small enough that full reparse is fast

### Why Three Phases?
- Clear milestones
- Reduced risk per phase
- Early validation of approach
- Allows for course correction
- Matches typical sprint boundaries

---

## Conclusion

This three-phase implementation plan provides a clear path from the current stub implementation to a production-ready TypeScript AST parser. Each phase has well-defined objectives, clear acceptance criteria, and comprehensive validation steps.

The plan prioritizes:
1. **Correctness** over performance (can optimize later)
2. **Completeness** over features (full TypeScript support first)
3. **Stability** over innovation (proven approaches)
4. **Testability** throughout (TDD where possible)

By the end of Phase 3, c3-parsing will have a robust, performant, and well-tested TypeScript parser ready for production use, with a clear path for future enhancements including incremental parsing and additional language support.

---

**Document Location**: `/Users/samuelgleeson/dev/c3-parsing/.working/2025-11-14-1733-typescript-parser-implementation-plan.md`