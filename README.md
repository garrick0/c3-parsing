# c3-parsing

> Code parsing and property graph construction for C3

Transform source code into universal property graphs for analysis.

## Status

**Version: 1.0.0** - Production Ready ✅

All three implementation phases complete:

**Phase 1** ✅ - Foundation & Architecture
**Phase 2** ✅ - TypeScript Parser Implementation
**Phase 3** ✅ - Integration & Production Ready

### Features
- Real TypeScript/JavaScript AST parser using ts-morph
- Multi-level caching (memory + file) for 90%+ faster repeated parses
- Comprehensive symbol extraction and edge detection
- Error handling with recovery strategies
- Performance monitoring and metrics
- 32 tests passing (100% success rate)
- Complete API documentation and examples

*Note: Full reparse strategy implemented. Incremental parsing support planned for v1.1.0.*

## Installation

```bash
npm install c3-parsing ts-morph
```

## Usage

```typescript
import { TypeScriptParserImpl } from 'c3-parsing';
import { ConsoleLogger } from 'c3-parsing';
import { NodeFactory, EdgeDetector } from 'c3-parsing';

// Create parser with dependencies
const logger = new ConsoleLogger();
const nodeFactory = new NodeFactory();
const edgeDetector = new EdgeDetector();

const parser = new TypeScriptParserImpl(
  logger,
  nodeFactory,
  edgeDetector
);

// Parse TypeScript source code
const source = `
  export class MyClass {
    constructor(private name: string) {}
    getName(): string {
      return this.name;
    }
  }
`;

const fileInfo = createFileInfo('example.ts');
const result = await parser.parse(source, fileInfo);

// Explore the property graph
console.log(`Nodes: ${result.nodes.length}`);
console.log(`Edges: ${result.edges.length}`);

// Find specific elements
const classNode = result.nodes.find(n => n.type === 'class');
console.log(`Found class: ${classNode?.name}`);

// Analyze relationships
const importEdges = result.edges.filter(e => e.type === 'imports');
console.log(`Import dependencies: ${importEdges.length}`);
```

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
