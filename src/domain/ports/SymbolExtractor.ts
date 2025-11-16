/**
 * SymbolExtractor - Port for extracting symbols from AST
 */

import { Symbol } from '../entities/Symbol.js';
import { ESTreeAST } from '../entities/ast/ESTreeAST.js';

export interface ExtractedSymbols {
  classes: ClassSymbol[];
  interfaces: InterfaceSymbol[];
  functions: FunctionSymbol[];
  variables: VariableSymbol[];
  types: TypeSymbol[];
  enums: EnumSymbol[];
  imports: ImportSymbol[];
  exports: ExportSymbol[];
}

export interface ClassSymbol extends Symbol {
  extends?: string;
  implements?: string[];
  members?: Symbol[];
  isAbstract?: boolean;
}

export interface InterfaceSymbol extends Symbol {
  extends?: string[];
  members?: Symbol[];
}

export interface FunctionSymbol extends Symbol {
  parameters?: ParameterSymbol[];
  returnType?: string;
  isAsync?: boolean;
  isGenerator?: boolean;
}

export interface VariableSymbol extends Symbol {
  isConst?: boolean;
  isLet?: boolean;
  initializer?: string;
}

export interface TypeSymbol extends Symbol {
  aliasedType?: string;
}

export interface EnumSymbol extends Symbol {
  members?: EnumMember[];
}

export interface EnumMember {
  name: string;
  value?: string | number;
}

export interface ParameterSymbol {
  name: string;
  type?: string;
  isOptional?: boolean;
  isRest?: boolean;
  defaultValue?: string;
}

export interface ImportSymbol {
  source: string;
  specifiers: ImportSpecifierSymbol[];
  isTypeOnly?: boolean;
}

export interface ImportSpecifierSymbol {
  imported: string;
  local?: string;
  isDefault?: boolean;
  isNamespace?: boolean;
}

export interface ExportSymbol {
  name: string;
  localName?: string;
  isDefault?: boolean;
  isTypeOnly?: boolean;
  source?: string;
}

export interface SymbolExtractor {
  /**
   * Extract symbols from an ESTree AST
   */
  extractSymbols(ast: ESTreeAST): Promise<ExtractedSymbols>;

  /**
   * Get extractor name
   */
  getName(): string;
}