/**
 * Simple class for testing basic parsing
 */

export class SimpleClass {
  private name: string;
  public age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  getAge(): number {
    return this.age;
  }

  setAge(age: number): void {
    this.age = age;
  }

  toString(): string {
    return `${this.name} (${this.age})`;
  }
}