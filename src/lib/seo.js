export const SITE_NAME = 'Quotebook';
export const SITE_DESCRIPTION = 'A personal collection of favourite quotes.';

// shortens text to roughly `max` characters on a word boundary
export const truncate = (text = '', max = 155) => {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(' ', max - 1)).replace(/[\s.,;:!?-]+$/, '') + '…';
};
