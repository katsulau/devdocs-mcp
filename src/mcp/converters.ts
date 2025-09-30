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


