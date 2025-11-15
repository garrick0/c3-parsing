# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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