/**
 * Parsing Context Public API
 */

// Entities
export * from './domain/entities/PropertyGraph.js';
export * from './domain/entities/Node.js';
export * from './domain/entities/Edge.js';
export * from './domain/entities/FileInfo.js';

// AST Entities
export * from './domain/entities/ast/UnifiedAST.js';
export * from './domain/entities/ast/ASTNode.js';
export * from './domain/entities/ast/SourceLocation.js';

// Value Objects
export * from './domain/value-objects/NodeType.js';
export * from './domain/value-objects/EdgeType.js';
export * from './domain/value-objects/FilePath.js';
export * from './domain/value-objects/Language.js';
// Note: SymbolKind is already exported from UnifiedAST

// Services
export * from './domain/services/ParsingService.js';
export * from './domain/services/GraphBuilder.js';
export * from './domain/services/NodeFactory.js';
export * from './domain/services/EdgeDetector.js';

// AST Services
export * from './domain/services/ast/ASTNormalizer.js';
export * from './domain/services/ast/GraphConverter.js';

// Ports
export * from './domain/ports/Parser.js';
export * from './domain/ports/GraphRepository.js';
export * from './domain/ports/FileSystem.js';
export * from './domain/ports/Cache.js';
export * from './domain/ports/ASTTransformer.js';
export * from './domain/ports/SymbolExtractor.js';

// Infrastructure - Parsers
export * from './infrastructure/adapters/parsers/typescript/index.js';
export * from './infrastructure/adapters/parsers/base/ParserFactory.js';

// Infrastructure - Caching
export * from './infrastructure/adapters/cache/CacheManager.js';
export * from './infrastructure/adapters/cache/MemoryCache.js';
export * from './infrastructure/adapters/cache/FileCache.js';

// Infrastructure - Utilities
export * from './infrastructure/adapters/shared/ErrorHandler.js';
export * from './infrastructure/adapters/shared/PerformanceMonitor.js';

// Infrastructure - Persistence
export * from './infrastructure/persistence/InMemoryGraphRepository.js';
