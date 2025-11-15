/**
 * ASTTransformer - Port for transforming language-specific ASTs to unified representation
 */

import { UnifiedAST } from '../entities/ast/UnifiedAST.js';
import { FileInfo } from '../entities/FileInfo.js';

export interface ASTTransformer<TLanguageAST = any> {
  /**
   * Transform a language-specific AST to unified representation
   */
  transform(
    languageAST: TLanguageAST,
    fileInfo: FileInfo
  ): Promise<UnifiedAST>;

  /**
   * Get transformer name
   */
  getName(): string;

  /**
   * Get supported language
   */
  getSupportedLanguage(): string;
}