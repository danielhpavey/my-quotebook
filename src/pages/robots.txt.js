export function GET({ site }) {
  const lines = ['User-agent: *', 'Allow: /'];
  if (site) {
    lines.push('', `Sitemap: ${new URL('sitemap-index.xml', site)}`);
  }
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
