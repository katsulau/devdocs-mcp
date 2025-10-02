import {McpToolResponse} from './types';
import {SearchHit} from "../domain/SearchHits.js";
import {DocumentLanguageCollection} from "../domain/values/DocumentLanguageCollection";

export function escapeUrlForMarkdown(url: string): string {
  if (!url || url === '#') return '#';

  let escapedUrl = url.replace(/ /g, '%20');
  escapedUrl = escapedUrl.replace(/\(/g, '%28').replace(/\)/g, '%29');
  escapedUrl = escapedUrl.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
  escapedUrl = escapedUrl.replace(/\{/g, '%7B').replace(/\}/g, '%7D');
  escapedUrl = escapedUrl.replace(/\+/g, '%2B');
  escapedUrl = escapedUrl.replace(/\|/g, '%7C');
  escapedUrl = escapedUrl.replace(/\\/g, '%5C');
  escapedUrl = escapedUrl.replace(/\^/g, '%5E');
  escapedUrl = escapedUrl.replace(/`/g, '%60');

  return escapedUrl;
}

// Search response converter
export function toSearchResponse(
  results: SearchHit[],
  options: {
    query: string;
    slug: string;
  }
): McpToolResponse {

  const formattedResults = results.map(result => ({
    title: result.title,
    displayUrl: escapeUrlForMarkdown(result.url || '#'),
    snippet: result.title,
    language: options.slug.toString(),
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        type: 'devdocs_result',
        query: options.query.toString(),
        slug: options.slug.toString(),
        results: formattedResults,
      })
    }]
  };
}

// Error response converter
export function toErrorResponse(message: string): McpToolResponse {
  return {
    content: [{
      type: 'text',
      text: message
    }]
  };
}

// Language not found error converter
export function toLanguageNotFoundError(
  requestedLanguage: string
): McpToolResponse {
  return toErrorResponse(`❌ Language "${requestedLanguage}" not found in available documentation.
  Please check http://localhost:9292 to see the list of available documentation.`);
}

// JSON response converter for available languages list
export function toAvailableLanguagesJsonResponse(
    resolvedCollection: DocumentLanguageCollection
): McpToolResponse {
  const resolvedLanguages = resolvedCollection.toArray().map(lang => ({
    name: lang.name,
    displayName: lang.displayName,
    slug: lang.slug,
    version: lang.version as unknown as string
  }));
  // Create slug list for instruction
  const slugList = resolvedLanguages.map(lang => lang.slug).join(', ');

  const jsonResponse = {
    type: 'available_languages',
    count: resolvedLanguages.length,
    total: resolvedLanguages.length,
    languages: resolvedLanguages.map(lang => ({
      name: lang.name,
      displayName: lang.displayName,
      slug: lang.slug,
      version: lang.version,
      displayUrl: `http://localhost:9292/${lang.slug}/`
    })),
    instruction: `Use these slug names for search_specific_docs: ${slugList}`
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(jsonResponse, null, 2)
    }]
  };
}