/**
 * Edge cases and syntax errors for error recovery testing
 */

// Syntax error: Missing closing brace
// class BrokenClass {
//   constructor() {
//   // Missing closing brace

// Empty class
export class EmptyClass {}

// Class with only private members
class PrivateOnly {
  private secret = 'hidden';
  private getSecret() {
    return this.secret;
  }
}

// Deeply nested structures
export class OuterClass {
  innerClass = class InnerClass {
    deeperClass = class DeeperClass {
      deepestMethod() {
        const localFunction = function() {
          const arrow = () => {
            return 'deep';
          };
          return arrow();
        };
        return localFunction();
      }
    };
  };
}

// Unicode identifiers
const 你好 = 'hello';
const مرحبا = 'hello';
const λ = (x: number) => x * 2;

// Complex type gymnastics
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// Conditional types
type IsArray<T> = T extends any[] ? true : false;
type ElementType<T> = T extends (infer E)[] ? E : never;

// Template literal types
type Color = 'red' | 'green' | 'blue';
type ColorShade<C extends Color> = `light-${C}` | `dark-${C}`;

// Circular reference (should be handled gracefully)
interface CircularA {
  b: CircularB;
  self?: CircularA;
}

interface CircularB {
  a: CircularA;
}

// Function overloads
export function process(x: string): string;
export function process(x: number): number;
export function process(x: boolean): boolean;
export function process(x: string | number | boolean): string | number | boolean {
  return x;
}

// Generator function
export function* fibonacci(): Generator<number> {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// Async generator
export async function* asyncCounter(): AsyncGenerator<number> {
  let i = 0;
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 100));
    yield i++;
  }
}

// Symbol usage
const mySymbol = Symbol('mySymbol');
export const symbolObj = {
  [mySymbol]: 'symbol value',
  [Symbol.iterator]: function* () {
    yield 1;
    yield 2;
  }
};

// BigInt literal
const bigNumber = 123456789012345678901234567890n;

// Nullish coalescing and optional chaining
export function safeAccess(obj?: { nested?: { value?: string } }): string {
  return obj?.nested?.value ?? 'default';
}

// Private fields (ES2022)
export class ModernClass {
  #privateField = 42;

  get #privateGetter() {
    return this.#privateField;
  }

  set #privateSetter(value: number) {
    this.#privateField = value;
  }

  usePrivate() {
    return this.#privateGetter;
  }
}

// Decorators (when supported)
/*
@sealed
@log
export class DecoratedClass {
  @readonly
  name = 'decorated';

  @deprecated
  oldMethod() {}
}
*/

// Assert signatures
function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg ?? 'Assertion failed');
  }
}

// Type predicates
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Index signatures
interface StringIndex {
  [key: string]: any;
  [index: number]: string;
}

// Construct signatures
interface Constructable {
  new (s: string): any;
}

// Call signatures
interface Callable {
  (x: number): string;
  property: boolean;
}