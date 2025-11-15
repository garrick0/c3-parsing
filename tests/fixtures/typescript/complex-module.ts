/**
 * Complex module with various TypeScript features for comprehensive testing
 */

import { Entity } from 'c3-shared';
import * as path from 'path';
import type { Logger } from './types';

// Interfaces
export interface Config {
  apiUrl: string;
  timeout: number;
  retries?: number;
}

interface PrivateConfig extends Config {
  apiKey: string;
}

// Type aliases
export type Status = 'pending' | 'active' | 'completed' | 'failed';
export type Callback<T> = (error: Error | null, result?: T) => void;

// Enums
export enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

// Abstract class
export abstract class BaseService {
  protected abstract name: string;

  abstract process(data: any): Promise<void>;

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
}

// Generic class with decorators (commented as they need runtime support)
// @Injectable()
export class DataService<T> extends BaseService {
  protected name = 'DataService';
  private cache: Map<string, T> = new Map();

  constructor(
    private config: Config,
    private logger?: Logger
  ) {
    super();
  }

  async process(data: T): Promise<void> {
    this.log('Processing data');
    // Implementation
  }

  // Generic method
  async fetch<K extends keyof T>(key: K): Promise<T[K] | undefined> {
    const cached = this.cache.get(String(key));
    return cached?.[key];
  }

  // Method with optional and rest parameters
  async save(
    id: string,
    data: T,
    ...metadata: Array<{ key: string; value: any }>
  ): Promise<boolean> {
    try {
      this.cache.set(id, data);
      return true;
    } catch (error) {
      this.logger?.error('Save failed', error as Error);
      return false;
    }
  }
}

// Function declarations
export function createService(config: Config): DataService<any> {
  return new DataService(config);
}

export async function processWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError || new Error('Unknown error');
}

// Arrow functions
export const validateConfig = (config: Config): boolean => {
  return !!(config.apiUrl && config.timeout > 0);
};

// Namespace
export namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString();
  }

  export class Helper {
    static VERSION = '1.0.0';

    static help(): string {
      return 'Helper utility';
    }
  }
}

// Module augmentation
declare module 'c3-shared' {
  interface Entity {
    metadata?: Record<string, any>;
  }
}

// Default export
export default DataService;