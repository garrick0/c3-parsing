/**
 * ESTreeAST - ESTree-based AST with TypeScript type information
 * 
 * This format uses industry-standard ESTree nodes while maintaining
 * full access to TypeScript's type checker via node maps.
 */

import type { TSESTree } from '@typescript-eslint/typescript-estree';
import type { ParserServices } from '@typescript-eslint/typescript-estree';
import * as ts from 'typescript';
import { Language } from '../../value-objects/Language.js';

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
}

export interface ESTreeAST {
  // ESTree AST root
  root: TSESTree.Program;
  
  // ParserServices provides bidirectional mapping between ESTree and TS AST
  services: ParserServices;
  
  // Metadata (same as before)
  language: Language;
  sourceFile: string;
  version: string;
  
  // Diagnostics (errors, warnings)
  diagnostics: Diagnostic[];
  
  // Keep track of imports/exports at AST level
  imports: ImportInfo[];
  exports: ExportInfo[];
}

// Helper interfaces (keep existing ones)
export interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ExportInfo {
  name: string;
  isDefault: boolean;
}

