/**
 * SourceLocation - Represents a position in source code
 */

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
  file: string;
}

export interface SourceRange {
  start: number;
  end: number;
}

/**
 * Create a source location from line and column positions
 */
export function createSourceLocation(
  file: string,
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
  startOffset: number = 0,
  endOffset: number = 0
): SourceLocation {
  return {
    start: {
      line: startLine,
      column: startColumn,
      offset: startOffset
    },
    end: {
      line: endLine,
      column: endColumn,
      offset: endOffset
    },
    file
  };
}

/**
 * Check if a position is within a location
 */
export function isPositionInLocation(
  position: Position,
  location: SourceLocation
): boolean {
  if (position.line < location.start.line || position.line > location.end.line) {
    return false;
  }

  if (position.line === location.start.line && position.column < location.start.column) {
    return false;
  }

  if (position.line === location.end.line && position.column > location.end.column) {
    return false;
  }

  return true;
}

/**
 * Get the text range covered by a location
 */
export function getLocationRange(location: SourceLocation): SourceRange {
  return {
    start: location.start.offset,
    end: location.end.offset
  };
}