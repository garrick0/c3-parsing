/**
 * ASTTransformer - Port for transforming language-specific ASTs to unified representation
 */

import { ESTreeAST } from '../entities/ast/ESTreeAST.js';
import { FileInfo } from '../entities/FileInfo.js';

export interface ASTTransformer<TLanguageAST = any> {
  /**
   * Transform a language-specific AST to ESTree representation
   */
  transform(
    languageAST: TLanguageAST,
    fileInfo: FileInfo
  ): Promise<ESTreeAST>;

  /**
   * Get transformer name
   */
  getName(): string;

  /**
   * Get supported language
   */
  getSupportedLanguage(): string;
}