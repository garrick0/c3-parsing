/**
 * Example: Using FilesystemExtension with c3-parsing
 * 
 * This example shows how to integrate filesystem metadata into the code graph.
 */

import {
  TypeScriptParserImpl,
  NodeFactory,
  EdgeDetector,
  ParsingService,
  InMemoryGraphRepository,
  FilesystemExtension
} from '../dist/index.js';
import { createLogger } from 'c3-shared';

async function main() {
  const logger = createLogger('FilesystemExample');
  
  // Create parsers
  const nodeFactory = new NodeFactory();
  const edgeDetector = new EdgeDetector();
  const typescriptParser = new TypeScriptParserImpl(
    logger,
    nodeFactory,
    edgeDetector,
    {
      tsconfigRootDir: process.cwd()
    }
  );
  
  // Create filesystem extension
  const filesystemExtension = new FilesystemExtension({
    includeHidden: false,
    maxDepth: 5,
    ignorePatterns: ['node_modules', '.git', 'dist', 'coverage']
  });
  
  logger.info('Extension metadata', {
    name: filesystemExtension.name,
    version: filesystemExtension.version,
    domain: filesystemExtension.domain,
    nodeTypes: filesystemExtension.nodeTypes.map(t => t.type),
    edgeTypes: filesystemExtension.edgeTypes.map(t => t.type)
  });
  
  // Create parsing service with extension
  const repository = new InMemoryGraphRepository();
  const parsingService = new ParsingService(
    [typescriptParser],
    repository,
    {} as any, // FileSystem interface
    logger,
    undefined,
    [filesystemExtension] // Pass extension here
  );
  
  // Parse codebase with filesystem extension
  const rootPath = process.cwd() + '/src';
  logger.info(`Parsing ${rootPath} with filesystem extension...`);
  
  const graph = await parsingService.parseCodebase(rootPath, {
    maxConcurrency: 5
  });
  
  // Analyze results
  logger.info('Parsing complete!', {
    totalNodes: graph.getNodeCount(),
    totalEdges: graph.getEdgeCount()
  });
  
  // Query by domain
  const codeNodes = graph.getNodesByDomain('code');
  const fsNodes = graph.getNodesByDomain('filesystem');
  
  logger.info('Nodes by domain', {
    code: codeNodes.length,
    filesystem: fsNodes.length
  });
  
  // Query by labels
  const filesystemObjects = graph.getNodesByLabel('FilesystemObject');
  const directories = graph.getNodesByLabel('Directory');
  const files = graph.getNodesByLabel('File');
  
  logger.info('Filesystem nodes by label', {
    filesystemObjects: filesystemObjects.length,
    directories: directories.length,
    files: files.length
  });
  
  // Get all domains
  const domains = graph.getAllDomains();
  logger.info('Domains in graph', { domains });
  
  // Get all labels
  const labels = graph.getAllLabels();
  logger.info('Labels in graph', { labels: labels.slice(0, 10) }); // First 10 labels
  
  // Example: Find largest files
  const fileNodes = fsNodes
    .filter(n => n.hasLabel('File'))
    .sort((a, b) => (b.metadata.size || 0) - (a.metadata.size || 0))
    .slice(0, 5);
  
  logger.info('Top 5 largest files', {
    files: fileNodes.map(n => ({
      name: n.name,
      size: n.metadata.size,
      path: n.metadata.relativePath
    }))
  });
  
  // Example: Find most recently modified
  const recentFiles = fsNodes
    .filter(n => n.hasLabel('File'))
    .sort((a, b) => {
      const aTime = a.metadata.modified?.getTime() || 0;
      const bTime = b.metadata.modified?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 5);
  
  logger.info('5 most recently modified files', {
    files: recentFiles.map(n => ({
      name: n.name,
      modified: n.metadata.modified,
      path: n.metadata.relativePath
    }))
  });
  
  // Clean up
  typescriptParser.dispose();
  
  logger.info('Example complete!');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

