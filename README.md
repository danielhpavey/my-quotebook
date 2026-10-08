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
