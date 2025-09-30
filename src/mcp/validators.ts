import { DownloadDocsInput, SearchSpecificDocsInput } from '../types/index.js';

export function validateDownloadDocsInput(args: unknown): DownloadDocsInput {
  const input = args as Record<string, unknown>;
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid arguments: expected object');
  }
  if (typeof input.language !== 'string') {
    throw new Error('Invalid arguments: language must be a string');
  }
  return {
    language: input.language,
    version: typeof input.version === 'string' ? input.version : undefined,
  };
}

export function validateSearchSpecificDocsInput(args: unknown): SearchSpecificDocsInput {
  const input = args as Record<string, unknown>;
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid arguments: expected object');
  }
  if (typeof input.slug !== 'string') {
    throw new Error('Invalid arguments: slug must be a string');
  }
  if (typeof input.query !== 'string') {
    throw new Error('Invalid arguments: query must be a string');
  }
  return {
    slug: input.slug,
    query: input.query,
    limit: typeof input.limit === 'number' ? input.limit : undefined
  };
}


