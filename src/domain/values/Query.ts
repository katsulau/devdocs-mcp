export class Query {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(input: string): Query {
    const v = (input || '').trim();
    if (!v) throw new Error('Query must not be empty');
    return new Query(v);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Query): boolean {
    return this.value === other.value;
  }
}

 
