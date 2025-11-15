# API Documentation

## Table of Contents

- [Core Classes](#core-classes)
- [Parsers](#parsers)
- [Entities](#entities)
- [Caching](#caching)
- [Services](#services)
- [Utilities](#utilities)

---

## Core Classes

### TypeScriptParserImpl

The main TypeScript/JavaScript parser using ts-morph.

```typescript
class TypeScriptParserImpl extends BaseParser<SourceFile>
```

**Constructor:**
```typescript
constructor(
  logger: Logger,
  nodeFactory: NodeFactory,
  edgeDetector: EdgeDetector,
  options?: TypeScriptParserOptions
)
```

**Options:**
```typescript
interface TypeScriptParserOptions {
  compilerOptions?: ts.CompilerOptions;
  includeComments?: boolean;
  resolveModules?: boolean;
  extractTypes?: boolean;
}
```

**Methods:**
- `parse(source: string, fileInfo: FileInfo): Promise<ParseResult>` - Parse source code
- `supports(fileInfo: FileInfo): boolean` - Check if file is supported
- `getName(): string` - Get parser name
- `getSupportedExtensions(): string[]` - Get supported file extensions
- `clearCache(): void` - Clear internal parser cache

**Supported File Extensions:**
- `.ts` - TypeScript
- `.tsx` - TypeScript React
- `.js` - JavaScript
- `.jsx` - JavaScript React
- `.mjs` - JavaScript ES Module
- `.cjs` - JavaScript CommonJS

**Example:**
```typescript
const parser = new TypeScriptParserImpl(logger, nodeFactory, edgeDetector, {
  includeComments: true,
  resolveModules: true
});

const result = await parser.parse(source, fileInfo);
```

---

### ParserFactory

Factory for creating and managing parser instances.

```typescript
class ParserFactory
```

**Constructor:**
```typescript
constructor(options: ParserOptions)

interface ParserOptions {
  logger: Logger;
  nodeFactory?: NodeFactory;
  edgeDetector?: EdgeDetector;
  useStubParser?: boolean; // Deprecated
}
```

**Methods:**
- `createParser(language: Language | string): Parser` - Create parser for language
- `getParserForExtension(extension: string): Parser | null` - Get parser by file extension
- `registerParser(key: string, parser: Parser): void` - Register custom parser
- `getRegisteredParsers(): string[]` - List registered parsers

**Example:**
```typescript
const factory = new ParserFactory({
  logger: new ConsoleLogger()
});

const tsParser = factory.createParser('typescript');
const parserByExt = factory.getParserForExtension('.ts');
```

---

### ParsingService

High-level service for parsing codebases and managing caching.

```typescript
class ParsingService
```

**Constructor:**
```typescript
constructor(
  parsers: Parser[],
  graphRepository: GraphRepository,
  fileSystem: FileSystem,
  logger: Logger,
  cache?: Cache
)
```

**Methods:**
- `parseCodebase(rootPath: string, options?: ParsingOptions): Promise<PropertyGraph>` - Parse entire codebase
- `parseFile(filePath: string): Promise<ParseResult>` - Parse single file
- `getCachedGraph(codebaseId: string): Promise<PropertyGraph | undefined>` - Get cached graph
- `clearCache(): Promise<void>` - Clear parse cache
- `getCacheStats()` - Get cache statistics

**Parsing Options:**
```typescript
interface ParsingOptions {
  maxConcurrency?: number; // Default: 10
  excludePatterns?: string[]; // Default: ['node_modules', 'dist', ...]
  includePatterns?: string[];
  onProgress?: (current: number, total: number) => void;
}
```

**Example:**
```typescript
const service = new ParsingService(
  [parser],
  repository,
  fileSystem,
  logger,
  cacheManager
);

const graph = await service.parseCodebase('./src', {
  maxConcurrency: 20,
  excludePatterns: ['node_modules', 'dist'],
  onProgress: (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
});
```

---

## Parsers

### BaseParser

Abstract base class for all language parsers.

```typescript
abstract class BaseParser<TLanguageAST> implements Parser
```

**Abstract Methods:**
- `parseToLanguageAST(source: string, fileInfo: FileInfo): Promise<TLanguageAST>`
- `transformToUnified(ast: TLanguageAST, fileInfo: FileInfo): Promise<UnifiedAST>`

**Implemented Methods:**
- `parse(source: string, fileInfo: FileInfo): Promise<ParseResult>`
- `supports(fileInfo: FileInfo): boolean`

**Creating Custom Parser:**
```typescript
class MyCustomParser extends BaseParser<MyAST> {
  protected async parseToLanguageAST(source: string, fileInfo: FileInfo) {
    // Parse to language-specific AST
    return myLanguageParser.parse(source);
  }

  protected async transformToUnified(ast: MyAST, fileInfo: FileInfo) {
    // Transform to unified AST
    return myTransformer.transform(ast);
  }

  getName(): string {
    return 'MyCustomParser';
  }

  getSupportedExtensions(): string[] {
    return ['.myext'];
  }
}
```

---

## Entities

### PropertyGraph

Represents code as a property graph of nodes and edges.

```typescript
class PropertyGraph extends Entity<string>
```

**Constructor:**
```typescript
constructor(id: string, metadata: GraphMetadata)

interface GraphMetadata {
  codebaseId: string;
  parsedAt: Date;
  language: string;
  version: string;
}
```

**Methods:**
- `addNode(node: Node): void`
- `addEdge(edge: Edge): void`
- `getNode(id: string): Node | undefined`
- `getNodes(): Node[]`
- `getEdges(): Edge[]`
- `getEdgesFrom(nodeId: string): Edge[]`
- `getEdgesTo(nodeId: string): Edge[]`
- `getNodeCount(): number`
- `getEdgeCount(): number`
- `getStats(): { nodes, edges, avgDegree }`

**Example:**
```typescript
const graph = new PropertyGraph('graph-1', {
  codebaseId: './my-project',
  parsedAt: new Date(),
  language: 'typescript',
  version: '1.0.0'
});

graph.addNode(node);
graph.addEdge(edge);

console.log(graph.getStats());
```

### Node

Represents a code element in the property graph.

```typescript
class Node extends Entity<string>
```

**Constructor:**
```typescript
constructor(
  id: string,
  type: NodeType,
  name: string,
  metadata: NodeMetadata
)
```

**Node Types:**
```typescript
enum NodeType {
  FILE, DIRECTORY, MODULE, CLASS, INTERFACE,
  FUNCTION, METHOD, VARIABLE, CONSTANT,
  ENUM, TYPE, IMPORT, EXPORT
}
```

**Methods:**
- `getFilePath(): string`
- `getLineRange(): { start?: number; end?: number }`
- `isFile(): boolean`
- `isDirectory(): boolean`
- `isClass(): boolean`
- `isFunction(): boolean`
- `getDisplayName(): string`

### Edge

Represents a relationship between nodes.

```typescript
class Edge extends Entity<string>
```

**Constructor:**
```typescript
constructor(
  id: string,
  type: EdgeType,
  fromNodeId: string,
  toNodeId: string,
  metadata?: EdgeMetadata
)
```

**Edge Types:**
```typescript
enum EdgeType {
  DEPENDS_ON, IMPORTS, EXPORTS, CONTAINS,
  CALLS, EXTENDS, IMPLEMENTS, REFERENCES
}
```

**Methods:**
- `getWeight(): number`
- `isDependency(): boolean`
- `isImport(): boolean`
- `isContains(): boolean`
- `isCalls(): boolean`
- `getDisplayLabel(): string`

### UnifiedAST

Language-agnostic AST representation.

```typescript
interface UnifiedAST {
  root: ASTNode;
  language: Language;
  sourceFile: string;
  version: string;
  diagnostics: Diagnostic[];
  symbols: Map<string, Symbol>;
  imports: ImportInfo[];
  exports: ExportInfo[];
}
```

**Utility Functions:**
- `createUnifiedAST(root, language, sourceFile): UnifiedAST`
- `addDiagnostic(ast, diagnostic): void`
- `registerSymbol(ast, symbol): void`
- `addImport(ast, importInfo): void`
- `addExport(ast, exportInfo): void`
- `getSymbolsByKind(ast, kind): Symbol[]`
- `hasErrors(ast): boolean`
- `countNodes(ast): number`

---

## Caching

### CacheManager

Multi-level cache (memory + file) for parse results.

```typescript
class CacheManager implements Cache
```

**Constructor:**
```typescript
constructor(options: CacheOptions, logger?: Logger)

interface CacheOptions {
  memory?: MemoryCacheOptions;
  file?: FileCacheOptions;
  enableFileCache?: boolean;
}
```

**Methods:**
- `get(key: string): Promise<ParseResult | null>`
- `set(key: string, value: ParseResult): Promise<void>`
- `has(key: string): Promise<boolean>`
- `delete(key: string): Promise<void>`
- `clear(): Promise<void>`
- `getStats(): CacheStats`
- `generateKey(filePath: string, contentHash: string): string`
- `hashContent(content: string): string`

**Example:**
```typescript
const cache = new CacheManager({
  memory: {
    maxSize: 100 * 1024 * 1024, // 100MB
    ttl: 3600000 // 1 hour
  },
  enableFileCache: true,
  file: {
    directory: '.c3-cache',
    maxSize: 1024 * 1024 * 1024 // 1GB
  }
}, logger);

// Cache operates on two levels:
// L1: Memory (fast, limited size)
// L2: File (slower, larger capacity)

const cacheKey = cache.generateKey(filePath, cache.hashContent(source));
await cache.set(cacheKey, result);
const cached = await cache.get(cacheKey);
```

### MemoryCache

LRU-based in-memory cache.

**Options:**
```typescript
interface MemoryCacheOptions {
  maxSize?: number; // Max size in bytes (default: 100MB)
  maxItems?: number; // Max number of items (default: 1000)
  ttl?: number; // Time to live in ms (default: 1 hour)
}
```

**Methods:**
- `get(key: string): Promise<ParseResult | null>`
- `set(key: string, value: ParseResult): Promise<void>`
- `getSize(): number` - Current cache size in bytes
- `getItemCount(): number` - Number of cached items
- `prune(): Promise<number>` - Remove stale entries

### FileCache

Persistent file-based cache.

**Options:**
```typescript
interface FileCacheOptions {
  directory?: string; // Cache directory (default: '.c3-cache')
  maxSize?: number; // Max size in bytes (default: 1GB)
  compression?: boolean; // Enable compression (not yet implemented)
}
```

**Methods:**
- `initialize(): Promise<void>` - Initialize cache directory
- `get(key: string): Promise<ParseResult | null>`
- `set(key: string, value: ParseResult): Promise<void>`
- `getStats(): Promise<{ size, items, directory }>`

---

## Services

### GraphBuilder

Builder pattern for constructing property graphs.

```typescript
class GraphBuilder
```

**Methods:**
- `start(metadata: GraphMetadata): GraphBuilder`
- `addNode(node: Node): GraphBuilder`
- `addEdge(edge: Edge): GraphBuilder`
- `build(): PropertyGraph`
- `getNodeCount(): number`
- `getEdgeCount(): number`

**Example:**
```typescript
const graph = new GraphBuilder()
  .start({ codebaseId: 'my-project', ... })
  .addNode(node1)
  .addNode(node2)
  .addEdge(edge1)
  .build();
```

### NodeFactory

Factory for creating graph nodes.

```typescript
class NodeFactory
```

**Methods:**
- `createFileNode(filePath: string, metadata?: Partial<NodeMetadata>): Node`
- `createDirectoryNode(dirPath: string, metadata?: Partial<NodeMetadata>): Node`
- `createClassNode(className: string, filePath: string, metadata?: Partial<NodeMetadata>): Node`
- `createFunctionNode(functionName: string, filePath: string, metadata?: Partial<NodeMetadata>): Node`
- `reset(): void` - Reset internal counter

### EdgeDetector

Factory for creating graph edges.

```typescript
class EdgeDetector
```

**Methods:**
- `createDependencyEdge(fromNodeId: string, toNodeId: string): Edge`
- `createImportEdge(fromNodeId: string, toNodeId: string): Edge`
- `createContainsEdge(parentNodeId: string, childNodeId: string): Edge`
- `createCallsEdge(callerNodeId: string, calleeNodeId: string): Edge`
- `detectEdges(sourceCode: string, nodeId: string): Edge[]`
- `reset(): void` - Reset internal counter

---

## Utilities

### Language Detection

```typescript
enum Language {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  // ... more languages
}

function detectLanguage(extension: string): Language
```

**Example:**
```typescript
const lang = detectLanguage('.ts'); // Language.TYPESCRIPT
const lang2 = detectLanguage('.py'); // Language.PYTHON
```

### Performance Monitoring

```typescript
class PerformanceMonitor
```

**Methods:**
- `start(): void` - Start monitoring session
- `recordParse(metrics: ParseMetrics): void` - Record parse operation
- `getSummary(): PerformanceSummary` - Get performance summary
- `getReport(): string` - Get formatted report
- `getSlowestFiles(count: number): ParseMetrics[]`
- `getFastestFiles(count: number): ParseMetrics[]`
- `exportMetrics(): string` - Export as JSON

**Example:**
```typescript
const monitor = new PerformanceMonitor();
monitor.start();

// ... parse files ...

monitor.recordParse({
  file: 'example.ts',
  duration: 100,
  nodeCount: 50,
  edgeCount: 75
});

console.log(monitor.getReport());
```

### Error Handling

```typescript
class ErrorHandler
```

**Methods:**
- `handleError(error: Error, context): RecoveryResult`
- `getErrors(): ParserError[]`
- `getReport(): ErrorReport`
- `clearErrors(): void`
- `hasCriticalErrors(): boolean`
- `getErrorsForFile(filePath: string): ParserError[]`

**Error Types:**
```typescript
enum ErrorType {
  SYNTAX_ERROR,
  PARSE_ERROR,
  MEMORY_ERROR,
  TIMEOUT_ERROR,
  FILE_NOT_FOUND,
  UNSUPPORTED_LANGUAGE,
  UNKNOWN_ERROR
}
```

---

## Type Definitions

### ParseResult

Result of parsing a single file.

```typescript
interface ParseResult {
  nodes: any[]; // Array of extracted nodes
  edges: any[]; // Array of detected edges
  metadata: Record<string, any>; // Additional metadata
}
```

### FileInfo

Metadata about a file to be parsed.

```typescript
class FileInfo extends Entity<string> {
  constructor(
    id: string,
    path: string,
    extension: string,
    size: number,
    language: Language,
    lastModified: Date
  )
}
```

### Symbol

Represents a code symbol (class, function, variable, etc.).

```typescript
interface Symbol {
  id: string;
  name: string;
  kind: SymbolKind;
  nodeId: string;
  visibility?: 'public' | 'private' | 'protected';
  isExported?: boolean;
  type?: string;
}

enum SymbolKind {
  CLASS, INTERFACE, FUNCTION, VARIABLE,
  CONSTANT, ENUM, TYPE, METHOD, PROPERTY,
  PARAMETER, CONSTRUCTOR, GETTER, SETTER
}
```

---

## Advanced Usage

### Custom Compiler Options

```typescript
const parser = new TypeScriptParserImpl(logger, nodeFactory, edgeDetector, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    strict: true,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true
  },
  includeComments: true,
  resolveModules: true
});
```

### With Performance Monitoring

```typescript
const monitor = new PerformanceMonitor();
monitor.start();

for (const file of files) {
  const start = performance.now();
  const result = await parser.parse(source, fileInfo);
  const duration = performance.now() - start;

  monitor.recordParse({
    file: file.path,
    duration,
    nodeCount: result.nodes.length,
    edgeCount: result.edges.length
  });
}

console.log(monitor.getReport());
```

### With Error Handling

```typescript
const errorHandler = new ErrorHandler(logger);

try {
  const result = await parser.parse(source, fileInfo);
} catch (error) {
  const recovery = errorHandler.handleError(error as Error, {
    file: fileInfo.path,
    stage: 'parse'
  });

  if (recovery.recovered && recovery.fallbackResult) {
    // Use partial result
    result = recovery.fallbackResult;
  } else {
    // Skip file
    continue;
  }
}

// Check for critical errors
if (errorHandler.hasCriticalErrors()) {
  console.error('Critical errors encountered:', errorHandler.getReport());
}
```

---

## Best Practices

### 1. Always Use Caching for Production

```typescript
const cache = new CacheManager({
  memory: { maxSize: 100 * 1024 * 1024 },
  enableFileCache: true
}, logger);

const service = new ParsingService(parsers, repository, fs, logger, cache);
```

### 2. Handle Errors Gracefully

```typescript
const errorHandler = new ErrorHandler(logger);

try {
  await service.parseCodebase('./src');
} catch (error) {
  errorHandler.handleError(error as Error, { file: './src' });
}
```

### 3. Monitor Performance

```typescript
const monitor = new PerformanceMonitor();
monitor.start();

// ... parsing operations ...

const summary = monitor.getSummary();
if (summary.averageDuration > 200) {
  console.warn('Average parse time exceeds threshold');
}
```

### 4. Clean Up Resources

```typescript
// Clear caches when done
await cache.clear();

// Clear parser cache
parser.clearCache();

// Reset factories for fresh state
nodeFactory.reset();
edgeDetector.reset();
```

---

## Migration from v0.x

### From Stub Parsers

```typescript
// Old (v0.x - stub parsers)
import { TypeScriptParser } from 'c3-parsing';
const parser = new TypeScriptParser(); // Returns mock data

// New (v1.x - real parsers)
import { TypeScriptParserImpl, ConsoleLogger, NodeFactory, EdgeDetector } from 'c3-parsing';
const parser = new TypeScriptParserImpl(
  new ConsoleLogger(),
  new NodeFactory(),
  new EdgeDetector()
); // Returns real AST data
```

### Using ParserFactory

```typescript
// Old
const parser = new TypeScriptParser();

// New
const factory = new ParserFactory({ logger: new ConsoleLogger() });
const parser = factory.createParser('typescript');
```

---

## Performance Tips

1. **Enable Caching**: Reduces parse time by 90%+ for repeated files
2. **Use Batch Processing**: Parse multiple files with `parseCodebase()`
3. **Adjust Concurrency**: Tune `maxConcurrency` based on CPU cores
4. **Clear Cache Periodically**: Prevent unbounded cache growth
5. **Monitor Performance**: Track slow files and optimize

---

## Troubleshooting

### Issue: Slow Parsing

**Solution:**
- Enable caching
- Increase concurrency
- Exclude unnecessary files
- Check file sizes (large files are slower)

### Issue: Memory Usage

**Solution:**
- Reduce memory cache size
- Enable file cache
- Clear cache more frequently
- Process files in smaller batches

### Issue: Syntax Errors

**Solution:**
- Check TypeScript version compatibility
- Review compiler options
- Enable error recovery
- Check diagnostics in parse result

---

## API Reference Summary

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| TypeScriptParserImpl | Parse TS/JS files | parse(), supports() |
| ParserFactory | Create parsers | createParser(), getParserForExtension() |
| ParsingService | Parse codebases | parseCodebase(), parseFile() |
| CacheManager | Multi-level caching | get(), set(), getStats() |
| PropertyGraph | Graph container | addNode(), addEdge(), getStats() |
| GraphBuilder | Build graphs | start(), addNode(), build() |
| PerformanceMonitor | Track performance | recordParse(), getSummary() |
| ErrorHandler | Handle errors | handleError(), getReport() |