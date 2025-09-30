import { SearchHit, LanguageInfo, McpToolResponse } from './types';

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
    query: string;
    slug: string;
    maxResults: number;
    snippetLength: number;
  }
): McpToolResponse {
  const limited = results.slice(0, options.maxResults);
  const formattedResults = limited.map(result => ({
    title: result.title || 'Untitled',
    displayUrl: toDisplayUrl(escapeUrlForMarkdown(result.url || '#')),
    snippet: result.content 
      ? result.content.substring(0, options.snippetLength) + '...'
      : 'No content',
    language: options.slug.toLowerCase(),
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        type: 'devdocs_result',
        query: options.query,
        slug: options.slug,
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

**Available versions for ${language.displayName}:**
${language.versions.map(v => `- ${v.version}${v.isDefault ? ' (default)' : ''}`).join('\n')}

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
    }],
    isError: true
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


