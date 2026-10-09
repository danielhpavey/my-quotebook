import Airtable from 'airtable';

const base = new Airtable({
  apiKey: import.meta.env.AIRTABLE_API_KEY,
}).base(import.meta.env.AIRTABLE_BASE_ID);

const table = base(import.meta.env.AIRTABLE_TABLE_NAME);

// turns "Oscar Wilde" into "oscar-wilde" for use in URLs
export const slugify = text =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const MAX_SLUG_LENGTH = 60;

// shortens a slug to `max` characters, cutting at a hyphen so words stay whole
const shortenSlug = (slug, max = MAX_SLUG_LENGTH) => {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max + 1);
  const lastHyphen = cut.lastIndexOf('-');
  return lastHyphen > 0 ? cut.slice(0, lastHyphen) : slug.slice(0, max);
};

// builds a readable URL slug like "oscar-wilde-we-are-all-in-the-gutter".
// An optional "slug" field in Airtable overrides it, so a quote's URL can be
// pinned and won't change if its text or author is edited later.
const baseSlug = fields =>
  slugify(String(fields.slug ?? '')) ||
  shortenSlug(slugify(`${fields.author ?? ''} ${fields.quote ?? ''}`)) ||
  slugify(String(fields.key ?? ''));

// gets the data we want and puts it into variables
const minifyRecord = record => {
  return {
    id: record.id,
    authorSlug: (record.fields.author && slugify(record.fields.author)) || null,
    fields: record.fields,
  };
};

// gives every post a unique slug; pinned slugs from Airtable are claimed first,
// and any clash gets a number added ("…-2", "…-3")
const addSlugs = posts => {
  const used = new Set();
  const pinnedFirst = [...posts].sort((a, b) => Boolean(b.fields.slug) - Boolean(a.fields.slug));
  for (const post of pinnedFirst) {
    const base = baseSlug(post.fields) || post.id.toLowerCase();
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    post.slug = slug;
  }
  return posts;
};

export default async function getPosts() {
  const records = await table.select({}).all();
  return addSlugs(records.map(minifyRecord));
}
