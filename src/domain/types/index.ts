export interface DocumentLanguage {
  name: string;           // "python", "javascript"
  displayName: string;    // "Python", "JavaScript"  
  version: string;
  slug: string;          // Optional slug for API use
  type: string;          // e.g., "programming", "markup"
  alias: string;
}