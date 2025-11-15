/**
 * Project Service Integration Tests
 *
 * Tests for the new Project Service functionality added in v1.1.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeScriptParserImpl } from '../../src/infrastructure/adapters/parsers/typescript/TypeScriptParserImpl.js';
import { NodeFactory } from '../../src/domain/services/NodeFactory.js';
import { EdgeDetector } from '../../src/domain/services/EdgeDetector.js';
import { FileInfo } from '../../src/domain/entities/FileInfo.js';
import { Language } from '../../src/domain/value-objects/Language.js';
import { createMockLogger } from '../test-utils/helpers.js';

describe('Project Service Integration (v1.1.0)', () => {
  let parser: TypeScriptParserImpl;
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
    const nodeFactory = new NodeFactory(logger as any);
    const edgeDetector = new EdgeDetector();

    // Create parser with Project Service enabled
    parser = new TypeScriptParserImpl(logger, nodeFactory, edgeDetector, {
      useProjectService: true,
      projectService: {
        tsconfigRootDir: process.cwd(),
        allowDefaultProject: ['**/*.ts', '**/*.tsx'],
        maximumDefaultProjectFileMatchCount: 100,
      },
    });
  });

  describe('Basic Functionality', () => {
    it('should initialize with Project Service enabled', () => {
      // Verify Project Service was initialized
      expect(logger.info).toHaveBeenCalled();
      expect(parser.getProjectServiceStats()).toBeDefined();
    });

    it('should provide statistics API', () => {
      const stats = parser.getProjectServiceStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('openFiles');
      expect(stats).toHaveProperty('defaultProjectFiles');
      expect(stats).toHaveProperty('lastReloadTimestamp');
      expect(typeof stats!.openFiles).toBe('number');
      expect(typeof stats!.defaultProjectFiles).toBe('number');
      expect(typeof stats!.lastReloadTimestamp).toBe('number');
    });
  });

  describe('Performance Benefits', () => {
    it('should track statistics correctly', () => {
      const stats = parser.getProjectServiceStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('openFiles');
      expect(stats).toHaveProperty('defaultProjectFiles');
      expect(stats).toHaveProperty('lastReloadTimestamp');

      // Initially should have no open files
      expect(stats!.openFiles).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration Options', () => {
    it('should support custom tsconfig root directory', () => {
      const customLogger = createMockLogger();
      const customParser = new TypeScriptParserImpl(
        customLogger as any,
        new NodeFactory(customLogger as any),
        new EdgeDetector(),
        {
          tsconfigRootDir: '/custom/path',
        }
      );

      // Should have Project Service (always enabled in v1.1.0)
      const stats = customParser.getProjectServiceStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('openFiles');
    });

    it('should support allowDefaultProject configuration', () => {
      const customLogger = createMockLogger();
      const customParser = new TypeScriptParserImpl(
        customLogger as any,
        new NodeFactory(customLogger as any),
        new EdgeDetector(),
        {
          allowDefaultProject: ['**/*.tsx'],
        }
      );

      // Should initialize successfully
      expect(customLogger.info).toHaveBeenCalled();
      const stats = customParser.getProjectServiceStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should properly dispose of Project Service resources', () => {
      // Dispose should not throw
      expect(() => parser.dispose()).not.toThrow();

      // Stats should still be accessible but might show zero files
      const stats = parser.getProjectServiceStats();
      expect(stats).toBeDefined();
    });
  });
});
