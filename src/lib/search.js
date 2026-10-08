// lower-cases and strips accents so "René" and "rene" match; used both at
// build time (to prepare each card's search text) and in the browser (for the query)
export const normalize = (text = '') =>
  String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// true when every word of the query appears somewhere in the text
export const matches = (text, terms) => terms.every(term => text.includes(term));
