/**
 * Mock c3-shared for Phase 1 development
 * This will be replaced with the actual c3-shared package
 */

export abstract class Entity<T> {
  constructor(protected readonly _id: T) {}

  get id(): T {
    return this._id;
  }

  equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (!(entity instanceof Entity)) {
      return false;
    }
    return this._id === entity._id;
  }
}

export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (!(vo instanceof ValueObject)) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}

export interface Logger {
  info(message: string, context?: any): void;
  debug(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, context?: any): void {
    console.log(`[INFO] ${message}`, context || '');
  }

  debug(message: string, context?: any): void {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  warn(message: string, context?: any): void {
    console.warn(`[WARN] ${message}`, context || '');
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
}