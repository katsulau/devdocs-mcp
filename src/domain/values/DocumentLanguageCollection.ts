import {DocumentLanguage} from '../types';

/**
 * Collection class for DocumentLanguage with rich search capabilities
 */
export class DocumentLanguageCollection {
  private constructor(private readonly items: readonly DocumentLanguage[]) {}

  /**
   * Create a new collection from an array of languages
   */
  static from(languages: DocumentLanguage[]): DocumentLanguageCollection {
    return new DocumentLanguageCollection(languages);
  }

  /**
   * Check if collection is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Get the size of the collection
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Convert to plain array
   */
  toArray(): DocumentLanguage[] {
    return [...this.items];
  }
}