# AST Parser Implementation Design Document

**Generated**: 2025-11-14 17:25 PST
**Project**: c3-parsing
**Version**: Design v1.0
**Author**: Architecture Team

---

## Executive Summary

This document outlines the design and implementation strategy for transitioning the c3-parsing library from stub implementations to fully functional AST parsers. The design focuses on performance, extensibility, and maintainability while preserving the existing clean architecture.

**Key Goals**:
- Replace stub parsers with real AST parsing
- Support multiple languages (TypeScript, Python, Go, Rust)
- Enable incremental parsing for large codebases
- Maintain architectural boundaries (ports/adapters pattern)
- Optimize for performance and memory efficiency

---

## Current State Analysis

### Existing Limitations
1. **Stub Implementations**: All parsers return hardcoded mock data
2. **No AST Processing**: Source code is not actually analyzed
3. **Missing Language Support**: Only TypeScript/Python shells exist
4. **No Incremental Updates**: Full reparse required for changes
5. **No Error Recovery**: Parser fails on invalid syntax
6. **Limited Metadata**: Minimal source location information

### Architecture Strengths
- Clean separation of concerns (DDD layers)
- Dependency injection ready
- Extensible parser interface
- Graph-based representation
- Builder pattern for construction

---

## Design Decision Matrix

### 1. AST Library Selection

#### Option A: TypeScript Compiler API (ts-morph wrapper) ⭐ RECOMMENDED
```typescript
import { Project, SourceFile } from 'ts-morph';
```

**Pros**:
- Official TypeScript AST support
- Full type information available
- Excellent documentation
- Active maintenance
- ts-morph simplifies API usage

**Cons**:
- TypeScript/JavaScript only
- Memory intensive for large projects
- Slower than some alternatives

**Trade-offs**:
- Accuracy vs Performance (chooses accuracy)
- Completeness vs Speed (chooses completeness)

#### Option B: Babel Parser
```typescript
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
```

**Pros**:
- Fast parsing
- Plugin system
- JSX/TSX support
- Smaller memory footprint

**Cons**:
- Limited type information
- Less accurate for TypeScript
- Requires multiple packages

#### Option C: Tree-sitter (Universal)
```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
```

**Pros**:
- Multi-language support
- Incremental parsing built-in
- Error recovery
- Consistent API across languages
- WebAssembly support

**Cons**:
- External dependency
- Less detailed type info
- Requires language grammars

#### Option D: Language Server Protocol
```typescript
import { createConnection } from 'vscode-languageserver';
```

**Pros**:
- IDE-level accuracy
- Real-time updates
- Multi-language via servers

**Cons**:
- Complex setup
- Requires external processes
- Overhead for batch processing

### Recommendation Summary
**Primary**: Tree-sitter for universal parsing
**Secondary**: TypeScript Compiler API for deep TS analysis
**Hybrid Approach**: Use both based on requirements

---

### 2. Unified AST Representation

#### Option A: Custom Intermediate Representation (IR) ⭐ RECOMMENDED
```typescript
interface UnifiedASTNode {
  id: string;
  type: UnifiedNodeType;
  range: SourceRange;
  children: UnifiedASTNode[];
  metadata: Record<string, any>;
  languageSpecific?: any;
}
```

**Pros**:
- Language agnostic
- Consistent graph generation
- Optimized for our use case
- Extensible metadata

**Cons**:
- Translation overhead
- Potential information loss
- Maintenance burden

#### Option B: Direct Language ASTs
```typescript
type ASTNode = TSNode | PythonNode | GoNode;
```

**Pros**:
- No translation needed
- Full fidelity
- Language-specific features

**Cons**:
- Complex graph generation
- Inconsistent handling
- Difficult cross-language analysis

#### Option C: UAST (Universal AST)
```typescript
import { UAST } from 'babelfish';
```

**Pros**:
- Industry standard attempt
- Some tool support

**Cons**:
- Limited adoption
- Incomplete specifications
- External dependency

---

### 3. Incremental Parsing Strategy

#### Option A: File-Level Caching ⭐ RECOMMENDED
```typescript
interface ParseCache {
  fileHash: string;
  ast: UnifiedAST;
  graph: PartialGraph;
  timestamp: Date;
}
```

**Pros**:
- Simple implementation
- Effective for most changes
- Easy cache invalidation

**Cons**:
- Reparse entire files
- Memory usage for cache

#### Option B: Tree-sitter Incremental
```typescript
tree.edit({
  startIndex: edit.start,
  oldEndIndex: edit.oldEnd,
  newEndIndex: edit.newEnd,
  startPosition: edit.startPos,
  oldEndPosition: edit.oldEndPos,
  newEndPosition: edit.newEndPos
});
```

**Pros**:
- True incremental parsing
- Minimal reparsing
- Built into Tree-sitter

**Cons**:
- Complex edit tracking
- Tree-sitter specific

#### Option C: Diff-Based Updates
```typescript
const changes = diff(oldAST, newAST);
graph.applyChanges(changes);
```

**Pros**:
- Language agnostic
- Precise updates

**Cons**:
- Complex implementation
- Expensive diff computation

---

### 4. Error Recovery

#### Option A: Partial AST with Error Nodes ⭐ RECOMMENDED
```typescript
interface ErrorNode extends UnifiedASTNode {
  type: 'ERROR';
  expectedTypes?: string[];
  rawText: string;
}
```

**Pros**:
- Continue parsing after errors
- Preserve partial structure
- User-friendly error reporting

**Cons**:
- Incomplete graph regions
- Complex error handling

#### Option B: Skip Invalid Sections
**Pros**:
- Simple implementation
- Clean graph output

**Cons**:
- Loss of information
- Poor user experience

#### Option C: Fallback to Text Analysis
**Pros**:
- Always produces output
- Works with any file

**Cons**:
- Low quality results
- Inconsistent with valid parses

---

### 5. Performance Optimization

#### Option A: Worker Thread Pool ⭐ RECOMMENDED
```typescript
import { Worker } from 'worker_threads';

class ParserPool {
  private workers: Worker[];
  async parseFile(path: string): Promise<ParseResult> {
    const worker = await this.getAvailableWorker();
    return worker.parse(path);
  }
}
```

**Pros**:
- Parallel parsing
- Non-blocking main thread
- Scalable

**Cons**:
- Memory overhead
- IPC complexity

#### Option B: Streaming Parser
```typescript
const stream = createParseStream();
stream.on('node', (node) => graph.addNode(node));
```

**Pros**:
- Low memory usage
- Progressive results

**Cons**:
- Complex implementation
- Limited AST operations

#### Option C: Lazy Parsing
```typescript
class LazyAST {
  private unparsed: Map<string, string>;
  getNode(id: string): ASTNode {
    if (!this.parsed.has(id)) {
      this.parse(id);
    }
    return this.parsed.get(id);
  }
}
```

**Pros**:
- Parse only what's needed
- Fast initial load

**Cons**:
- Unpredictable performance
- Complex caching

---

## Filesystem Structure

### BEFORE: Current Structure
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
│   │   └── value-objects/
│   └── infrastructure/
│       ├── adapters/
│       │   ├── TypeScriptParser.ts    (STUB)
│       │   ├── PythonParser.ts        (STUB)
│       │   └── FilesystemParser.ts
│       └── persistence/
├── dist/
├── package.json
└── tsconfig.json
```

### AFTER: Proposed Structure
```
c3-parsing/
├── src/
│   ├── application/
│   │   ├── dto/
│   │   └── use-cases/
│   │       ├── ParseFile.ts
│   │       ├── ParseCodebase.ts
│   │       └── IncrementalUpdate.ts   [NEW]
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── PropertyGraph.ts
│   │   │   ├── Node.ts
│   │   │   ├── Edge.ts
│   │   │   └── UnifiedAST.ts          [NEW]
│   │   ├── ports/
│   │   │   ├── Parser.ts
│   │   │   ├── ASTTransformer.ts      [NEW]
│   │   │   ├── ParseCache.ts          [NEW]
│   │   │   └── LanguageAnalyzer.ts    [NEW]
│   │   ├── services/
│   │   │   ├── ParsingService.ts
│   │   │   ├── GraphBuilder.ts
│   │   │   ├── ASTNormalizer.ts       [NEW]
│   │   │   ├── SymbolResolver.ts      [NEW]
│   │   │   └── DependencyAnalyzer.ts  [NEW]
│   │   └── value-objects/
│   │       ├── NodeType.ts
│   │       ├── EdgeType.ts
│   │       ├── SourceRange.ts         [NEW]
│   │       └── SymbolKind.ts          [NEW]
│   └── infrastructure/
│       ├── adapters/
│       │   ├── parsers/                [NEW DIR]
│       │   │   ├── typescript/
│       │   │   │   ├── TypeScriptParser.ts      [REAL]
│       │   │   │   ├── TSCompilerAdapter.ts     [NEW]
│       │   │   │   ├── TSASTTransformer.ts      [NEW]
│       │   │   │   └── TSSymbolExtractor.ts     [NEW]
│       │   │   ├── python/
│       │   │   │   ├── PythonParser.ts          [REAL]
│       │   │   │   ├── PythonASTTransformer.ts  [NEW]
│       │   │   │   └── PythonSymbolExtractor.ts [NEW]
│       │   │   ├── universal/
│       │   │   │   ├── TreeSitterParser.ts      [NEW]
│       │   │   │   ├── TreeSitterAdapter.ts     [NEW]
│       │   │   │   └── grammars/                [NEW]
│       │   │   │       ├── typescript.wasm
│       │   │   │       ├── python.wasm
│       │   │   │       ├── go.wasm
│       │   │   │       └── rust.wasm
│       │   │   └── shared/
│       │   │       ├── BaseParser.ts            [NEW]
│       │   │       ├── ASTVisitor.ts            [NEW]
│       │   │       └── ErrorRecovery.ts         [NEW]
│       │   ├── cache/                  [NEW DIR]
│       │   │   ├── FileCache.ts
│       │   │   ├── MemoryCache.ts
│       │   │   └── RedisCache.ts
│       │   └── workers/                [NEW DIR]
│       │       ├── ParserWorker.ts
│       │       ├── WorkerPool.ts
│       │       └── worker-parser.js
│       └── persistence/
├── tests/                              [NEW DIR]
│   ├── fixtures/
│   │   ├── typescript/
│   │   ├── python/
│   │   └── edge-cases/
│   ├── unit/
│   ├── integration/
│   └── performance/
├── benchmarks/                         [NEW DIR]
│   ├── parser-performance.ts
│   └── memory-usage.ts
├── dist/
├── package.json                        [UPDATED]
├── tsconfig.json
└── vitest.config.ts                    [NEW]
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
```typescript
// 1. Create unified AST representation
interface UnifiedAST {
  root: UnifiedASTNode;
  language: Language;
  sourceFile: string;
  version: string;
}

// 2. Implement base parser abstract class
abstract class BaseParser implements Parser {
  abstract parseToAST(source: string): LanguageAST;
  abstract transformToUnified(ast: LanguageAST): UnifiedAST;

  async parse(source: string, fileInfo: FileInfo): Promise<ParseResult> {
    const ast = await this.parseToAST(source);
    const unified = this.transformToUnified(ast);
    return this.generateParseResult(unified);
  }
}

// 3. Set up worker thread infrastructure
class ParserWorkerPool {
  constructor(private workerCount: number = 4) {}
  // Implementation...
}
```

### Phase 2: TypeScript Parser (Week 3-4)
```typescript
// 1. Implement TypeScript Compiler API integration
import { Project, SourceFile, Node as TSNode } from 'ts-morph';

class RealTypeScriptParser extends BaseParser {
  private project: Project;

  constructor() {
    super();
    this.project = new Project({
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022
      }
    });
  }

  async parseToAST(source: string): Promise<SourceFile> {
    return this.project.createSourceFile('temp.ts', source);
  }

  transformToUnified(sourceFile: SourceFile): UnifiedAST {
    const transformer = new TSASTTransformer();
    return transformer.transform(sourceFile);
  }
}

// 2. Implement symbol extraction
class TSSymbolExtractor {
  extractSymbols(sourceFile: SourceFile): Symbol[] {
    const symbols: Symbol[] = [];

    // Extract classes
    sourceFile.getClasses().forEach(cls => {
      symbols.push({
        name: cls.getName(),
        kind: SymbolKind.Class,
        range: this.getRange(cls),
        modifiers: this.getModifiers(cls)
      });
    });

    // Extract functions, interfaces, etc.
    return symbols;
  }
}

// 3. Implement dependency detection
class TSDependencyAnalyzer {
  analyzeDependencies(sourceFile: SourceFile): Dependency[] {
    const imports = sourceFile.getImportDeclarations();
    return imports.map(imp => ({
      source: imp.getModuleSpecifierValue(),
      symbols: imp.getNamedImports().map(n => n.getName())
    }));
  }
}
```

### Phase 3: Tree-sitter Universal Parser (Week 5-6)
```typescript
// 1. Set up Tree-sitter with multiple languages
import Parser from 'web-tree-sitter';

class TreeSitterUniversalParser {
  private parsers: Map<Language, Parser> = new Map();

  async initialize() {
    await Parser.init();

    // Load language grammars
    const languages = ['typescript', 'python', 'go', 'rust'];
    for (const lang of languages) {
      const wasmPath = `./grammars/${lang}.wasm`;
      const language = await Parser.Language.load(wasmPath);
      const parser = new Parser();
      parser.setLanguage(language);
      this.parsers.set(lang, parser);
    }
  }

  parse(source: string, language: Language): Parser.Tree {
    const parser = this.parsers.get(language);
    return parser.parse(source);
  }
}

// 2. Implement incremental parsing
class IncrementalParser {
  private trees: Map<string, Parser.Tree> = new Map();

  updateFile(path: string, edits: Edit[]): Parser.Tree {
    const oldTree = this.trees.get(path);

    if (oldTree) {
      // Apply edits to existing tree
      for (const edit of edits) {
        oldTree.edit(edit);
      }

      // Reparse with old tree as base
      const newSource = this.getSource(path);
      const newTree = parser.parse(newSource, oldTree);
      this.trees.set(path, newTree);
      return newTree;
    }

    // Full parse if no cached tree
    return this.parseFile(path);
  }
}
```

### Phase 4: Caching & Performance (Week 7-8)
```typescript
// 1. Implement multi-level cache
class ParserCache {
  private memoryCache: MemoryCache;
  private fileCache: FileCache;
  private redisCache?: RedisCache;

  async get(key: string): Promise<ParseResult | null> {
    // L1: Memory
    let result = await this.memoryCache.get(key);
    if (result) return result;

    // L2: File
    result = await this.fileCache.get(key);
    if (result) {
      await this.memoryCache.set(key, result);
      return result;
    }

    // L3: Redis (if configured)
    if (this.redisCache) {
      result = await this.redisCache.get(key);
      if (result) {
        await this.memoryCache.set(key, result);
        await this.fileCache.set(key, result);
        return result;
      }
    }

    return null;
  }
}

// 2. Implement lazy parsing
class LazyPropertyGraph extends PropertyGraph {
  private unparsedFiles: Set<string> = new Set();

  async getNode(id: string): Promise<Node | undefined> {
    const node = super.getNode(id);

    if (!node && this.isUnparsedFile(id)) {
      await this.parseFile(id);
      return super.getNode(id);
    }

    return node;
  }
}
```

### Phase 5: Testing & Documentation (Week 9-10)
```typescript
// 1. Unit tests
describe('TypeScriptParser', () => {
  it('should parse class declarations', async () => {
    const source = `
      export class TestClass {
        constructor(private name: string) {}
        getName(): string { return this.name; }
      }
    `;

    const parser = new RealTypeScriptParser();
    const result = await parser.parse(source, fileInfo);

    expect(result.nodes).toHaveLength(3); // class, constructor, method
    expect(result.edges).toHaveLength(2); // contains edges
  });
});

// 2. Integration tests
describe('Incremental Parsing', () => {
  it('should update graph incrementally', async () => {
    // Test incremental updates
  });
});

// 3. Performance benchmarks
describe('Parser Performance', () => {
  it('should parse 1000 files under 10 seconds', async () => {
    const files = await loadBenchmarkFiles();
    const start = performance.now();

    await Promise.all(files.map(f => parser.parse(f)));

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10000);
  });
});
```

---

## Performance Targets

### Parsing Speed
- **Small files (<1KB)**: < 10ms
- **Medium files (1-10KB)**: < 50ms
- **Large files (10-100KB)**: < 200ms
- **Extra large (>100KB)**: < 1000ms

### Memory Usage
- **Base overhead**: < 50MB
- **Per file cached**: < 100KB
- **Large project (10k files)**: < 2GB

### Incremental Updates
- **Single file change**: < 100ms
- **Multi-file refactor**: < 1s
- **Cache hit ratio**: > 90%

---

## Error Handling Strategy

### Parser Errors
```typescript
class ParserError extends Error {
  constructor(
    message: string,
    public file: string,
    public line: number,
    public column: number,
    public severity: 'error' | 'warning'
  ) {
    super(message);
  }
}

class ErrorRecoveryStrategy {
  recover(error: ParserError, context: ParseContext): RecoveryAction {
    switch (error.severity) {
      case 'error':
        return this.recoverFromError(error, context);
      case 'warning':
        return this.continueWithWarning(error, context);
    }
  }

  private recoverFromError(error: ParserError, context: ParseContext) {
    // Skip to next valid statement/declaration
    // Create ERROR node in AST
    // Continue parsing
  }
}
```

### Graceful Degradation
1. **Syntax Error**: Create partial AST with ERROR nodes
2. **Unsupported Language**: Fall back to text analysis
3. **File Too Large**: Parse in chunks or sample
4. **Out of Memory**: Clear cache and retry
5. **Parser Crash**: Isolate in worker, restart

---

## Migration Plan

### Step 1: Parallel Implementation
- Keep stub parsers as fallback
- Implement real parsers alongside
- Feature flag for switching

### Step 2: Gradual Rollout
```typescript
class ParserFactory {
  createParser(language: Language, options: ParseOptions): Parser {
    if (options.useRealParser) {
      switch (language) {
        case 'typescript':
          return new RealTypeScriptParser();
        case 'python':
          return new RealPythonParser();
        default:
          return new TreeSitterUniversalParser(language);
      }
    }

    // Fallback to stubs
    return this.createStubParser(language);
  }
}
```

### Step 3: Testing & Validation
- A/B test parser outputs
- Benchmark performance
- Validate graph accuracy

### Step 4: Deprecation
- Mark stubs as deprecated
- Update documentation
- Remove in next major version

---

## Dependencies to Add

### Core Parsing
```json
{
  "dependencies": {
    "tree-sitter": "^0.20.6",
    "web-tree-sitter": "^0.20.8",
    "tree-sitter-typescript": "^0.20.3",
    "tree-sitter-python": "^0.20.4",
    "tree-sitter-go": "^0.20.0",
    "tree-sitter-rust": "^0.20.4"
  },
  "devDependencies": {
    "ts-morph": "^21.0.0",
    "@typescript/vfs": "^1.5.0",
    "@babel/parser": "^7.23.0",
    "@babel/traverse": "^7.23.0"
  }
}
```

### Performance & Caching
```json
{
  "dependencies": {
    "lru-cache": "^10.0.0",
    "p-limit": "^5.0.0",
    "piscina": "^4.0.0"  // Worker thread pool
  },
  "optionalDependencies": {
    "redis": "^4.6.0"
  }
}
```

### Testing
```json
{
  "devDependencies": {
    "vitest": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "benchmark": "^2.1.4"
  }
}
```

---

## Configuration Schema

### Parser Configuration
```typescript
interface ParserConfig {
  // Language-specific settings
  languages: {
    typescript: {
      parser: 'ts-morph' | 'tree-sitter';
      compilerOptions?: ts.CompilerOptions;
      maxFileSize?: number;
    };
    python: {
      parser: 'tree-sitter' | 'ast';
      version: '3.8' | '3.9' | '3.10' | '3.11';
    };
  };

  // Performance settings
  performance: {
    workerThreads: number;
    maxConcurrency: number;
    cacheStrategy: 'memory' | 'file' | 'redis' | 'multi';
    cacheTTL: number;
  };

  // Parsing behavior
  parsing: {
    incremental: boolean;
    errorRecovery: boolean;
    symbolResolution: boolean;
    typeInference: boolean;
  };

  // Output settings
  output: {
    includeSourceMaps: boolean;
    includeComments: boolean;
    includePositions: boolean;
  };
}
```

### Default Configuration
```typescript
const DEFAULT_CONFIG: ParserConfig = {
  languages: {
    typescript: {
      parser: 'tree-sitter',  // Fast by default
      maxFileSize: 1024 * 1024 // 1MB
    },
    python: {
      parser: 'tree-sitter',
      version: '3.10'
    }
  },
  performance: {
    workerThreads: 4,
    maxConcurrency: 10,
    cacheStrategy: 'memory',
    cacheTTL: 3600 // 1 hour
  },
  parsing: {
    incremental: true,
    errorRecovery: true,
    symbolResolution: false,  // Expensive
    typeInference: false      // Very expensive
  },
  output: {
    includeSourceMaps: false,
    includeComments: false,
    includePositions: true
  }
};
```

---

## API Evolution

### Current API (v0.1.0)
```typescript
const parser = new TypeScriptParser();
const result = await parser.parse(source, fileInfo);
// Returns mock data
```

### Proposed API (v1.0.0)
```typescript
// Simple usage
const parser = new TypeScriptParser();
const result = await parser.parse(source, fileInfo);
// Returns real AST-based graph

// Advanced usage
const parser = new TypeScriptParser({
  useTypeInference: true,
  incremental: true
});

// Parse with context
const context = new ParseContext({
  project: '/path/to/project',
  tsconfig: './tsconfig.json'
});
const result = await parser.parseWithContext(source, fileInfo, context);

// Incremental update
const updates = await parser.updateFile(filePath, edits);

// Batch parsing
const results = await parser.parseFiles(files, {
  parallel: true,
  progressCallback: (current, total) => console.log(`${current}/${total}`)
});
```

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Parser complexity | High | Medium | Start with Tree-sitter, add specialized later |
| Performance regression | High | Medium | Extensive benchmarking, gradual rollout |
| Memory leaks | High | Low | Worker isolation, memory monitoring |
| Breaking changes | Medium | Medium | Semantic versioning, migration guide |
| Language version compatibility | Medium | High | Multiple parser versions, configuration |

### Schedule Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Underestimated complexity | 2-4 weeks delay | Phased implementation, MVP first |
| Dependency issues | 1-2 weeks delay | Early dependency validation |
| Testing overhead | 1-2 weeks delay | Parallel test development |

---

## Success Metrics

### Functional Metrics
- ✅ Parse real TypeScript/JavaScript files
- ✅ Parse real Python files
- ✅ Generate accurate property graphs
- ✅ Support incremental updates
- ✅ Handle syntax errors gracefully

### Performance Metrics
- 📊 Parse 1000 files/minute (average size)
- 📊 < 2GB memory for 10k file project
- 📊 90%+ cache hit rate
- 📊 < 100ms incremental updates

### Quality Metrics
- 📊 95%+ AST node coverage
- 📊 90%+ edge detection accuracy
- 📊 < 1% parser crashes
- 📊 80%+ test coverage

---

## Next Steps

### Immediate Actions (This Week)
1. Set up Tree-sitter development environment
2. Create UnifiedAST data structures
3. Implement BaseParser abstract class
4. Write first integration test

### Short Term (2 Weeks)
5. Complete TypeScript parser with ts-morph
6. Implement basic caching layer
7. Create parser benchmarks
8. Document API changes

### Medium Term (1 Month)
9. Add Python parser
10. Implement incremental parsing
11. Set up worker threads
12. Create migration guide

### Long Term (3 Months)
13. Add Go and Rust parsers
14. Optimize performance
15. Release v1.0.0
16. Deprecate stub implementations

---

## Conclusion

This design provides a clear path from stub implementations to production-ready AST parsers. The phased approach minimizes risk while the hybrid parser strategy (Tree-sitter + specialized) provides both broad language support and deep analysis capabilities.

The key innovation is the unified AST representation that allows consistent graph generation while preserving language-specific information. Combined with incremental parsing and intelligent caching, this design will enable c3-parsing to handle large-scale codebases efficiently.

**Recommended Implementation Order**:
1. Tree-sitter for broad language support
2. TypeScript Compiler API for deep TS analysis
3. Incremental parsing with caching
4. Worker thread parallelization
5. Error recovery and graceful degradation

---

**Document Location**:
`/Users/samuelgleeson/dev/c3-parsing/.working/2025-11-14-1725-ast-parser-design.md`