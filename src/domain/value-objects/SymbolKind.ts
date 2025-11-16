/**
 * SymbolKind - Types of symbols in source code
 */

export enum SymbolKind {
  // Types
  CLASS = 'class',
  INTERFACE = 'interface',
  ENUM = 'enum',
  TYPE = 'type',

  // Functions
  FUNCTION = 'function',
  METHOD = 'method',
  CONSTRUCTOR = 'constructor',
  GETTER = 'getter',
  SETTER = 'setter',

  // Variables
  VARIABLE = 'variable',
  CONSTANT = 'constant',
  PARAMETER = 'parameter',
  PROPERTY = 'property',

  // Module
  MODULE = 'module',
  NAMESPACE = 'namespace',

  // Other
  UNKNOWN = 'unknown'
}

/**
 * Check if symbol kind represents a type
 */
export function isTypeSymbol(kind: SymbolKind): boolean {
  return [
    SymbolKind.CLASS,
    SymbolKind.INTERFACE,
    SymbolKind.ENUM,
    SymbolKind.TYPE
  ].includes(kind);
}

/**
 * Check if symbol kind represents a callable
 */
export function isCallableSymbol(kind: SymbolKind): boolean {
  return [
    SymbolKind.FUNCTION,
    SymbolKind.METHOD,
    SymbolKind.CONSTRUCTOR,
    SymbolKind.GETTER,
    SymbolKind.SETTER
  ].includes(kind);
}

/**
 * Check if symbol kind represents a value
 */
export function isValueSymbol(kind: SymbolKind): boolean {
  return [
    SymbolKind.VARIABLE,
    SymbolKind.CONSTANT,
    SymbolKind.PARAMETER,
    SymbolKind.PROPERTY
  ].includes(kind);
}

/**
 * Get display name for symbol kind
 */
export function getSymbolKindDisplayName(kind: SymbolKind): string {
  const displayNames: Record<SymbolKind, string> = {
    [SymbolKind.CLASS]: 'Class',
    [SymbolKind.INTERFACE]: 'Interface',
    [SymbolKind.ENUM]: 'Enum',
    [SymbolKind.TYPE]: 'Type',
    [SymbolKind.FUNCTION]: 'Function',
    [SymbolKind.METHOD]: 'Method',
    [SymbolKind.CONSTRUCTOR]: 'Constructor',
    [SymbolKind.GETTER]: 'Getter',
    [SymbolKind.SETTER]: 'Setter',
    [SymbolKind.VARIABLE]: 'Variable',
    [SymbolKind.CONSTANT]: 'Constant',
    [SymbolKind.PARAMETER]: 'Parameter',
    [SymbolKind.PROPERTY]: 'Property',
    [SymbolKind.MODULE]: 'Module',
    [SymbolKind.NAMESPACE]: 'Namespace',
    [SymbolKind.UNKNOWN]: 'Unknown'
  };

  return displayNames[kind] || 'Unknown';
}