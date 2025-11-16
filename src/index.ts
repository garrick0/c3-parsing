/**
 * Parsing Context Public API
 */

// Entities
export * from './domain/entities/PropertyGraph.js';
export * from './domain/entities/Node.js';
export * from './domain/entities/Edge.js';
export * from './domain/entities/FileInfo.js';
export * from './domain/entities/Symbol.js';

// Export specific types
export type { SourceMetadata } from './domain/entities/Node.js';

// AST Entities
export * from './domain/entities/ast/ESTreeAST.js';
export * from './domain/entities/ast/SourceLocation.js';

// Re-export typescript-eslint types for convenience
export type { TSESTree, ParserServices } from '@typescript-eslint/typescript-estree';

// Value Objects
export * from './domain/value-objects/NodeType.js';
export * from './domain/value-objects/EdgeType.js';
export * from './domain/value-objects/FilePath.js';
export * from './domain/value-objects/Language.js';
export * from './domain/value-objects/SymbolKind.js';

// Export helper functions
export {
  isCodeNodeType,
  isGitNodeType,
  isFilesystemNodeType,
  isTestingNodeType,
  getNodeTypeDomain
} from './domain/value-objects/NodeType.js';

export {
  isCodeEdgeType,
  isGitEdgeType,
  getEdgeTypeDomain
} from './domain/value-objects/EdgeType.js';

// Services
export * from './domain/services/ParsingService.js';
export * from './domain/services/GraphBuilder.js';
export * from './domain/services/NodeFactory.js';
export * from './domain/services/EdgeDetector.js';

// AST Services
export * from './domain/services/ast/ESTreeGraphConverter.js';
export * from './domain/services/ast/ESTreeTraverser.js';

// Ports
export * from './domain/ports/Parser.js';
export * from './domain/ports/GraphRepository.js';
export * from './domain/ports/FileSystem.js';
export * from './domain/ports/Cache.js';
export * from './domain/ports/ASTTransformer.js';
export * from './domain/ports/SymbolExtractor.js';
export * from './domain/ports/GraphExtension.js';

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

// Infrastructure - Extensions
export * from './infrastructure/extensions/FilesystemExtension.js';
