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

// gets the data we want and puts it into variables
const minifyRecord = record => {
  return {
    id: record.id,
    slug: record.fields.key,
    authorSlug: (record.fields.author && slugify(record.fields.author)) || null,
    fields: record.fields,
  };
};

export default async function getPosts() {
  const records = await table.select({}).all();
  return records.map(minifyRecord);
}
