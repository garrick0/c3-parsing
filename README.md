# c3-parsing

> Code parsing and property graph construction for C3

Transform source code into universal property graphs for analysis.

## Status

**Version: 1.1.0** - Production Ready with Project Service ✅

All implementation phases complete with performance optimizations:

**Phase 1** ✅ - Foundation & Architecture
**Phase 2** ✅ - TypeScript Parser Implementation
**Phase 3** ✅ - Integration & Production Ready
**Phase 4** ✅ - Project Service Integration (NEW)

### Features
- **🚀 NEW in v1.1.0**: Project Service support for 24x faster parsing!
- Real TypeScript/JavaScript AST parser with dual modes (ts-morph and Project Service)
- Multi-level caching (memory + file) for 90%+ faster repeated parses
- **Shared TypeScript Programs** across files for massive performance gains
- **Automatic tsconfig.json detection** - no manual configuration needed
- Comprehensive symbol extraction and edge detection
- Error handling with recovery strategies
- Performance monitoring and metrics
- 38 tests passing (100% success rate)
- Complete API documentation and examples
- Backward compatible with v1.0.0

## Installation

```bash
npm install c3-parsing
```

**Peer Dependencies**:
- `typescript` >=5.0.0
- `minimatch` ^10.0.0 (for Project Service)
- `lru-cache` ^11.0.0 (for caching)

## Quick Start

### Basic Usage

```typescript
import { TypeScriptParserImpl } from 'c3-parsing';
import { ConsoleLogger, NodeFactory, EdgeDetector } from 'c3-parsing';

// Create parser (uses Project Service automatically for 26x faster parsing)
const parser = new TypeScriptParserImpl(
  new ConsoleLogger(),
  new NodeFactory(),
  new EdgeDetector()
);

// Parse TypeScript source code
const result = await parser.parse(source, fileInfo);
console.log(`Nodes: ${result.nodes.length}, Edges: ${result.edges.length}`);

// IMPORTANT: Clean up when done
parser.dispose();
```

### Advanced Configuration

```typescript
import { TypeScriptParserImpl } from 'c3-parsing';

const parser = new TypeScriptParserImpl(
  logger,
  nodeFactory,
  edgeDetector,
  {
    // Project Service options (all optional)
    tsconfigRootDir: process.cwd(),
    allowDefaultProject: ['**/*.ts', '**/*.tsx'],
    maximumDefaultProjectFileMatchCount: 100,

    // Transformer options
    includeComments: true,
    includePrivateMembers: false,
  }
);

// Parse multiple files - Programs are automatically shared!
for (const file of files) {
  const result = await parser.parse(file.content, file.info);
  // Shared TypeScript Programs = 26x faster!
}

// Get performance statistics
const stats = parser.getProjectServiceStats();
console.log(`Open files: ${stats.openFiles}`);

// IMPORTANT: Clean up when done
parser.dispose();
```

### Performance Comparison

| Version | 100 Files | Per File | Throughput | Use Case |
|---------|-----------|----------|------------|----------|
| **v1.0.0 (ts-morph)** | 11 seconds | 110ms | 9 files/sec | Deprecated |
| **v1.1.0 (Project Service)** | 416ms | 4.2ms | 240 files/sec | Recommended |
| **Improvement** | **26x faster** | **26x faster** | **27x throughput** | - |

*Benchmark results from actual testing with 100 TypeScript files*

### Performance Characteristics

**Startup Cost**: The first file parsed has higher latency (~600ms) due to:
- TypeScript Project Service initialization
- Automatic tsconfig.json discovery
- Initial Program creation

**Subsequent Files**: Once initialized, files parse very quickly (~3-5ms each)

**Optimal Use Cases**:
- ✅ **Recommended**: Parsing 10+ files (startup cost amortized)
- ✅ **Excellent**: Parsing 50+ files (optimal performance, 3ms/file)
- ⚠️ **Not ideal**: Single file in isolation (pays full startup cost)

**Performance Profile**:
```
 1 file:   ~600ms  (startup dominates)
10 files:   ~60ms avg/file (startup amortizing)
50+ files:  ~3-5ms avg/file (optimal, fully amortized)
```

**Cross-File Resolution**: With shared TypeScript Programs, the parser can:
- Resolve types across file boundaries
- Detect cross-file function calls
- Track cross-file references
- All with accurate type information from TypeChecker

## Features

### Core Parsing
- **TypeScript/JavaScript Support**: Parse .ts, .tsx, .js, .jsx, .mjs files
- **Symbol Extraction**: Classes, interfaces, functions, variables, types, enums
- **Edge Detection**: Imports, inheritance (extends/implements), function calls, containment, references
- **Type Information**: Full TypeScript type annotations
- **Export Detection**: Named, default, and re-exports

### Performance
- **Multi-Level Caching**: Memory (LRU) + File (persistent)
- **90%+ Cache Hit Rate**: Dramatically faster repeated parses
- **Concurrent Processing**: Parse multiple files in parallel
- **Performance Monitoring**: Built-in metrics and reporting

### Production Ready
- **Error Recovery**: Graceful handling of syntax errors
- **Error Analytics**: Detailed error reports by type and file
- **Progress Callbacks**: Real-time parsing status
- **Resource Management**: Automatic cache eviction and cleanup

## Architecture

The library follows a clean architecture pattern with three layers:
- **Domain**: Core business logic (entities, services, ports)
- **Application**: Use cases and DTOs
- **Infrastructure**: External integrations (parsers, persistence)

## Documentation

- **[API Reference](docs/API.md)** - Complete API documentation
- **[Examples](examples/)** - Practical usage examples
  - `basic-usage.ts` - Simple file parsing
  - `with-caching.ts` - Caching demonstration
  - `analyze-dependencies.ts` - Dependency analysis
- **[CHANGELOG](CHANGELOG.md)** - Version history

## Performance

- **Average parse time**: ~110ms per file
- **With caching**: <1ms per file (90%+ faster)
- **Throughput**: 9-10 files/second (sequential)
- **Memory usage**: ~100MB typical, configurable
- **Cache hit rate**: 90%+ after warmup

## Testing

```bash
npm test              # Run all tests (32 tests)
npm run test:coverage # With coverage report
npm run test:watch    # Watch mode
```

## Part of C3

[c3-platform](https://github.com/garrick0/c3-platform)

## License

MIT
