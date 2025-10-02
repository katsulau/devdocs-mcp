import {DocumentLanguage, OrderRule} from '../types';
import { Language } from './Language';
import { FuzzySearchStrategy } from "../FuzzySearchStrategy";

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

  orderByRules(rules: OrderRule[]): DocumentLanguageCollection {
    const ordered = [...this.items].sort((a, b) => {
      for (const rule of rules) {

        const aValue = a[rule.key];
        const bValue = b[rule.key];
        let comp = rule.matcher.compare(aValue, bValue);
        if (rule.direction === "desc") {
          comp = -comp;
        }
        if (comp !== 0) {
          return comp;
        }
      }
      return 0;
    });
    return new DocumentLanguageCollection(ordered);
  }


  /**
   * Fuzzy search using Fuse.js
   */
  findByFuzzySearch(searchTerm: Language, fuzzySearchStrategy: FuzzySearchStrategy): DocumentLanguageCollection {
    const matchedLanguages = fuzzySearchStrategy.search([...this.items], searchTerm);
    return new DocumentLanguageCollection(matchedLanguages);
  }


  /**
   * Take the first n items from the collection
   */
  take(count: number): DocumentLanguageCollection {
    return new DocumentLanguageCollection(this.items.slice(0, count));
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