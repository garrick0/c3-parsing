/**
 * Symbol - Represents a symbol extracted from source code
 */

import { SymbolKind } from '../value-objects/SymbolKind.js';

export interface Symbol {
  id: string;
  name: string;
  kind: SymbolKind;
  nodeId: string;
  isExported: boolean;
  type?: string;
  documentation?: string;
}

