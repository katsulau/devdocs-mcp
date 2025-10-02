import {ValidationError} from "../error/ValidationError.js";

export class Slug {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(input: string): Slug {
    const v = (input || '').trim();
    if (!v) throw new ValidationError('Slug must not be empty');
    if (!/^[a-z0-9~._-]+$/i.test(v)) {
      throw new ValidationError('Slug has invalid characters');
    }
    return new Slug(v);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}

 