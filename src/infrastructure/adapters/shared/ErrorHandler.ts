/**
 * ErrorHandler - Centralized error handling and recovery
 */

import { Logger } from '../../mocks/c3-shared.js';
import { ParseResult } from '../../../domain/ports/Parser.js';
import { FileInfo } from '../../../domain/entities/FileInfo.js';

export enum ErrorType {
  SYNTAX_ERROR = 'syntax_error',
  PARSE_ERROR = 'parse_error',
  MEMORY_ERROR = 'memory_error',
  TIMEOUT_ERROR = 'timeout_error',
  FILE_NOT_FOUND = 'file_not_found',
  UNSUPPORTED_LANGUAGE = 'unsupported_language',
  UNKNOWN_ERROR = 'unknown_error'
}

export interface ParserError {
  type: ErrorType;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  severity: 'critical' | 'error' | 'warning';
  recoverable: boolean;
  originalError?: Error;
}

export interface RecoveryResult {
  recovered: boolean;
  fallbackResult?: ParseResult;
  action?: string;
}

export interface ErrorReport {
  totalErrors: number;
  byType: Record<string, number>;
  byFile: Record<string, number>;
  critical: ParserError[];
}

export class ErrorHandler {
  private errors: ParserError[] = [];

  constructor(private logger: Logger) {}

  /**
   * Handle an error and attempt recovery
   */
  handleError(
    error: Error,
    context: { file?: string; stage?: string }
  ): RecoveryResult {
    const parserError = this.categorizeError(error, context);
    this.errors.push(parserError);

    this.logger.error(`Parser error: ${parserError.message}`, error);

    // Attempt recovery based on error type
    return this.attemptRecovery(parserError, context);
  }

  /**
   * Categorize an error
   */
  private categorizeError(
    error: Error,
    context: { file?: string; stage?: string }
  ): ParserError {
    let type = ErrorType.UNKNOWN_ERROR;
    let severity: 'critical' | 'error' | 'warning' = 'error';
    let recoverable = false;

    const message = error.message.toLowerCase();

    if (message.includes('syntax') || message.includes('unexpected token')) {
      type = ErrorType.SYNTAX_ERROR;
      severity = 'warning';
      recoverable = true;
    } else if (message.includes('memory') || message.includes('heap')) {
      type = ErrorType.MEMORY_ERROR;
      severity = 'critical';
      recoverable = false;
    } else if (message.includes('timeout') || message.includes('timed out')) {
      type = ErrorType.TIMEOUT_ERROR;
      severity = 'error';
      recoverable = true;
    } else if (message.includes('enoent') || message.includes('not found')) {
      type = ErrorType.FILE_NOT_FOUND;
      severity = 'error';
      recoverable = false;
    } else if (message.includes('unsupported') || message.includes('no parser')) {
      type = ErrorType.UNSUPPORTED_LANGUAGE;
      severity = 'warning';
      recoverable = false;
    } else if (message.includes('parse') || message.includes('parsing')) {
      type = ErrorType.PARSE_ERROR;
      severity = 'error';
      recoverable = true;
    }

    return {
      type,
      message: error.message,
      file: context.file,
      severity,
      recoverable,
      originalError: error
    };
  }

  /**
   * Attempt to recover from an error
   */
  private attemptRecovery(
    error: ParserError,
    context: { file?: string; stage?: string }
  ): RecoveryResult {
    if (!error.recoverable) {
      return {
        recovered: false,
        action: 'skip_file'
      };
    }

    switch (error.type) {
      case ErrorType.SYNTAX_ERROR:
        this.logger.warn('Syntax error, returning partial result', {
          file: error.file
        });
        return {
          recovered: true,
          fallbackResult: this.createPartialResult(error.file),
          action: 'partial_parse'
        };

      case ErrorType.TIMEOUT_ERROR:
        this.logger.warn('Parse timeout, retrying with increased timeout', {
          file: error.file
        });
        return {
          recovered: true,
          action: 'retry_with_timeout'
        };

      case ErrorType.PARSE_ERROR:
        this.logger.warn('Parse error, attempting simplified parse', {
          file: error.file
        });
        return {
          recovered: true,
          fallbackResult: this.createPartialResult(error.file),
          action: 'simplified_parse'
        };

      default:
        return {
          recovered: false,
          action: 'skip_file'
        };
    }
  }

  /**
   * Create a partial parse result for error recovery
   */
  private createPartialResult(file?: string): ParseResult {
    return {
      nodes: [],
      edges: [],
      metadata: {
        error: true,
        partial: true,
        file
      }
    };
  }

  /**
   * Get all errors
   */
  getErrors(): ParserError[] {
    return [...this.errors];
  }

  /**
   * Get error report
   */
  getReport(): ErrorReport {
    const byType: Record<string, number> = {};
    const byFile: Record<string, number> = {};

    for (const error of this.errors) {
      byType[error.type] = (byType[error.type] || 0) + 1;

      if (error.file) {
        byFile[error.file] = (byFile[error.file] || 0) + 1;
      }
    }

    const critical = this.errors.filter(e => e.severity === 'critical');

    return {
      totalErrors: this.errors.length,
      byType,
      byFile,
      critical
    };
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Check if there are critical errors
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(e => e.severity === 'critical');
  }

  /**
   * Get errors for a specific file
   */
  getErrorsForFile(filePath: string): ParserError[] {
    return this.errors.filter(e => e.file === filePath);
  }
}