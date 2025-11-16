# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-15

### 🚀 Major Performance Update

**BREAKING**: Removed ts-morph dependency - now uses native TypeScript API directly

### Added
- **TypeScript Project Service integration** for massive performance improvements
- Native TypeScript Compiler API usage (following typescript-eslint v8 patterns)
- Shared TypeScript Programs across files in same tsconfig
- Automatic tsconfig.json detection and resolution
- In-memory file system support for virtual files
- Cross-file type resolution using TypeChecker
- Helper functions for native TypeScript API (`nodeHelpers.ts`)
- New benchmarking suite (`benchmarks/performance.bench.ts`)
- ProjectServiceAdapter for managing TypeScript's Project Service
- ExpiringCache implementation with TTL support

### Changed
- **BREAKING**: Removed ts-morph dependency entirely
- **BREAKING**: All parsers now use Project Service (no fallback mode)
- TypeScriptParserImpl completely rewritten to use native TypeScript API
- TSASTTransformer refactored to work with ts.SourceFile + ts.Program
- TSSymbolExtractor refactored to use TypeChecker for symbol resolution
- TSEdgeDetector refactored to detect cross-file relationships
- Updated all tests to work with native TypeScript API (38 tests passing)
- Project Service ServerHost now supports in-memory files

### Performance
- **26x faster parsing** - 100 files in 416ms (vs 11,000ms in v1.0.0)
- **4.2ms per file** average (vs 110ms in v1.0.0)
- **Shared Programs** - 1-3 Programs for 100 files (vs 100 Programs in v1.0.0)
- **240+ files/second throughput** (vs 9 files/second in v1.0.0)
- Matches typescript-eslint v8 performance characteristics

### Removed
- ts-morph dependency (~10MB package size reduction)
- Dual-mode parser support (Project Service is now always used)
- ts-morph specific abstractions and wrappers

### Attribution
- Implementation adapted from typescript-eslint v8 (MIT License)
- Follows patterns from @typescript-eslint/project-service
- Uses TypeScript's official server APIs

### Migration from v1.0.0
- No API changes required - public interface unchanged
- TypeScriptParserImpl constructor signature compatible
- All existing code continues to work
- Performance automatically improved (no configuration needed)

## [1.0.0] - 2025-11-14

### Added
- Real TypeScript/JavaScript AST parser using ts-morph
- Comprehensive symbol extraction (classes, interfaces, functions, variables, types, enums)
- Edge detection for imports, inheritance, calls, containment, and references
- Multi-level caching system (memory + file)
- Performance monitoring and metrics
- Error handling and recovery strategies
- ParsingService for codebase-level parsing
- Unified AST representation for language-agnostic graph construction
- Complete test suite with 32+ passing tests
- API documentation and usage examples
- Support for ES6 modules, CommonJS, and TypeScript features

### Changed
- **BREAKING**: Real parsers are now used by default (stub parsers deprecated)
- **BREAKING**: Minimum Node.js version is now 18.0.0
- Updated ParserFactory to use real parsers by default
- Enhanced PropertyGraph with better statistics
- Improved error messages and diagnostics

### Deprecated
- Stub parsers (will be removed in v2.0.0)
- `useRealParser` option (real parsers are now default)

### Performance
- Average parse time: ~100ms per file
- Memory cache with LRU eviction
- File-based persistent cache
- Concurrent file processing support
- Cache hit rate typically >90% for repeated parses

### Fixed
- Memory leaks in parser instances
- Type inference issues with complex generics
- Edge detection for nested function calls

## [0.1.0] - 2025-11-14

### Added
- Initial release with stub implementations
- Basic architecture and domain models
- Stub TypeScript and Python parsers
- Property graph data structures
- Clean architecture with ports and adapters pattern