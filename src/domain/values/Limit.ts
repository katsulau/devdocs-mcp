export class Limit {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(input: unknown, defaults: { min?: number; max?: number; fallback?: number } = {}): Limit {
    const { min = 1, max = 50, fallback = 10 } = defaults;
    const n = typeof input === 'number' ? input : Number(input);
    const v = Number.isFinite(n) ? Math.trunc(n) : fallback;
    if (v < min) return new Limit(min);
    if (v > max) return new Limit(max);
    return new Limit(v);
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: Limit): boolean {
    return this.value === other.value;
  }
}

 
