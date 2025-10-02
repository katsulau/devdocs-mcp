import {LanguageInfo, McpToolResponse} from './types';
import {SearchHit} from "../domain/SearchHits.js";
import {Slug} from "../domain/values/Slug.js";
import {Query} from "../domain/values/Query.js";

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

export function toDisplayUrl(devdocsUrl: string): string {
  const clean = devdocsUrl.replace('/docs/', '/');
  return clean.replace('devdocs:9292', 'localhost:9292');
}

// Search response converter
export function toSearchResponse(
  results: SearchHit[],
  options: {
    query: Query;
    slug: Slug;
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

// Availability guide converter
export function toAvailabilityGuide(
  language: LanguageInfo,
  baseUrl: string
): McpToolResponse {
  const devdocsUrl = baseUrl.replace('devdocs:9292', 'localhost:9292');
  const languageUrl = `${devdocsUrl}/${language.name}`;
  const escapedDevdocsUrl = escapeUrlForMarkdown(devdocsUrl);
  const escapedLanguageUrl = escapeUrlForMarkdown(languageUrl);
  const cleanLanguageUrl = escapedLanguageUrl.replace('/docs/', '/');

  const guideText = `📚 **${language.displayName} Documentation Setup**

Since DevDocs doesn't provide a direct download API, please follow these steps to access the documentation:

1. **Open DevDocs in your browser**: [${devdocsUrl}](${escapedDevdocsUrl})
2. **Navigate to ${language.displayName}**: [${languageUrl}](${cleanLanguageUrl})
3. **Browse the documentation** - it will be automatically loaded when you access it

**Available version for ${language.displayName}:**
- ${language.version}

Once you've accessed the documentation in your browser, you can use the \`search_specific_docs\` tool to search within it.

**Note**: The documentation is cached locally in the DevDocs container, so subsequent searches will be faster.`;

  return {
    content: [{
      type: 'text',
      text: guideText
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
  requestedLanguage: string,
  availableLanguages: LanguageInfo[]
): McpToolResponse {
  const availableNames = availableLanguages
    .slice(0, 10)
    .map(lang => lang.displayName)
    .join(', ');
  const moreCount = availableLanguages.length > 10 ? ` and ${availableLanguages.length - 10} more...` : '';

  return toErrorResponse(`❌ Language "${requestedLanguage}" not found in available documentation.

Available languages: ${availableNames}${moreCount}

Please check the language name and try again.`);
}

// JSON response converter for available languages list
export function toAvailableLanguagesJsonResponse(
  availableLanguages: LanguageInfo[]
): McpToolResponse {
  // Create slug list for instruction
  const slugList = availableLanguages.map(lang => lang.slug).join(', ');

  const jsonResponse = {
    type: 'available_languages',
    count: availableLanguages.length,
    total: availableLanguages.length,
    languages: availableLanguages.map(lang => ({
      name: lang.name,
      displayName: lang.displayName,
      slug: lang.slug,
      version: lang.version
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