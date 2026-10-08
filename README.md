# Quotebook

A static quote site built with [Astro](https://astro.build/), pulling quotes from Airtable at build time.

## Setup

Create a `.env` file with:

```
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
AIRTABLE_TABLE_NAME=...
HOST=https://your-site.example
```

## Commands

```bash
npm install
npm run dev      # dev server at http://localhost:4321
npm run build    # static build to ./dist
npm run preview  # preview the build
```

## Deploying to Cloudflare

The site is fully static: quotes are fetched from Airtable during the build, so
new or edited quotes appear after the next deploy.

### Workers (recommended for new projects)

`wrangler.jsonc` serves `./dist` as static assets. In the Cloudflare dashboard,
connect the repo under **Workers & Pages → Create → Import a repository** and use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

### Pages

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`

### Both

- Add `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` and `HOST`
  as **build** variables (mark the API key as a secret). `HOST` should be the
  production URL, e.g. `https://quotebook.example.com`.
- The Node version comes from `.node-version`.
- `public/_headers` sets security and caching headers.
